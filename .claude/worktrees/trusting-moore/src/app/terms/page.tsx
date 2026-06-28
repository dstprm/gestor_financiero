import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple nav */}
      <header className="border-b border-gray-100 py-4 px-6">
        <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
          ← Back to SimplyOrg
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: January 1, 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using SimplyOrg ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. These Terms constitute a legally binding agreement between you and SimplyOrg ("we," "our," or "us"). If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p>
              SimplyOrg is a cloud-based organizational chart software-as-a-service (SaaS) platform that enables users to create, edit, share, and manage organizational structures and reporting hierarchies. The Service includes web and mobile interfaces, collaboration tools, filtering and visualization features, and data export capabilities. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Account Registration &amp; Security</h2>
            <p>
              To use the Service, you must create an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately at <a href="mailto:support@simplyorg.app" className="text-blue-600 hover:underline">support@simplyorg.app</a> of any unauthorized use of your account. We are not liable for losses arising from unauthorized access to your account. You may not share account credentials or allow multiple individuals to use a single seat.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Subscription, Billing &amp; Free Trial</h2>
            <p>
              <strong>Free Trial.</strong> New accounts receive a 5-day free trial with full access to all features. No credit card is required to start a trial. At the end of the trial period, your account will be downgraded to a read-only state unless you add a valid payment method and activate a paid subscription.
            </p>
            <p className="mt-3">
              <strong>Pricing.</strong> The Service is offered at $100 USD per seat per month, billed on a monthly basis. Prices are subject to change with 30 days' written notice.
            </p>
            <p className="mt-3">
              <strong>Auto-Billing Disclosure.</strong> By providing payment information, you authorize SimplyOrg to automatically charge your payment method on the same day each month for the total number of active seats on your account. You will receive an email receipt for each charge. If a payment fails, we will attempt to retry the charge and may suspend access to the Service until payment is resolved.
            </p>
            <p className="mt-3">
              <strong>Cancellation &amp; Refunds.</strong> You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. We do not provide refunds for partial months or unused seat-time, except as required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Violate any applicable law or regulation</li>
              <li>Upload or transmit malicious code, viruses, or harmful content</li>
              <li>Attempt to gain unauthorized access to other accounts or our systems</li>
              <li>Reverse-engineer, decompile, or otherwise attempt to extract source code</li>
              <li>Resell, sublicense, or otherwise commercialize the Service without our written consent</li>
              <li>Use the Service to store, transmit, or process any data in violation of applicable privacy laws</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data &amp; Privacy</h2>
            <p>
              Your use of the Service is also governed by our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference. You retain ownership of all data you upload to the Service ("Customer Data"). You grant SimplyOrg a limited, non-exclusive license to process Customer Data solely to provide the Service. We will not sell your Customer Data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Intellectual Property</h2>
            <p>
              The Service, including its software, design, trademarks, and content, is owned by SimplyOrg and protected by intellectual property laws. These Terms do not grant you any right, title, or interest in the Service beyond the limited license to use it as described herein. You may not use our name, logo, or trademarks without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Service Availability &amp; Limitations</h2>
            <p>
              We strive to maintain high availability but do not guarantee uninterrupted access. The Service is provided "as is" and "as available." We may perform scheduled maintenance, which we will endeavor to communicate in advance. We are not liable for downtime, data loss, or damages resulting from service interruptions, third-party failures, or events beyond our reasonable control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Termination</h2>
            <p>
              Either party may terminate this agreement at any time. We may suspend or terminate your account immediately if you breach these Terms, fail to pay fees when due, or engage in conduct harmful to other users or the Service. Upon termination, your right to access the Service ceases and we may delete your data after a 30-day grace period, unless required by law to retain it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, SimplyOrg shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of or relating to these Terms or your use of the Service. Our total cumulative liability to you for any claims arising under these Terms shall not exceed the amount you paid us in the three months immediately preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to conflict of law principles. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Delaware. If you are a consumer in the EU or UK, you may also have rights under your local consumer protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes by email or by displaying a notice within the Service at least 14 days before the changes take effect. Your continued use of the Service after the effective date constitutes your acceptance of the updated Terms. If you do not agree to the revised Terms, you must stop using the Service and cancel your subscription.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact Information</h2>
            <p>
              For questions about these Terms, please contact us:
            </p>
            <address className="not-italic mt-2 space-y-1 text-gray-600">
              <p><strong>SimplyOrg</strong></p>
              <p>Email: <a href="mailto:legal@simplyorg.app" className="text-blue-600 hover:underline">legal@simplyorg.app</a></p>
              <p>Support: <a href="mailto:support@simplyorg.app" className="text-blue-600 hover:underline">support@simplyorg.app</a></p>
            </address>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 px-6 text-center text-sm text-gray-400 mt-8">
        © 2025 SimplyOrg. All rights reserved. &nbsp;·&nbsp;
        <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
      </footer>
    </div>
  );
}
