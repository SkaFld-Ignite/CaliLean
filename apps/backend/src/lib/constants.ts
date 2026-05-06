import { loadEnv } from '@medusajs/framework/utils'

import { assertValue } from 'utils/assert-value'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

/**
 * Is development environment
 */
export const IS_DEV = process.env.NODE_ENV === 'development'

/**
 * Public URL for the backend
 */
export const BACKEND_URL = process.env.BACKEND_PUBLIC_URL ?? process.env.RAILWAY_PUBLIC_DOMAIN_VALUE ?? '/'

/**
 * Database URL for Postgres instance used by the backend
 */
export const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://localhost/medusa'

/**
 * (optional) Redis URL for Redis instance used by the backend
 */
export const REDIS_URL = process.env.REDIS_URL;

/**
 * Admin CORS origins
 */
export const ADMIN_CORS = process.env.ADMIN_CORS;

/**
 * Auth CORS origins
 */
export const AUTH_CORS = process.env.AUTH_CORS;

/**
 * Store/frontend CORS origins
 */
export const STORE_CORS = process.env.STORE_CORS;

/**
 * JWT Secret used for signing JWT tokens
 */
export const JWT_SECRET = process.env.JWT_SECRET ?? 'supersecret'

/**
 * Cookie secret used for signing cookies
 */
export const COOKIE_SECRET = process.env.COOKIE_SECRET ?? 'supersecret'

/**
 * (optional) Minio configuration for file storage
 */
export const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT;
export const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
export const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;
export const MINIO_BUCKET = process.env.MINIO_BUCKET; // Optional, if not set bucket will be called: medusa-media

/**
 * (optional) Dedicated MinIO bucket + public base URL for COA artifacts.
 * Falls back to defaults so admin upload route works locally before SKA-31 S1
 * provisions the production bucket.
 */
export const MINIO_COA_BUCKET = process.env.MINIO_COA_BUCKET || 'coa';
export const COA_PUBLIC_BASE = process.env.COA_PUBLIC_BASE || 'https://s3.calilean.com';

/**
 * (optional) Resend API Key and from Email - do not set if using SendGrid
 */
export const RESEND_API_KEY = process.env.RESEND_API_KEY;
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM;

/**
 * (optionl) SendGrid API Key and from Email - do not set if using Resend
 */
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
export const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.SENDGRID_FROM;

/**
 * (optional) Stripe API key and webhook secret
 */
export const STRIPE_API_KEY = process.env.STRIPE_API_KEY;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * (optional) NMI payment gateway — ACH/eCheck processing for high-risk merchants.
 * Get sandbox keys at https://guide.nmi.com
 */
export const NMI_API_KEY = process.env.NMI_API_KEY;
export const NMI_TOKENIZATION_KEY = process.env.NMI_TOKENIZATION_KEY;
export const NMI_SANDBOX = process.env.NMI_SANDBOX;

/**
 * (optional) Meilisearch configuration
 */
export const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST;
export const MEILISEARCH_ADMIN_KEY = process.env.MEILISEARCH_ADMIN_KEY;

/**
 * (optional) ShipStation API key for fulfillment integration
 */
export const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY;

/**
 * (optional) Segment write key for analytics tracking
 */
export const SEGMENT_WRITE_KEY = process.env.SEGMENT_WRITE_KEY;

/**
 * (optional) Sentry DSN for error monitoring
 */
export const SENTRY_DSN = process.env.SENTRY_DSN;

/**
 * (optional) Sanity CMS configuration
 */
export const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;
export const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
export const SANITY_DATASET = process.env.SANITY_DATASET;
export const SANITY_STUDIO_URL = process.env.SANITY_STUDIO_URL;

/**
 * Worker mode
 */
export const WORKER_MODE =
  (process.env.MEDUSA_WORKER_MODE as 'worker' | 'server' | 'shared' | undefined) ?? 'shared'

/**
 * Disable Admin
 */
export const SHOULD_DISABLE_ADMIN = process.env.MEDUSA_DISABLE_ADMIN === 'true'

/**
 * (optional) Google OAuth credentials for social login
 */
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

/**
 * (optional) Google API Key for AI Studio
 */
export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

