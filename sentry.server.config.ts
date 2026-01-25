// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Don't send events if DSN is not configured
    if (!process.env.SENTRY_DSN) {
      return null;
    }

    // Scrub sensitive data from request
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers["x-api-key"];
      }

      // Remove query params that might contain sensitive data
      if (event.request.query_string) {
        const sanitized = event.request.query_string
          .replace(/token=[^&]*/gi, "token=REDACTED")
          .replace(/key=[^&]*/gi, "key=REDACTED")
          .replace(/password=[^&]*/gi, "password=REDACTED");
        event.request.query_string = sanitized;
      }
    }

    // Scrub sensitive data from extra context
    if (event.extra) {
      delete event.extra.password;
      delete event.extra.token;
      delete event.extra.apiKey;
      delete event.extra.api_key;
      delete event.extra.stripeKey;
      delete event.extra.openaiKey;
    }

    return event;
  },

  // Ignore common non-critical errors
  ignoreErrors: [
    // Expected validation errors
    "ValidationError",
    // Expected auth errors (handled by app)
    "Unauthorized",
    "Forbidden",
    // Network timeouts (transient)
    "ETIMEDOUT",
    "ECONNRESET",
    // AbortError is expected when requests are cancelled
    "AbortError",
  ],

  // Tag all events with server context
  initialScope: {
    tags: {
      runtime: "node",
    },
  },
});
