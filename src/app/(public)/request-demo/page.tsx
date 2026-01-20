"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Check } from "lucide-react";
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
      <div className="py-24">
        <div className="mx-auto max-w-md px-6 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)]">
              <Check className="h-8 w-8" />
            </div>
          </div>
          <h1 className="tca-h2 mb-4" data-testid="text-demo-request-success">
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
    <div className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-12 text-center">
          <h1 className="tca-h1 mb-4">
            <span className="tca-gradient-text">Request a Demo</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-[var(--color-text-secondary)]">
            See how Treasure Coast AI can capture more leads for your business.
            We will walk you through the platform and answer all your questions.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="tca-h3 mb-6">What to Expect</h2>
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
                      <Check className="h-4 w-4" />
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
                <h2 className="tca-h3 mb-6">Book Your Demo</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="tca-label mb-1.5 block">
                      Your Name <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      data-testid="input-demo-name"
                      className="tca-input"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="tca-label mb-1.5 block">
                      Email Address <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      data-testid="input-demo-email"
                      className="tca-input"
                      placeholder="john@company.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="businessName" className="tca-label mb-1.5 block">
                      Business Name <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                      type="text"
                      id="businessName"
                      name="businessName"
                      required
                      data-testid="input-demo-business"
                      className="tca-input"
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="tca-label mb-1.5 block">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      data-testid="input-demo-phone"
                      className="tca-input"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  {formState === "error" && (
                    <div className="tca-error-message flex items-start gap-2 text-sm" data-testid="text-demo-error">
                      <span className="shrink-0 text-[var(--color-error)]">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <span className="text-[var(--color-error)]">{errorMessage}</span>
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
