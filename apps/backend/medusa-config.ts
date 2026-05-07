// build: 2026-05-04
import { loadEnv, Modules, ContainerRegistrationKeys, defineConfig } from '@medusajs/framework/utils';
import {
  ADMIN_CORS,
  AUTH_CORS,
  BACKEND_URL,
  COOKIE_SECRET,
  DATABASE_URL,
  JWT_SECRET,
  REDIS_URL,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  SHOULD_DISABLE_ADMIN,
  STORE_CORS,
  STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET,
  WORKER_MODE,
  MINIO_ENDPOINT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MEILISEARCH_HOST,
  MEILISEARCH_ADMIN_KEY,
  SHIPSTATION_API_KEY,
  SEGMENT_WRITE_KEY,
  SANITY_API_TOKEN,
  SANITY_PROJECT_ID,
  SANITY_DATASET,
  SANITY_STUDIO_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  NMI_API_KEY,
  NMI_TOKENIZATION_KEY,
  NMI_SANDBOX,
  GOOGLE_API_KEY,
  ERP_ENCRYPTION_KEY
} from './src/lib/constants';


loadEnv(process.env.NODE_ENV || 'development', process.cwd());

const medusaConfig = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: REDIS_URL,
    workerMode: WORKER_MODE,
    http: {
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS,
      storeCors: STORE_CORS,
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET
    },
    build: {
      rollupOptions: {
        external: ["@medusajs/dashboard", "@medusajs/admin-shared"]
      }
    }
  },
  admin: {
    backendUrl: BACKEND_URL,
    disable: SHOULD_DISABLE_ADMIN,
  },
  modules: [
    {
      key: Modules.FILE,
      resolve: '@medusajs/file',
      options: {
        providers: [
          ...(MINIO_ENDPOINT && MINIO_ACCESS_KEY && MINIO_SECRET_KEY ? [{
            resolve: '@medusajs/medusa/file-s3',
            id: 's3',
            options: {
              file_url: `https://${MINIO_ENDPOINT}/${MINIO_BUCKET || 'medusa-media'}`,
              access_key_id: MINIO_ACCESS_KEY,
              secret_access_key: MINIO_SECRET_KEY,
              region: 'us-east-1',
              bucket: MINIO_BUCKET || 'medusa-media',
              endpoint: `https://${MINIO_ENDPOINT}`,
              additional_client_config: {
                forcePathStyle: true,
              },
            }
          }] : [{
            resolve: '@medusajs/file-local',
            id: 'local',
            options: {
              upload_dir: 'static',
              backend_url: `${BACKEND_URL}/static`
            }
          }])
        ]
      }
    },
    ...(REDIS_URL ? [{
      key: Modules.EVENT_BUS,
      resolve: '@medusajs/event-bus-redis',
      options: {
        redisUrl: REDIS_URL
      }
    },
    {
      key: Modules.WORKFLOW_ENGINE,
      resolve: '@medusajs/workflow-engine-redis',
      options: {
        redis: {
          redisUrl: REDIS_URL,
        }
      }
    }] : []),
    // Caching Module with Redis (v2.11+)
    ...(REDIS_URL ? [{
      resolve: '@medusajs/medusa/caching',
      options: {
        providers: [{
          resolve: '@medusajs/caching-redis',
          id: 'caching-redis',
          is_default: true,
          options: {
            redisUrl: REDIS_URL,
          },
        }],
      },
    }] : []),
    // Locking Module with Redis
    ...(REDIS_URL ? [{
      resolve: '@medusajs/medusa/locking',
      options: {
        providers: [{
          resolve: '@medusajs/medusa/locking-redis',
          id: 'locking-redis',
          is_default: true,
          options: {
            redisUrl: REDIS_URL,
          },
        }],
      },
    }] : []),
    // Translation Module
    {
      resolve: '@medusajs/medusa/translation',
    },
    ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL || RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
      key: Modules.NOTIFICATION,
      resolve: '@medusajs/notification',
      options: {
        providers: [
          ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL ? [{
            resolve: '@medusajs/notification-sendgrid',
            id: 'sendgrid',
            options: {
              channels: ['email'],
              api_key: SENDGRID_API_KEY,
              from: SENDGRID_FROM_EMAIL,
            }
          }] : []),
          ...(RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
            resolve: '@calilean/plugin-email/providers/email-notifications',
            id: 'resend',
            options: {
              channels: ['email'],
              api_key: RESEND_API_KEY,
              from: RESEND_FROM_EMAIL,
            },
          }] : []),
        ]
      }
    }] : []),
    // Payment Module — conditionally loads Stripe and/or NMI ACH providers
    ...((STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET) || NMI_API_KEY ? [{
      key: Modules.PAYMENT,
      resolve: '@medusajs/payment',
      options: {
        providers: [
          ...(STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET ? [{
            resolve: '@medusajs/payment-stripe',
            id: 'stripe',
            options: {
              apiKey: STRIPE_API_KEY,
              webhookSecret: STRIPE_WEBHOOK_SECRET,
              capture: true,
            },
          }] : []),
          ...(NMI_API_KEY ? [{
            resolve: './src/modules/payment-nmi',
            id: 'nmi-ach',
            options: {
              apiKey: NMI_API_KEY,
              tokenizationKey: NMI_TOKENIZATION_KEY,
              endpoint: NMI_SANDBOX === 'true'
                ? 'https://sandbox.nmi.com/api/transact.php'
                : 'https://secure.nmi.com/api/transact.php',
            },
          }, {
            resolve: './src/modules/payment-nmi-card',
            id: 'nmi-card',
            options: {
              apiKey: NMI_API_KEY,
              tokenizationKey: NMI_TOKENIZATION_KEY,
              endpoint: NMI_SANDBOX === 'true'
                ? 'https://sandbox.nmi.com/api/transact.php'
                : 'https://secure.nmi.com/api/transact.php',
            },
          }] : []),
        ],
      },
    }] : []),
    {
      resolve: '@medusajs/medusa/fulfillment',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/fulfillment-manual',
            id: 'manual',
          },
          ...(SHIPSTATION_API_KEY ? [{
            resolve: '@calilean/plugin-shipstation/providers/shipstation',
            id: 'shipstation',
            options: {
              api_key: SHIPSTATION_API_KEY,
            },
          }] : []),
        ],
      },
    },
    // Analytics Module with Segment
    ...(SEGMENT_WRITE_KEY ? [{
      resolve: '@medusajs/medusa/analytics',
      options: {
        providers: [{
          resolve: './src/modules/segment',
          id: 'segment',
          options: {
            writeKey: SEGMENT_WRITE_KEY,
          },
        }],
      },
    }] : []),
    // Restock Notification Module
    {
      resolve: './src/modules/restock',
    },
    // Google social auth
    ...(GOOGLE_CLIENT_ID ? [{
      resolve: '@medusajs/medusa/auth',
      dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/auth-emailpass',
            id: 'emailpass',
          },
          {
            resolve: '@medusajs/medusa/auth-google',
            id: 'google',
            options: {
              clientId: GOOGLE_CLIENT_ID,
              clientSecret: GOOGLE_CLIENT_SECRET,
              callbackUrl: GOOGLE_CALLBACK_URL,
            },
          },
        ],
      },
    }] : []),
    // Sanity CMS integration
    ...(SANITY_API_TOKEN ? [{
      resolve: './src/modules/sanity',
      options: {
        api_token: SANITY_API_TOKEN,
        project_id: SANITY_PROJECT_ID,
        api_version: new Date().toISOString().split("T")[0],
        dataset: SANITY_DATASET || "production",
        studio_url: SANITY_STUDIO_URL || "http://localhost:3000/studio",
        type_map: {
          product: "product",
        },
      },
    }] : []),
    // ERP integration modules (requires ERP_ENCRYPTION_KEY)
    {
      resolve: "@calilean/plugin-erp/modules/erp",
      options: {
        encryption_key: ERP_ENCRYPTION_KEY,
      },
    }, {
      resolve: "@calilean/plugin-erp/modules/dispute",
    },
  ],
  featureFlags: {
    translation: true,
    caching: true,
  },
  plugins: [
  ...(GOOGLE_API_KEY ? [{
    resolve: "@calilean/plugin-ai-studio",
    options: {
      google_api_key: GOOGLE_API_KEY,
    },
  }] : []),
  "@calilean/plugin-email",
  "@calilean/plugin-loyalty",
  "@calilean/plugin-reviews",
  "@calilean/plugin-invoices",
  "@calilean/plugin-bundles",
  "@calilean/plugin-shipstation",
  "@calilean/plugin-subscription",
  "@calilean/plugin-preorder",
  "@calilean/plugin-qr-marketing",
  "@calilean/plugin-erp",
  // "@medusajs/loyalty-plugin" disabled — admin widget crashes (missing QueryClientProvider)
  ...(MEILISEARCH_HOST && MEILISEARCH_ADMIN_KEY ? [{
      resolve: '@rokmohar/medusa-plugin-meilisearch',
      options: {
        config: {
          host: MEILISEARCH_HOST,
          apiKey: MEILISEARCH_ADMIN_KEY
        },
        settings: {
          products: {
            type: 'products',
            enabled: true,
            fields: ['id', 'title', 'description', 'handle', 'variant_sku', 'thumbnail'],
            indexSettings: {
              searchableAttributes: ['title', 'description', 'variant_sku'],
              displayedAttributes: ['id', 'handle', 'title', 'description', 'variant_sku', 'thumbnail'],
              filterableAttributes: ['id', 'handle'],
            },
            primaryKey: 'id',
          }
        }
      }
    }] : [])
  ]
};

// @ts-expect-error -- conditional plugin/module spreads create complex union types
export default defineConfig(medusaConfig);
