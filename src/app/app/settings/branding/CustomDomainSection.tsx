"use client";

import { useEffect, useState } from "react";

type DomainStatus = "none" | "pending" | "verified" | "failed";

type DomainData = {
  customDomain: string | null;
  status: DomainStatus;
  verifiedAt: string | null;
  lastCheckedAt: string | null;
  failureReason: string | null;
  verificationToken: string | null;
};

export function CustomDomainSection() {
  const [data, setData] = useState<DomainData | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    void loadDomainInfo();
  }, []);

  async function loadDomainInfo() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/org/custom-domain", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json?.message || "Failed to load domain info");

      setData(json.domain);
      setInputValue(json.domain?.customDomain || "");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load domain info";
      setMessage({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/org/custom-domain", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customDomain: inputValue }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json?.message || "Failed to save domain");

      setData(json.domain);
      setMessage({ type: "success", text: "Domain saved. Add TXT record, then click Verify." });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save domain";
      setMessage({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    setVerifying(true);
    setMessage(null);
    try {
      const res = await fetch("/api/org/custom-domain/verify", { method: "POST" });
      const json = await res.json().catch(() => ({}));

      if (json?.verified) {
        setMessage({ type: "success", text: "Domain verified!" });
      } else {
        setMessage({ type: "error", text: json?.message || "Verification failed" });
      }

      await loadDomainInfo();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Verification request failed";
      setMessage({ type: "error", text: message });
    } finally {
      setVerifying(false);
    }
  }

  async function handleRotateToken() {
    if (!confirm("Generate a new verification token? You must update your DNS TXT record.")) return;

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/org/custom-domain/rotate-token", { method: "POST" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json?.message || "Failed to rotate token");

      setData(json.domain);
      setMessage({ type: "success", text: "New token generated. Update your DNS TXT record." });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to rotate token";
      setMessage({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setMessage({ type: "success", text: "Copied!" });
    setTimeout(() => setMessage(null), 1500);
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/60">Loading domain information...</div>
      </div>
    );
  }

  const statusBadgeColor: Record<DomainStatus, string> = {
    none: "bg-gray-500/20 text-gray-300",
    pending: "bg-yellow-500/20 text-yellow-300",
    verified: "bg-green-500/20 text-green-300",
    failed: "bg-red-500/20 text-red-300",
  };

  const statusLabel: Record<DomainStatus, string> = {
    none: "Not Configured",
    pending: "Pending Verification",
    verified: "Verified",
    failed: "Verification Failed",
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Custom Domain</h3>
          <p className="text-sm text-white/60 mt-1">
            Use your own domain for the chat widget (e.g., chat.yourbrand.com)
          </p>
        </div>
        {data && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColor[data.status]}`}>
            {statusLabel[data.status]}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Domain Name</label>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-lg bg-black/30 border border-white/10 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
            placeholder="chat.yourdomain.com"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={saving || verifying}
            data-testid="input-custom-domain"
          />
          <button
            className="px-4 py-2 rounded-lg bg-white text-black font-medium text-sm hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={saving || verifying}
            data-testid="button-save-domain"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        <p className="text-xs text-white/50">No protocol, no paths, no ports.</p>
      </div>

      {data?.customDomain && data?.verificationToken && (
        <div className="rounded-lg border border-white/10 bg-black/20 p-4 space-y-3">
          <h4 className="font-medium text-sm">DNS Verification</h4>
          <p className="text-sm text-white/70">Add this TXT record:</p>

          <div className="bg-black/40 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><div className="text-white/50 text-xs mb-1">Type</div><code className="text-xs">TXT</code></div>
              <div><div className="text-white/50 text-xs mb-1">Host/Name</div><code className="text-xs">@</code></div>
              <div><div className="text-white/50 text-xs mb-1">TTL</div><code className="text-xs">3600</code></div>
            </div>

            <div>
              <div className="text-white/50 text-xs mb-1">Value</div>
              <div className="flex gap-2">
                <code className="flex-1 bg-black/60 border border-white/10 rounded px-3 py-2 text-xs break-all" data-testid="code-verification-token">
                  tca-verify={data.verificationToken}
                </code>
                <button
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-xs font-medium hover:bg-white/20"
                  onClick={() => copyToClipboard(`tca-verify=${data.verificationToken}`)}
                  data-testid="button-copy-token"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/50">DNS can take minutes to 48 hours to propagate.</p>
        </div>
      )}

      {data?.customDomain && (
        <div className="flex gap-2 flex-wrap">
          <button
            className="px-4 py-2 rounded-lg bg-green-500 text-black font-medium text-sm hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleVerify}
            disabled={verifying || saving || data.status === "verified"}
            data-testid="button-verify-domain"
          >
            {verifying ? "Verifying..." : "Verify Domain"}
          </button>

          {data.status !== "verified" && (
            <button
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 font-medium text-sm hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleRotateToken}
              disabled={saving || verifying}
              data-testid="button-rotate-token"
            >
              Regenerate Token
            </button>
          )}
        </div>
      )}

      {data?.verifiedAt && <p className="text-xs text-white/50">Verified: {new Date(data.verifiedAt).toLocaleString()}</p>}
      {data?.lastCheckedAt && <p className="text-xs text-white/50">Last checked: {new Date(data.lastCheckedAt).toLocaleString()}</p>}

      {data?.status === "failed" && data.failureReason && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <strong>Verification failed:</strong> {data.failureReason}
        </div>
      )}

      {message && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            message.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
          data-testid={message.type === "success" ? "text-success-message" : "text-error-message"}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
