import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple nav */}
      <header className="border-b border-gray-100 py-4 px-6">
        <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
          ← Back to SimplyOrg
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: January 1, 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <p className="text-gray-600">
            SimplyOrg ("we," "us," or "our") is committed to protecting your personal data. This Privacy Policy explains what data we collect, how we use it, and your rights under applicable privacy laws, including the EU General Data Protection Regulation (GDPR) and UK GDPR.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. What Data We Collect</h2>
            <p><strong>Account Information:</strong> When you register, we collect your name, email address, and (optionally) company name. If you subscribe to a paid plan, billing information is handled by our payment processor (Paddle) — we do not store credit card numbers.</p>
            <p className="mt-3"><strong>Org Chart Data:</strong> We store the organizational data you create within SimplyOrg, including employee names, titles, roles, departments, and reporting relationships you enter into the platform.</p>
            <p className="mt-3"><strong>Usage Analytics:</strong> We collect anonymized usage data such as feature interactions, session duration, page views, and error reports to understand how the Service is used and improve it. This data does not personally identify you.</p>
            <p className="mt-3"><strong>Technical Data:</strong> We automatically collect IP addresses, browser type, device information, and access logs for security, fraud prevention, and debugging purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Data</h2>
            <p>We use your data to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide, operate, and maintain the Service</li>
              <li>Process payments and manage your subscription</li>
              <li>Send transactional emails (account confirmation, invoices, security alerts)</li>
              <li>Provide customer support</li>
              <li>Improve and develop new features (using anonymized analytics)</li>
              <li>Comply with legal obligations</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
            <p className="mt-3">We do not use your org chart data for advertising or sell it to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Data Storage &amp; Security</h2>
            <p>
              Your data is stored on <strong>Supabase</strong>, a cloud database platform hosted on AWS infrastructure. We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Encryption in transit (TLS 1.2+) and at rest (AES-256)</li>
              <li>Row-level security policies to prevent unauthorized data access</li>
              <li>Regular automated backups</li>
              <li>Access controls and audit logging for internal systems</li>
            </ul>
            <p className="mt-3">
              While we take reasonable precautions, no system is 100% secure. If you become aware of a security concern, please contact us at <a href="mailto:security@simplyorg.app" className="text-blue-600 hover:underline">security@simplyorg.app</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Third-Party Services</h2>
            <p>We use the following third-party services to operate SimplyOrg:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Clerk</strong> — Authentication and session management. Clerk processes your email address and authentication tokens. See <a href="https://clerk.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Clerk's Privacy Policy</a>.</li>
              <li><strong>Paddle</strong> — Payment processing and subscription billing. Paddle is the Merchant of Record for SimplyOrg subscriptions. See <a href="https://www.paddle.com/legal/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Paddle's Privacy Policy</a>.</li>
              <li><strong>Supabase</strong> — Database and backend storage. Your org chart data is stored in Supabase-managed databases. See <a href="https://supabase.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Supabase's Privacy Policy</a>.</li>
            </ul>
            <p className="mt-3">Each of these services has its own privacy practices. We have data processing agreements with these providers where required by GDPR.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights (GDPR &amp; UK GDPR)</h2>
            <p>If you are located in the EU, EEA, or UK, you have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Erasure ("Right to be Forgotten"):</strong> Request deletion of your personal data, subject to legal retention requirements.</li>
              <li><strong>Portability:</strong> Request your data in a structured, machine-readable format (JSON or CSV).</li>
              <li><strong>Restriction:</strong> Request that we restrict processing of your data under certain circumstances.</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests.</li>
              <li><strong>Withdraw Consent:</strong> Where processing is based on consent, you may withdraw it at any time.</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, email <a href="mailto:privacy@simplyorg.app" className="text-blue-600 hover:underline">privacy@simplyorg.app</a>. We will respond within 30 days. You also have the right to lodge a complaint with your local data protection authority.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies</h2>
            <p>We use the following types of cookies:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Strictly necessary:</strong> Authentication session cookies required for the Service to function. These cannot be disabled.</li>
              <li><strong>Analytics:</strong> Anonymized usage tracking to improve the Service. You may opt out of these in your account settings.</li>
            </ul>
            <p className="mt-3">We do not use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. If you delete your account or cancel your subscription, we will delete your personal data within 30 days, except where we are required to retain it for longer periods to comply with legal obligations (e.g., tax records, which may be retained for up to 7 years).
            </p>
            <p className="mt-3">Anonymized analytics data may be retained indefinitely as it cannot be linked back to you.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Children's Privacy</h2>
            <p>
              The Service is not directed to individuals under the age of 13 (or 16 in the EU). We do not knowingly collect personal data from children. If we become aware that we have collected data from a child without parental consent, we will delete it promptly. If you believe we may have data from a child, contact us at <a href="mailto:privacy@simplyorg.app" className="text-blue-600 hover:underline">privacy@simplyorg.app</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact for Privacy Requests</h2>
            <p>For any privacy-related questions, data requests, or concerns:</p>
            <address className="not-italic mt-2 space-y-1 text-gray-600">
              <p><strong>SimplyOrg — Privacy Team</strong></p>
              <p>Email: <a href="mailto:privacy@simplyorg.app" className="text-blue-600 hover:underline">privacy@simplyorg.app</a></p>
              <p>General: <a href="mailto:support@simplyorg.app" className="text-blue-600 hover:underline">support@simplyorg.app</a></p>
            </address>
            <p className="mt-3">We are committed to resolving privacy concerns promptly and transparently.</p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 px-6 text-center text-sm text-gray-400 mt-8">
        © 2025 SimplyOrg. All rights reserved. &nbsp;·&nbsp;
        <Link href="/terms" className="hover:text-gray-600">Terms of Service</Link>
      </footer>
    </div>
  );
}
