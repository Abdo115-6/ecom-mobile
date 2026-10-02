# 7. Environment Variables Specification

Below is the comprehensive list of environment variables required for production deployment across the Frontend (Next.js/React), Backend (Spring Boot 3), Database, and Marketing integrations.

## Backend (Spring Boot / Java 21)

```bash
# Server Configuration
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=prod

# PostgreSQL Database
DATABASE_URL=jdbc:postgresql://postgres:5432/ecommerce_db
DATABASE_USERNAME=postgres_user
DATABASE_PASSWORD=SuperSecurePostgresPassword2026!
DATABASE_MAX_POOL_SIZE=20

# Redis Cache & Sessions
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=SecureRedisAuthToken2026!

# JWT Security
JWT_SECRET=c2VjdXJlX2p3dF9zaWduaW5nX2tleV9mb3JfYXVyYV9lY29tbWVyY2VfcGxhdGZvcm1fMjAyNg==
JWT_EXPIRATION_MS=900000        # 15 minutes
JWT_REFRESH_EXPIRATION_MS=604800000 # 7 days

# Object Storage (MinIO / S3)
STORAGE_ENDPOINT=http://minio:9000
STORAGE_BUCKET_NAME=aura-ecommerce-media
STORAGE_ACCESS_KEY=minio_access_key
STORAGE_SECRET_KEY=minio_secret_password_key
STORAGE_CDN_URL=https://cdn.aura-commerce.com

# Meta Conversions API (CAPI)
META_PIXEL_ID=982348273619284
META_ACCESS_TOKEN=EAA...
META_TEST_EVENT_CODE=TEST63819

# TikTok Events API
TIKTOK_PIXEL_ID=C1234567890ABCDEFGH
TIKTOK_ACCESS_TOKEN=act_...

# Snapchat Conversions API
SNAP_PIXEL_ID=snap-pix-9821381-abcd
SNAP_ACCESS_TOKEN=snap_token_...

# Google Analytics & Ads
GOOGLE_MEASUREMENT_ID=G-XXXXXXXXXX
GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXXX
GOOGLE_ADS_CONVERSION_LABEL=AbCdEfGhIjKlMnOpQr

# WhatsApp Business Cloud API
WHATSAPP_PHONE_NUMBER_ID=109827364518293
WHATSAPP_BUSINESS_ACCOUNT_ID=726152938471625
WHATSAPP_API_TOKEN=EAAB...
WHATSAPP_PHONE_NUMBER=+212600112233
WHATSAPP_DEFAULT_LOCALE=fr

# BigQuery / Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=/app/config/gcp-sa-key.json
BIGQUERY_PROJECT_ID=aura-commerce-data
BIGQUERY_DATASET=ecommerce_analytics
```

## Frontend (Next.js / Vite SPA)

```bash
# Public API Endpoint
VITE_API_BASE_URL=https://api.aura-commerce.com/api/v1

# Client-Side Tracking Pixels (Non-sensitive IDs)
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GTM_ID=GTM-XXXXXXX
VITE_META_PIXEL_ID=982348273619284
VITE_TIKTOK_PIXEL_ID=C1234567890ABCDEFGH
VITE_SNAPCHAT_PIXEL_ID=snap-pix-9821381-abcd

# Store Configuration Defaults
VITE_DEFAULT_CURRENCY=MAD
VITE_DEFAULT_LOCALE=fr
VITE_WHATSAPP_PHONE=+212600112233
```
