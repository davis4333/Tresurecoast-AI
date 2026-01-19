import { describe, it, expect } from "vitest";
import {
  getScriptEmbedSnippet,
  getIframeEmbedSnippet,
} from "@/lib/widget/embedSnippet";

describe("getScriptEmbedSnippet", () => {
  const baseUrl = "https://example.com";
  const botKey = "test-bot-123";

  it("should include embed/widget.js route", () => {
    const snippet = getScriptEmbedSnippet(baseUrl, botKey);
    expect(snippet).toContain(`src="${baseUrl}/embed/widget.js"`);
  });

  it("should include data-bot-key attribute", () => {
    const snippet = getScriptEmbedSnippet(baseUrl, botKey);
    expect(snippet).toContain(`data-bot-key="${botKey}"`);
  });

  it("should include data-position attribute with default bottom-right", () => {
    const snippet = getScriptEmbedSnippet(baseUrl, botKey);
    expect(snippet).toContain('data-position="bottom-right"');
  });

  it("should include data-position with custom value", () => {
    const snippet = getScriptEmbedSnippet(baseUrl, botKey, "bottom-left");
    expect(snippet).toContain('data-position="bottom-left"');
  });

  it("should include async attribute", () => {
    const snippet = getScriptEmbedSnippet(baseUrl, botKey);
    expect(snippet).toContain("async");
  });

  it("should be a valid script tag", () => {
    const snippet = getScriptEmbedSnippet(baseUrl, botKey);
    expect(snippet).toMatch(/^<script .+><\/script>$/);
  });
});

describe("getIframeEmbedSnippet", () => {
  const baseUrl = "https://example.com";
  const botKey = "test-bot-456";

  it("should include widget route with botPublicKey", () => {
    const snippet = getIframeEmbedSnippet(baseUrl, botKey);
    expect(snippet).toContain(`${baseUrl}/widget/${botKey}`);
  });

  it("should be a valid iframe tag", () => {
    const snippet = getIframeEmbedSnippet(baseUrl, botKey);
    expect(snippet).toMatch(/^<iframe .+><\/iframe>$/);
  });

  it("should have fixed positioning for bottom-right", () => {
    const snippet = getIframeEmbedSnippet(baseUrl, botKey, "bottom-right");
    expect(snippet).toContain("position:fixed");
    expect(snippet).toContain("right:20px");
  });

  it("should have fixed positioning for bottom-left", () => {
    const snippet = getIframeEmbedSnippet(baseUrl, botKey, "bottom-left");
    expect(snippet).toContain("position:fixed");
    expect(snippet).toContain("left:20px");
  });

  it("should include title attribute", () => {
    const snippet = getIframeEmbedSnippet(baseUrl, botKey);
    expect(snippet).toContain('title="Chat Widget"');
  });
});
