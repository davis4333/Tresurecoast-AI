import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Treasure Coast AI",
  description: "Privacy Policy for Treasure Coast AI chatbot platform",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-bold text-[var(--color-text-primary)]">
        Privacy Policy
      </h1>

      <div className="prose prose-invert max-w-none space-y-6 text-[var(--color-text-secondary)]">
        <p className="text-sm text-[var(--color-text-muted)]">
          Last Updated: January 25, 2026
        </p>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            1. Introduction
          </h2>
          <p>
            Treasure Coast AI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your information when you use our Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            2. Information We Collect
          </h2>

          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-4">
            2.1 Information You Provide
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, password, company name</li>
            <li><strong>Payment Information:</strong> Credit card details (processed securely by Stripe)</li>
            <li><strong>Business Information:</strong> Business hours, services, contact details</li>
            <li><strong>Bot Configuration:</strong> Chatbot settings, greetings, knowledge base content</li>
          </ul>

          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-4">
            2.2 Information Automatically Collected
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Usage Data:</strong> Pages visited, features used, time spent</li>
            <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
            <li><strong>Cookies:</strong> Session cookies, analytics cookies, preference cookies</li>
            <li><strong>Log Data:</strong> Server logs, error reports, performance metrics</li>
          </ul>

          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-4">
            2.3 End User Data (Your Customers)
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Lead Information:</strong> Names, email addresses, phone numbers submitted through chatbots</li>
            <li><strong>Conversation Data:</strong> Chat messages and interactions</li>
            <li><strong>Interaction Analytics:</strong> Topics discussed, intent classification, lead scores</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            3. How We Use Your Information
          </h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, operate, and maintain the Service</li>
            <li>Process payments and send billing information</li>
            <li>Send administrative information and updates</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Analyze usage patterns and improve our Service</li>
            <li>Detect, prevent, and address technical issues and fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            4. Data Sharing and Disclosure
          </h2>

          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-4">
            We DO NOT sell your personal information.
          </h3>

          <p>We may share your information with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Service Providers:</strong> Stripe (payments), Clerk (authentication), Resend (emails), Sentry (error tracking)</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            5. Data Security
          </h2>
          <p>We implement industry-standard security measures to protect your data:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Encryption in transit (HTTPS/TLS)</li>
            <li>Encryption at rest for sensitive data</li>
            <li>Regular security audits and penetration testing</li>
            <li>Access controls and authentication</li>
            <li>Rate limiting and DDoS protection</li>
            <li>Regular backups and disaster recovery procedures</li>
          </ul>
          <p className="mt-4">
            However, no method of transmission over the Internet is 100% secure. While we strive to use commercially
            acceptable means to protect your data, we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            6. Data Retention
          </h2>
          <p>We retain your information for as long as necessary to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide the Service to you</li>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes and enforce our agreements</li>
          </ul>
          <p className="mt-4">
            Upon account termination, we will delete or anonymize your data within 90 days, except where retention
            is required by law or for legitimate business purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            7. Your Rights (GDPR & CCPA)
          </h2>
          <p>Depending on your location, you may have the following rights:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Erasure:</strong> Request deletion of your data (&quot;right to be forgotten&quot;)</li>
            <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
            <li><strong>Objection:</strong> Object to certain processing activities</li>
            <li><strong>Restriction:</strong> Request limitation of processing</li>
            <li><strong>Withdraw Consent:</strong> Withdraw previously given consent</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, please contact us at privacy@treasurecoast.ai or use the data export/deletion
            features in your account settings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            8. Cookies and Tracking
          </h2>
          <p>We use cookies and similar tracking technologies to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Essential Cookies:</strong> Required for authentication and security</li>
            <li><strong>Analytics Cookies:</strong> Understand how you use our Service</li>
            <li><strong>Preference Cookies:</strong> Remember your settings</li>
          </ul>
          <p className="mt-4">
            You can control cookies through your browser settings. Disabling cookies may affect functionality.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            9. Third-Party Services
          </h2>
          <p>Our Service integrates with third-party services that have their own privacy policies:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Stripe:</strong> Payment processing (https://stripe.com/privacy)</li>
            <li><strong>Clerk:</strong> Authentication (https://clerk.com/privacy)</li>
            <li><strong>OpenAI:</strong> AI processing (https://openai.com/privacy)</li>
            <li><strong>Sentry:</strong> Error tracking (https://sentry.io/privacy)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            10. Children&apos;s Privacy
          </h2>
          <p>
            Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal
            information from children. If we become aware that a child has provided us with personal information,
            we will take steps to delete such information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            11. International Data Transfers
          </h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of residence.
            These countries may have different data protection laws. We ensure appropriate safeguards are in place
            to protect your data in accordance with this Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            12. Changes to This Privacy Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Posting the new Privacy Policy on this page</li>
            <li>Updating the &quot;Last Updated&quot; date</li>
            <li>Sending you an email notification</li>
          </ul>
          <p className="mt-4">
            Your continued use of the Service after changes become effective constitutes acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            13. Contact Us
          </h2>
          <p>
            For questions about this Privacy Policy or to exercise your rights, contact us at:
          </p>
          <p className="mt-2">
            <strong>Email:</strong> privacy@treasurecoast.ai<br />
            <strong>Website:</strong> https://treasurecoast.ai<br />
            <strong>Data Protection Officer:</strong> dpo@treasurecoast.ai
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            14. Your California Privacy Rights (CCPA)
          </h2>
          <p>
            If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Right to know what personal information is collected</li>
            <li>Right to know whether personal information is sold or disclosed</li>
            <li>Right to say no to the sale of personal information</li>
            <li>Right to access your personal information</li>
            <li>Right to equal service and price</li>
          </ul>
          <p className="mt-4">
            <strong>We do not sell your personal information.</strong>
          </p>
        </section>
      </div>
    </div>
  );
}
