"use client";

import { useEffect, useMemo, useState } from "react";

type DomainStatus = "none" | "pending" | "verified" | "failed";

type DomainPayload = {
  customDomain: string | null;
  status: DomainStatus;
  verifiedAt: string | null;
  lastCheckedAt: string | null;
  failureReason: string | null;
  verificationToken: string | null;
  canEdit: boolean;
};

export function CustomDomainSection() {
  const [data, setData] = useState<DomainPayload | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const badge = useMemo(() => {
    const s = data?.status ?? "none";
    const map: Record<DomainStatus, string> = {
      none: "bg-zinc-200 text-zinc-800",
      pending: "bg-amber-200 text-amber-900",
      verified: "bg-emerald-200 text-emerald-900",
      failed: "bg-rose-200 text-rose-900",
    };
    return map[s];
  }, [data?.status]);

  async function refresh() {
    setErr(null);
    const r = await fetch("/api/org/custom-domain");
    const j = await r.json();
    if (!r.ok) throw new Error(j?.message || "Failed to load");
    setData(j.domain);
    setInput(j.domain?.customDomain || "");
  }

  useEffect(() => {
    refresh().catch((e) => setErr(e.message));
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const r = await fetch("/api/org/custom-domain", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customDomain: input }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.message || "Failed to save");
      setData(j.domain);
      setMsg("Saved. Add the TXT record below, then click Verify.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed";
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const r = await fetch("/api/org/custom-domain/verify", { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.message || "Verification failed");
      setMsg("Verified successfully!");
      await refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Verification failed";
      setErr(message);
      await refresh().catch(() => null);
    } finally {
      setBusy(false);
    }
  }

  async function rotate() {
    if (!confirm("Generate a new verification token?")) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const r = await fetch("/api/org/custom-domain/rotate-token", { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.message || "Failed to rotate token");
      setData(j.domain);
      setMsg("New token generated. Update your TXT record.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed";
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  async function copy(v: string) {
    await navigator.clipboard.writeText(v);
    setMsg("Copied!");
    setTimeout(() => setMsg(null), 1500);
  }

  return (
    <section
      className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-6 space-y-4"
      data-testid="section-custom-domain"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Custom Domain</h2>
          <p className="text-sm text-white/60">
            Use your own domain for the widget (e.g. chat.yourbrand.com). Verification is done via DNS TXT record.
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${badge}`} data-testid="badge-domain-status">
          {data?.status ?? "none"}
        </span>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Domain</label>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md bg-black/30 border border-white/10 px-3 py-2 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="chat.example.com"
            disabled={busy || !data?.canEdit}
            data-testid="input-custom-domain"
          />
          <button
            className="rounded-md px-3 py-2 text-sm font-semibold bg-white text-black disabled:opacity-50"
            onClick={save}
            disabled={busy || !data?.canEdit}
            data-testid="button-save-domain"
          >
            Save
          </button>
        </div>
        {!data?.canEdit && (
          <p className="text-xs text-white/50">You can view status but only agency admins can edit.</p>
        )}
      </div>

      {data?.customDomain && data?.verificationToken && (
        <div className="rounded-lg border border-white/10 bg-black/20 p-4 space-y-3">
          <div className="text-sm font-semibold">DNS TXT Record</div>
          <div className="grid md:grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-white/60 text-xs">Type</div>
              <div className="font-mono">TXT</div>
            </div>
            <div>
              <div className="text-white/60 text-xs">Host</div>
              <div className="font-mono">@</div>
            </div>
            <div>
              <div className="text-white/60 text-xs">TTL</div>
              <div className="font-mono">3600</div>
            </div>
          </div>
          <div>
            <div className="text-white/60 text-xs">Value</div>
            <div className="flex gap-2 items-center">
              <code
                className="flex-1 rounded bg-black/40 border border-white/10 px-3 py-2 text-xs break-all"
                data-testid="code-verification-token"
              >
                tca-verify={data.verificationToken}
              </code>
              <button
                className="rounded-md px-3 py-2 text-xs font-semibold bg-white/10 border border-white/10"
                onClick={() => copy(`tca-verify=${data.verificationToken}`)}
                data-testid="button-copy-token"
              >
                Copy
              </button>
            </div>
          </div>
          <p className="text-xs text-white/50">
            DNS propagation can take time. After adding the record, click Verify.
          </p>
        </div>
      )}

      {data?.customDomain && (
        <div className="flex gap-2">
          <button
            className="rounded-md px-3 py-2 text-sm font-semibold bg-emerald-400 text-black disabled:opacity-50"
            onClick={verify}
            disabled={busy || !data?.canEdit || data.status === "verified"}
            data-testid="button-verify-domain"
          >
            Verify
          </button>

          {data?.canEdit && data?.verificationToken && (
            <button
              className="rounded-md px-3 py-2 text-sm font-semibold bg-white/10 border border-white/10 disabled:opacity-50"
              onClick={rotate}
              disabled={busy}
              data-testid="button-rotate-token"
            >
              Regenerate Token
            </button>
          )}
        </div>
      )}

      {data?.verifiedAt && (
        <div className="text-xs text-white/50" data-testid="text-verified-at">
          Verified: {new Date(data.verifiedAt).toLocaleString()}
        </div>
      )}
      {data?.lastCheckedAt && (
        <div className="text-xs text-white/50" data-testid="text-last-checked">
          Last checked: {new Date(data.lastCheckedAt).toLocaleString()}
        </div>
      )}

      {msg && (
        <div className="text-sm text-emerald-400" data-testid="text-success-message">
          {msg}
        </div>
      )}
      {err && (
        <div className="text-sm text-rose-400" data-testid="text-error-message">
          {err}
        </div>
      )}
    </section>
  );
}
