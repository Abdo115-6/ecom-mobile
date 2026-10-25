import Anthropic from '@anthropic-ai/sdk';

// Claude backend for the WhatsApp sales assistant, used instead of Gemini when ANTHROPIC_API_KEY is set

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';

let client: Anthropic | null = null;
export const isClaudeConfigured = () => !!process.env.ANTHROPIC_API_KEY;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

// Same answer shape as the Gemini prompt asks for; the API guarantees it matches this schema
const REPLY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'needsHuman', 'reason', 'video', 'order'],
  properties: {
    reply: { type: 'string' },
    needsHuman: { type: 'boolean' },
    reason: { type: 'string' },
    video: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    order: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          additionalProperties: false,
          required: ['productSlug', 'quantity', 'fullName', 'city', 'address'],
          properties: {
            productSlug: { type: 'string' },
            quantity: { type: 'integer' },
            fullName: { type: 'string' },
            city: { type: 'string' },
            address: { type: 'string' }
          }
        }
      ]
    }
  }
};

/**
 * One reply from Claude as the parsed JSON object, or throws with a readable reason.
 * `stableSystem` (rules + catalog) is cached between messages; `chatSystem` holds this chat's own context.
 */
export async function claudeSalesReply(opts: {
  stableSystem: string;
  chatSystem: string;
  messages: Anthropic.Beta.BetaMessageParam[];
}): Promise<any> {
  const system: Anthropic.Beta.BetaTextBlockParam[] = [
    { type: 'text', text: opts.stableSystem, cache_control: { type: 'ephemeral' } }
  ];
  if (opts.chatSystem.trim()) system.push({ type: 'text', text: opts.chatSystem });

  try {
    const response = await getClient().beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      // A WhatsApp chat reply needs little reasoning: low effort keeps it fast and cheap
      output_config: { effort: 'low', format: { type: 'json_schema', schema: REPLY_SCHEMA } },
      // A safety decline is retried server-side on Anthropic's recommended fallback model
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      messages: opts.messages
    });

    if (response.stop_reason === 'refusal') throw new Error('Claude a refusé de répondre');
    if (response.stop_reason === 'max_tokens') throw new Error('réponse coupée (max_tokens)');
    const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')?.text || '';
    return JSON.parse(text);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new Error('ANTHROPIC_API_KEY invalide');
    if (err instanceof Anthropic.RateLimitError) throw new Error('limite Claude atteinte, réessayez dans un moment');
    if (err instanceof Anthropic.APIError) throw new Error(`Claude ${err.status} : ${err.message}`);
    throw err;
  }
}
