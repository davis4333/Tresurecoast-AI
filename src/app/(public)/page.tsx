import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Users, Clock, Code, Quote } from "lucide-react";
import { TcaButton } from "@/components/tca/TcaButton";
import { TcaCard, TcaCardBody } from "@/components/tca/TcaCard";

export const metadata: Metadata = {
  title: "Treasure Coast AI - AI Lead Capture That Never Hallucinates",
  description:
    "Capture leads 24/7 with an AI chatbot that only answers from your verified business data. No hallucinations, no missed leads.",
};

const FEATURES = [
  {
    title: "Truth Mode",
    desc: "Your bot only answers from verified business data. It never invents facts or makes things up.",
    icon: "shield",
  },
  {
    title: "Lead Capture",
    desc: "Automatically capture visitor info and score leads by intent. Never miss a potential customer.",
    icon: "users",
  },
  {
    title: "24/7 Availability",
    desc: "Your AI assistant works around the clock, answering questions while you sleep.",
    icon: "clock",
  },
  {
    title: "Easy Embed",
    desc: "Add a single script tag to your website. Works with any platform.",
    icon: "code",
  },
];

const TESTIMONIALS = [
  {
    quote: "We went from missing 40% of after-hours inquiries to capturing every single lead. The bot pays for itself in the first week.",
    author: "Maria Santos",
    role: "Owner, Santos Barbershop",
    industry: "Grooming",
  },
  {
    quote: "My team used to spend 2 hours daily answering the same questions. Now the bot handles it and we focus on what matters - our clients.",
    author: "James Wilson",
    role: "Practice Manager, Coastal Dental",
    industry: "Healthcare",
  },
  {
    quote: "The lead scoring is brilliant. We know exactly which inquiries are hot and need immediate attention. Our conversion rate is up 35%.",
    author: "Sarah Chen",
    role: "Director, FitLife Studios",
    industry: "Fitness",
  },
];

const STATS = [
  { value: "24/7", label: "Availability", desc: "Never miss a lead" },
  { value: "35%", label: "More Leads Captured", desc: "Compared to contact forms" },
  { value: "< 3s", label: "Response Time", desc: "Instant AI responses" },
  { value: "100%", label: "Truthful", desc: "No hallucinations ever" },
];

const FAQ = [
  {
    q: "Does the AI make things up?",
    a: "No. Truth Mode ensures your bot only answers from verified business data you provide. If it doesn't know something, it says so.",
  },
  {
    q: "Can I use my own booking system?",
    a: "Yes. The bot redirects customers to your existing booking or payment system. We don't try to replace what's already working.",
  },
  {
    q: "How do I get leads?",
    a: "Lead info is captured during conversations and scored automatically. You can view and manage leads from your dashboard.",
  },
  {
    q: "Is there a free trial?",
    a: "We offer personalized demos to show you exactly how the system works for your business. Request a demo to get started.",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "We onboard your business", desc: "Share your services, hours, and FAQs." },
  { step: "2", title: "Add the widget", desc: "One script tag on your website." },
  { step: "3", title: "Capture leads", desc: "Your bot answers questions and captures visitor info 24/7." },
];

function FeatureIcon({ icon }: { icon: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    shield: <Shield className="h-6 w-6" />,
    users: <Users className="h-6 w-6" />,
    clock: <Clock className="h-6 w-6" />,
    code: <Code className="h-6 w-6" />,
  };
  return iconMap[icon] ?? null;
}

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-brand-primary)]/5 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-1.5 text-sm text-[var(--color-text-secondary)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
            Agency-managed AI chatbots
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="tca-gradient-text">AI Lead Capture</span> That Never Hallucinates
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--color-text-secondary)]">
            Your chatbot only answers from verified business data. No made-up facts. No missed leads.
            We handle everything so you can focus on your business.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/request-demo" data-testid="link-hero-request-demo">
              <TcaButton size="lg">Book a Demo</TcaButton>
            </Link>
            <Link href="/demo" data-testid="link-hero-live-demo">
              <TcaButton variant="secondary" size="lg">See Live Demo</TcaButton>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="tca-h2 mb-4 text-center">How It Works</h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-[var(--color-text-secondary)]">
            We set up and manage your AI chatbot. You get the leads.
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="tca-h2 mb-4 text-center">Features</h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-[var(--color-text-secondary)]">
            Everything you need to capture and convert more leads.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <TcaCard key={f.title}>
                <TcaCardBody>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">
                    <FeatureIcon icon={f.icon} />
                  </div>
                  <h3 className="mb-2 font-semibold">{f.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">{f.desc}</p>
                </TcaCardBody>
              </TcaCard>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] py-24" data-testid="section-testimonials">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="tca-h2 mb-4 text-center" data-testid="heading-testimonials">What Our Clients Say</h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-[var(--color-text-secondary)]">
            Real results from real businesses using Treasure Coast AI.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial, index) => (
              <TcaCard key={index} className="flex h-full flex-col" data-testid={`card-testimonial-${index}`}>
                <TcaCardBody className="flex flex-1 flex-col">
                  <div className="mb-4 flex h-8 w-8 items-center justify-center text-[var(--color-brand-primary)]" data-testid={`icon-quote-${index}`}>
                    <Quote className="h-6 w-6" />
                  </div>
                  <p className="mb-6 flex-1 text-sm italic text-[var(--color-text-secondary)]" data-testid={`text-quote-${index}`}>
                    "{testimonial.quote}"
                  </p>
                  <div className="mt-auto" data-testid={`section-author-${index}`}>
                    <p className="font-semibold" data-testid={`text-author-${index}`}>{testimonial.author}</p>
                    <p className="mb-3 text-sm text-[var(--color-text-secondary)]" data-testid={`text-role-${index}`}>{testimonial.role}</p>
                    <span className="inline-block rounded-full bg-[var(--color-brand-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--color-brand-primary)]" data-testid={`badge-industry-${index}`}>
                      {testimonial.industry}
                    </span>
                  </div>
                </TcaCardBody>
              </TcaCard>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] bg-gradient-to-b from-[var(--color-brand-primary)]/5 to-transparent py-24" data-testid="section-results">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="tca-h2 mb-4 text-center" data-testid="heading-results">Real Results for Real Businesses</h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-[var(--color-text-secondary)]">
            Proven metrics that demonstrate the impact of Treasure Coast AI.
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat, index) => (
              <div key={index} className="text-center" data-testid={`stat-item-${index}`}>
                <div className="mb-3 text-4xl font-bold text-[var(--color-brand-primary)]" data-testid={`text-stat-value-${index}`}>
                  {stat.value}
                </div>
                <p className="mb-2 font-semibold" data-testid={`text-stat-label-${index}`}>{stat.label}</p>
                <p className="text-sm text-[var(--color-text-secondary)]" data-testid={`text-stat-desc-${index}`}>{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="tca-h2 mb-4 text-center">Frequently Asked Questions</h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-[var(--color-text-secondary)]">
            Common questions about Treasure Coast AI.
          </p>
          <div className="space-y-6">
            {FAQ.map((item) => (
              <TcaCard key={item.q}>
                <TcaCardBody>
                  <h3 className="mb-2 font-semibold">{item.q}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">{item.a}</p>
                </TcaCardBody>
              </TcaCard>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="tca-h2 mb-4">Ready to capture more leads?</h2>
          <p className="mb-8 text-[var(--color-text-secondary)]">
            Book a demo to see how Treasure Coast AI can work for your business.
          </p>
          <Link href="/request-demo" data-testid="link-cta-request-demo">
            <TcaButton size="lg">Book a Demo</TcaButton>
          </Link>
        </div>
      </section>
    </>
  );
}
