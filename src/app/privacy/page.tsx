import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      {/* Simple nav */}
      <header className="border-b border-gray-800 py-4 px-6">
        <Link href="/" className="text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors">
          ← Back to ClaudeKit
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: May 2026</p>

        <div className="space-y-10 leading-relaxed">

          <p className="text-gray-400">
            ClaudeKit ("we," "us," or "our") is committed to protecting your personal data. This Privacy Policy explains what data we collect, how we use it, and your rights under applicable privacy laws, including the EU General Data Protection Regulation (GDPR), UK GDPR, and the California Consumer Privacy Act (CCPA).
          </p>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. What Data We Collect</h2>
            <p><strong className="text-gray-200">Account Information:</strong> When you register, we collect your name and email address via Clerk, our authentication provider. We do not store credit card numbers — payment data is handled directly by Paddle.</p>
            <p className="mt-3"><strong className="text-gray-200">Org Chart Data:</strong> We store the organizational data you create within ClaudeKit, including employee names, titles, roles, departments, reporting relationships, and scenario plans you enter into the platform.</p>
            <p className="mt-3"><strong className="text-gray-200">Usage Analytics:</strong> We collect anonymized usage data such as feature interactions, session duration, and page views to understand how the Service is used and improve it. This data does not personally identify you.</p>
            <p className="mt-3"><strong className="text-gray-200">Technical Data:</strong> We automatically collect IP addresses, browser type, device information, and access logs for security, fraud prevention, and debugging purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Your Data</h2>
            <p>We use your data to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-400">
              <li>Provide, operate, and maintain the Service</li>
              <li>Process payments and manage your subscription via Paddle</li>
              <li>Send transactional emails (trial expiry notices, team invitations, invoices)</li>
              <li>Provide customer support</li>
              <li>Improve and develop new features using anonymized analytics</li>
              <li>Comply with legal obligations</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
            <p className="mt-3">We do not use your org chart data for advertising and we do not sell your data to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Data Storage &amp; Security</h2>
            <p>
              Your data is stored on <strong className="text-gray-200">Supabase</strong>, a cloud database platform hosted on AWS infrastructure in the United States. We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-400">
              <li>Encryption in transit (TLS 1.2+) and at rest (AES-256)</li>
              <li>Row-level security policies to prevent unauthorized data access</li>
              <li>Regular automated backups</li>
              <li>Access controls and audit logging</li>
            </ul>
            <p className="mt-3">
              While we take reasonable precautions, no system is 100% secure. If you become aware of a security concern, please contact us at{" "}
              <a href="mailto:dsteinsapir@gmail.com" className="text-blue-400 hover:underline">dsteinsapir@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p>We use the following third-party services to operate ClaudeKit:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-400">
              <li>
                <strong className="text-gray-200">Clerk</strong> — Authentication and session management. Clerk processes your email address and authentication tokens. See{" "}
                <a href="https://clerk.com/privacy" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Clerk&apos;s Privacy Policy</a>.
              </li>
              <li>
                <strong className="text-gray-200">Paddle</strong> — Payment processing and subscription billing. Paddle is the Merchant of Record for ClaudeKit subscriptions, meaning they collect and process your payment information directly under their own terms. We do not receive or store your card details. See{" "}
                <a href="https://www.paddle.com/legal/privacy" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Paddle&apos;s Privacy Policy</a>.
              </li>
              <li>
                <strong className="text-gray-200">Supabase</strong> — Database and backend storage hosted in the US. Your org chart data is stored in Supabase-managed databases. See{" "}
                <a href="https://supabase.com/privacy" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Supabase&apos;s Privacy Policy</a>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Your Rights (GDPR &amp; UK GDPR)</h2>
            <p>If you are located in the EU, EEA, or UK, you have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-400">
              <li><strong className="text-gray-200">Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong className="text-gray-200">Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong className="text-gray-200">Erasure ("Right to be Forgotten"):</strong> Request deletion of your personal data. You can delete your org data and account at any time from within the Service.</li>
              <li><strong className="text-gray-200">Portability:</strong> Request your data in a structured, machine-readable format (JSON or CSV).</li>
              <li><strong className="text-gray-200">Restriction:</strong> Request that we restrict processing of your data under certain circumstances.</li>
              <li><strong className="text-gray-200">Objection:</strong> Object to processing based on legitimate interests.</li>
              <li><strong className="text-gray-200">Withdraw Consent:</strong> Where processing is based on consent, you may withdraw it at any time.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email{" "}
              <a href="mailto:dsteinsapir@gmail.com" className="text-blue-400 hover:underline">dsteinsapir@gmail.com</a>. We will respond within 30 days. You also have the right to lodge a complaint with your local data protection authority.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. California Residents (CCPA)</h2>
            <p>
              If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, the right to delete your personal information, and the right to opt out of the sale of personal information. We do not sell personal information. To exercise your CCPA rights, contact us at{" "}
              <a href="mailto:dsteinsapir@gmail.com" className="text-blue-400 hover:underline">dsteinsapir@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Cookies</h2>
            <p>We use the following types of cookies:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-400">
              <li><strong className="text-gray-200">Strictly necessary:</strong> Authentication session cookies required for the Service to function. These cannot be disabled.</li>
              <li><strong className="text-gray-200">Analytics:</strong> Anonymized usage tracking to improve the Service.</li>
            </ul>
            <p className="mt-3">We do not use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. If you delete your account or cancel your subscription, we will delete your personal data within 30 days, except where we are required to retain it for longer periods to comply with legal obligations (e.g., tax records, which may be retained for up to 7 years).
            </p>
            <p className="mt-3">Anonymized analytics data may be retained indefinitely as it cannot be linked back to you.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Children&apos;s Privacy</h2>
            <p>
              The Service is not directed to individuals under the age of 16. We do not knowingly collect personal data from children. If you believe we may have data from a child, contact us at{" "}
              <a href="mailto:dsteinsapir@gmail.com" className="text-blue-400 hover:underline">dsteinsapir@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Governing Law</h2>
            <p>
              This Privacy Policy is governed by the laws of Chile. Any disputes arising under this policy shall be subject to the jurisdiction of the courts of Chile, without prejudice to any mandatory consumer rights you may have under your local laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Contact</h2>
            <p>For any privacy-related questions, data requests, or concerns:</p>
            <address className="not-italic mt-2 space-y-1 text-gray-400">
              <p><strong className="text-gray-200">ClaudeKit</strong></p>
              <p>Email: <a href="mailto:dsteinsapir@gmail.com" className="text-blue-400 hover:underline">dsteinsapir@gmail.com</a></p>
            </address>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-800 py-6 px-6 text-center text-sm text-gray-600 mt-8">
        © 2026 ClaudeKit. All rights reserved. &nbsp;·&nbsp;
        <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
      </footer>
    </div>
  );
}
