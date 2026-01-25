import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Treasure Coast AI",
  description: "Terms of Service for Treasure Coast AI chatbot platform",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-bold text-[var(--color-text-primary)]">
        Terms of Service
      </h1>

      <div className="prose prose-invert max-w-none space-y-6 text-[var(--color-text-secondary)]">
        <p className="text-sm text-[var(--color-text-muted)]">
          Last Updated: January 25, 2026
        </p>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using Treasure Coast AI (&quot;Service&quot;), you agree to be bound by these Terms of Service
            (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            2. Description of Service
          </h2>
          <p>
            Treasure Coast AI provides an AI-powered chatbot platform that enables businesses to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Deploy AI chatbots on their websites</li>
            <li>Capture and manage leads</li>
            <li>Integrate with booking systems</li>
            <li>Analyze customer interactions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            3. User Accounts
          </h2>
          <p>
            To use the Service, you must create an account. You are responsible for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            4. Subscription Plans and Billing
          </h2>
          <p>
            Our Service is offered through subscription plans with different features and limits. By subscribing, you agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Pay all fees associated with your selected plan</li>
            <li>Automatic renewal unless cancelled before the renewal date</li>
            <li>Pricing changes with 30 days&apos; notice</li>
            <li>No refunds for partial billing periods</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            5. Acceptable Use
          </h2>
          <p>
            You agree not to use the Service to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon intellectual property rights</li>
            <li>Transmit malicious code or spam</li>
            <li>Impersonate others or provide false information</li>
            <li>Interfere with the Service&apos;s operation</li>
            <li>Attempt unauthorized access to our systems</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            6. Data and Privacy
          </h2>
          <p>
            Your use of the Service is also governed by our Privacy Policy. You acknowledge that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We collect and process data as described in our Privacy Policy</li>
            <li>You are responsible for obtaining consent from your end users</li>
            <li>You must comply with applicable data protection laws (GDPR, CCPA, etc.)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            7. Intellectual Property
          </h2>
          <p>
            The Service and its original content, features, and functionality are owned by Treasure Coast AI
            and are protected by international copyright, trademark, and other intellectual property laws.
          </p>
          <p>
            You retain all rights to your data and content. By using the Service, you grant us a limited license
            to process your data solely to provide the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            8. Service Availability
          </h2>
          <p>
            We strive to maintain high availability but do not guarantee uninterrupted access. We reserve the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Modify or discontinue the Service with notice</li>
            <li>Perform scheduled maintenance</li>
            <li>Suspend access for violations of these Terms</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            9. Limitation of Liability
          </h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, TREASURE COAST AI SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
            WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            10. Indemnification
          </h2>
          <p>
            You agree to indemnify and hold harmless Treasure Coast AI from any claims, damages, losses, liabilities,
            and expenses arising out of your use of the Service or violation of these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            11. Termination
          </h2>
          <p>
            We may terminate or suspend your account and access to the Service immediately, without prior notice,
            for any reason, including breach of these Terms. Upon termination:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your right to use the Service will immediately cease</li>
            <li>You may export your data within 30 days</li>
            <li>We may delete your data after the retention period</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            12. Changes to Terms
          </h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of material changes
            via email or through the Service. Continued use after changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            13. Governing Law
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the United States,
            without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            14. Contact Us
          </h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p className="mt-2">
            <strong>Email:</strong> legal@treasurecoast.ai<br />
            <strong>Website:</strong> https://treasurecoast.ai
          </p>
        </section>
      </div>
    </div>
  );
}
