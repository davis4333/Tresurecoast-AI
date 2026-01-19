"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function EmbedTestContent() {
  const searchParams = useSearchParams();
  const botPublicKey = searchParams.get("botPublicKey") || "";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  if (!botPublicKey) {
    return (
      <main className="min-h-screen bg-white p-8">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Widget Embed Test Page</h1>
        <p className="text-gray-600">Add ?botPublicKey=YOUR_BOT_KEY to test the embed script.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-8">
      <h1 className="mb-4 text-2xl font-bold text-gray-900" data-testid="embed-test-title">
        Widget Embed Test Page
      </h1>
      <p className="mb-8 text-gray-600" data-testid="embed-test-description">
        This page tests the embed script for bot: {botPublicKey}
      </p>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Embed Script Test</h2>
        <p className="text-sm text-gray-500">The chat widget should appear in the bottom-right corner.</p>
      </div>
      <script
        src={`${baseUrl}/embed/widget.js`}
        data-bot-key={botPublicKey}
        data-position="bottom-right"
        async
      />
    </main>
  );
}

export default function EmbedTestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmbedTestContent />
    </Suspense>
  );
}
