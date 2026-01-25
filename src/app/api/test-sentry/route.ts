/**
 * Test endpoint for Sentry error tracking
 *
 * Usage:
 * - GET /api/test-sentry?type=error - Throws an error to test error reporting
 * - GET /api/test-sentry?type=message - Sends a test message to Sentry
 *
 * IMPORTANT: This endpoint should be disabled in production or protected with auth
 */

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  // Disable in production for security
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "Test endpoint disabled in production" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const testType = searchParams.get("type") || "error";

  try {
    if (testType === "message") {
      // Test sending a message to Sentry
      Sentry.captureMessage("Sentry test message from API endpoint", "info");
      return NextResponse.json({
        ok: true,
        message: "Test message sent to Sentry",
        type: "message",
      });
    }

    if (testType === "error") {
      // Test throwing an error
      throw new Error("Sentry test error - this is expected!");
    }

    if (testType === "custom") {
      // Test custom error with context
      Sentry.captureException(new Error("Custom test error"), {
        tags: {
          test: "true",
          endpoint: "test-sentry",
        },
        extra: {
          testData: "This is additional context",
          timestamp: new Date().toISOString(),
        },
      });
      return NextResponse.json({
        ok: true,
        message: "Custom error sent to Sentry with context",
        type: "custom",
      });
    }

    return NextResponse.json({
      ok: false,
      error: "Unknown test type. Use ?type=error, ?type=message, or ?type=custom",
    });
  } catch (error) {
    // Sentry will automatically capture this error
    Sentry.captureException(error);
    throw error; // Re-throw to let Next.js handle it
  }
}
