import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      {/* Simple nav */}
      <header className="border-b border-gray-800 py-4 px-6">
        <Link href="/" className="text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors">
          ← Back to ClaudeKit
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: May 2026</p>

        <div className="space-y-10 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using ClaudeKit ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. These Terms constitute a legally binding agreement between you and ClaudeKit ("we," "our," or "us"). If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              ClaudeKit is a cloud-based organizational chart software-as-a-service (SaaS) platform that enables users to create, edit, share, and manage organizational structures and reporting hierarchies. The Service includes web and mobile interfaces, scenario planning tools, collaboration features, filtering and visualization tools, and data export capabilities (CSV, Excel, PowerPoint). We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Account Registration &amp; Security</h2>
            <p>
              To use the Service, you must create an account through our authentication provider, Clerk, and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately at{" "}
              <a href="mailto:dsteinsapir@gmail.com" className="text-blue-400 hover:underline">dsteinsapir@gmail.com</a>{" "}
              of any unauthorized use of your account. We are not liable for losses arising from unauthorized access to your account. You may not share account credentials or allow multiple individuals to use a single account without appropriate team seats.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Free Trial, Subscription &amp; Billing</h2>
            <p>
              <strong className="text-gray-200">Free Trial.</strong> New accounts receive a 14-day free trial with full access to all features. No credit card is required to start a trial. At the end of the trial period, your account will enter a read-only state unless you activate a paid subscription.
            </p>
            <p className="mt-3">
              <strong className="text-gray-200">Pricing.</strong> The Service is offered at <strong className="text-gray-200">$49 USD per month</strong>, billed monthly, for unlimited users within your organization. Prices are subject to change with 30 days&apos; written notice.
            </p>
            <p className="mt-3">
              <strong className="text-gray-200">Billing via Paddle.</strong> Payments are processed by Paddle, who acts as the Merchant of Record for all ClaudeKit subscriptions. By providing payment information, you authorize Paddle to charge your payment method on a recurring monthly basis. You will receive an email receipt for each charge. If a payment fails, we may suspend access to the Service until payment is resolved.
            </p>
            <p className="mt-3">
              <strong className="text-gray-200">Cancellation &amp; Refunds.</strong> You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period — you retain access until then. We do not provide refunds for partial months, except as required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-400">
              <li>Violate any applicable law or regulation</li>
              <li>Upload or transmit malicious code, viruses, or harmful content</li>
              <li>Attempt to gain unauthorized access to other accounts or our systems</li>
              <li>Scrape, crawl, or systematically extract data from the Service</li>
              <li>Reverse-engineer, decompile, or otherwise attempt to extract source code</li>
              <li>Resell, sublicense, or otherwise commercialize the Service without our written consent</li>
              <li>Share account credentials with unauthorized users</li>
              <li>Store, transmit, or process any data in violation of applicable privacy laws</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Your Data &amp; Privacy</h2>
            <p>
              Your use of the Service is also governed by our{" "}
              <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference. You retain full ownership of all data you upload to the Service ("Customer Data"), including all organizational data, employee information, and scenario plans. You grant ClaudeKit a limited, non-exclusive license to process Customer Data solely to provide the Service. We will not sell your Customer Data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Intellectual Property</h2>
            <p>
              The Service, including its software, design, trademarks, and content, is owned by ClaudeKit and protected by intellectual property laws. These Terms do not grant you any right, title, or interest in the Service beyond the limited license to use it as described herein. You may not use our name, logo, or trademarks without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Service Availability</h2>
            <p>
              We strive to maintain high availability but do not guarantee uninterrupted access. The Service is provided &quot;as is&quot; and &quot;as available.&quot; We may perform scheduled maintenance and will endeavor to communicate this in advance. We are not liable for downtime, data loss, or damages resulting from service interruptions, third-party failures, or events beyond our reasonable control.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Termination</h2>
            <p>
              Either party may terminate this agreement at any time. You may cancel your subscription at any time through the billing portal. We may suspend or terminate your account immediately if you breach these Terms, fail to pay fees when due, or engage in conduct harmful to other users or the Service. Upon termination, your right to access the Service ceases and we will delete your data after a 30-day grace period, unless required by law to retain it longer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, ClaudeKit shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of or relating to these Terms or your use of the Service. Our total cumulative liability to you for any claims arising under these Terms shall not exceed the total amount you paid us in the three months immediately preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of Chile, without regard to conflict of law principles. Any disputes arising under these Terms shall be subject to the jurisdiction of the courts of Chile. If you are a consumer in the EU or UK, you may also have rights under your local mandatory consumer protection laws that cannot be waived by contract.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes by email or by displaying a notice within the Service at least 14 days before the changes take effect. Your continued use of the Service after the effective date constitutes your acceptance of the updated Terms. If you do not agree to the revised Terms, you must stop using the Service and cancel your subscription.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">13. Contact</h2>
            <p>
              For questions about these Terms:
            </p>
            <address className="not-italic mt-2 space-y-1 text-gray-400">
              <p><strong className="text-gray-200">ClaudeKit</strong></p>
              <p>Email: <a href="mailto:dsteinsapir@gmail.com" className="text-blue-400 hover:underline">dsteinsapir@gmail.com</a></p>
            </address>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-800 py-6 px-6 text-center text-sm text-gray-600 mt-8">
        © 2026 ClaudeKit. All rights reserved. &nbsp;·&nbsp;
        <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
      </footer>
    </div>
  );
}
