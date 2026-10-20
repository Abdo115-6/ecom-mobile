import fs from 'fs';
import path from 'path';
import type pg from 'pg';
import { initAuthCreds, BufferJSON, proto } from '@whiskeysockets/baileys';
import type { AuthenticationCreds, AuthenticationState, SignalDataTypeMap } from '@whiskeysockets/baileys';

// WhatsApp session storage that survives restarts and redeploys.
// PostgreSQL when available (container disks are wiped on every deploy), else a folder outside /public.

export interface WaStore {
  read<T = any>(id: string): Promise<T | null>;
  write(id: string, value: unknown): Promise<void>;
  remove(id: string): Promise<void>;
  clearAuth(): Promise<void>;
  backend: 'postgres' | 'file';
}

const fixId = (id: string) => id.replace(/\//g, '__').replace(/:/g, '-');

function fileStore(dir: string): WaStore {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const fileOf = (id: string) => path.join(dir, `${fixId(id)}.json`);
  return {
    backend: 'file',
    async read(id) {
      try {
        return JSON.parse(await fs.promises.readFile(fileOf(id), 'utf-8'), BufferJSON.reviver);
      } catch {
        return null;
      }
    },
    async write(id, value) {
      await fs.promises.writeFile(fileOf(id), JSON.stringify(value, BufferJSON.replacer));
    },
    async remove(id) {
      await fs.promises.unlink(fileOf(id)).catch(() => {});
    },
    async clearAuth() {
      for (const f of await fs.promises.readdir(dir).catch(() => [] as string[])) {
        if (!f.startsWith('shop-')) await fs.promises.unlink(path.join(dir, f)).catch(() => {});
      }
    }
  };
}

function postgresStore(pool: pg.Pool): WaStore {
  return {
    backend: 'postgres',
    async read(id) {
      const r = await pool.query('SELECT data FROM whatsapp_store WHERE id = $1', [fixId(id)]);
      return r.rows[0] ? JSON.parse(r.rows[0].data, BufferJSON.reviver) : null;
    },
    async write(id, value) {
      await pool.query(
        `INSERT INTO whatsapp_store (id, data, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [fixId(id), JSON.stringify(value, BufferJSON.replacer)]
      );
    },
    async remove(id) {
      await pool.query('DELETE FROM whatsapp_store WHERE id = $1', [fixId(id)]);
    },
    async clearAuth() {
      // shop-* rows (outbox, processed message ids) are kept
      await pool.query(`DELETE FROM whatsapp_store WHERE id NOT LIKE 'shop-%'`);
    }
  };
}

/** Picks Postgres when connected; copies an existing file session into it once so no re-scan is needed */
export async function createWaStore(opts: { pool: pg.Pool; usePostgres: boolean; fileDir: string; legacyDirs: string[] }): Promise<WaStore> {
  // Move a session left in the old public folder (it must never be web-accessible)
  const local = fileStore(opts.fileDir);
  for (const legacy of opts.legacyDirs) {
    if (!fs.existsSync(path.join(legacy, 'creds.json')) || fs.existsSync(path.join(opts.fileDir, 'creds.json'))) continue;
    for (const f of fs.readdirSync(legacy)) {
      fs.copyFileSync(path.join(legacy, f), path.join(opts.fileDir, f));
    }
    fs.rmSync(legacy, { recursive: true, force: true });
    console.log(`[WhatsApp] Session moved from ${legacy} to ${opts.fileDir}`);
  }

  if (!opts.usePostgres) return local;

  try {
    await opts.pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_store (
        id VARCHAR(255) PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const pgStore = postgresStore(opts.pool);
    const hasPgCreds = await pgStore.read('creds');
    const localFiles = fs.readdirSync(opts.fileDir).filter(f => f.endsWith('.json'));
    if (!hasPgCreds && localFiles.includes('creds.json')) {
      for (const f of localFiles) {
        const raw = fs.readFileSync(path.join(opts.fileDir, f), 'utf-8');
        await pgStore.write(f.replace(/\.json$/, ''), JSON.parse(raw, BufferJSON.reviver));
      }
      console.log(`[WhatsApp] Local session copied to PostgreSQL (${localFiles.length} entries)`);
    }
    return pgStore;
  } catch (err: any) {
    console.warn('[WhatsApp] PostgreSQL session store unavailable, using files:', err.message);
    return local;
  }
}

/** Baileys auth state (same layout as useMultiFileAuthState) on top of a WaStore */
export async function useStoreAuthState(store: WaStore): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
  const creds: AuthenticationCreds = (await store.read('creds')) || initAuthCreds();
  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [id: string]: SignalDataTypeMap[typeof type] } = {};
          await Promise.all(ids.map(async id => {
            let value = await store.read(`${type}-${id}`);
            if (type === 'app-state-sync-key' && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            data[id] = value;
          }));
          return data;
        },
        set: async (data: any) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? store.write(key, value) : store.remove(key));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: () => store.write('creds', creds)
  };
}
