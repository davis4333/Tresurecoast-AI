"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { TcaButton } from "@/components/tca/TcaButton";
import { TcaCard, TcaCardBody } from "@/components/tca/TcaCard";

type FormState = "idle" | "submitting" | "success" | "error";

export default function RequestDemoPage() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState("submitting");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      businessName: formData.get("businessName") as string,
      phone: (formData.get("phone") as string) || null,
    };

    try {
      const res = await fetch("/api/public/request-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }

      setFormState("success");
    } catch (err) {
      setFormState("error");
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
    }
  }

  if (formState === "success") {
    return (
      <div className="py-20">
        <div className="mx-auto max-w-md px-6 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)]">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold" data-testid="text-demo-request-success">
            Demo Request Received
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Thank you for your interest. We will be in touch within 24 hours to schedule your personalized demo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight">
            <span className="tca-gradient-text">Request a Demo</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-[var(--color-text-secondary)]">
            See how Treasure Coast AI can capture more leads for your business.
            We will walk you through the platform and answer all your questions.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-xl font-semibold">What to Expect</h2>
            <div className="space-y-4">
              {[
                { title: "30-minute walkthrough", desc: "See the platform in action with a live demo." },
                { title: "Custom use case", desc: "We will discuss how it works for your specific business." },
                { title: "Q&A session", desc: "Ask any questions about features, pricing, or setup." },
                { title: "No pressure", desc: "Get all the info you need to make the right decision." },
              ].map((item) => (
                <TcaCard key={item.title}>
                  <TcaCardBody className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-[var(--color-text-secondary)]">{item.desc}</div>
                    </div>
                  </TcaCardBody>
                </TcaCard>
              ))}
            </div>
          </div>

          <div>
            <TcaCard elevated>
              <TcaCardBody>
                <h2 className="mb-6 text-xl font-semibold">Book Your Demo</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                      Your Name <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      data-testid="input-demo-name"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                      Email Address <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      data-testid="input-demo-email"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
                      placeholder="john@company.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="businessName" className="mb-1.5 block text-sm font-medium">
                      Business Name <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                      type="text"
                      id="businessName"
                      name="businessName"
                      required
                      data-testid="input-demo-business"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      data-testid="input-demo-phone"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  {formState === "error" && (
                    <div className="rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]" data-testid="text-demo-error">
                      {errorMessage}
                    </div>
                  )}

                  <TcaButton
                    type="submit"
                    fullWidth
                    disabled={formState === "submitting"}
                    data-testid="button-demo-submit"
                  >
                    {formState === "submitting" ? "Submitting..." : "Request Demo"}
                  </TcaButton>
                </form>
              </TcaCardBody>
            </TcaCard>
          </div>
        </div>
      </div>
    </div>
  );
}
