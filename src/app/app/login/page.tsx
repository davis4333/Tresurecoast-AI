"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    router.push("/app/dashboard");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await login(password);
    
    if (result.ok) {
      router.push("/app/dashboard");
    } else {
      setError(result.error || "Login failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
          <p className="text-muted-foreground mt-2">
            Enter your admin password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-foreground mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter admin password"
              required
              disabled={submitting}
              data-testid="input-password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500" data-testid="text-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !password}
            className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="button-login"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
