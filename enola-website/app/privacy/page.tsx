import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Enola",
  description: "Privacy policy for Enola facial recognition app",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#fdfaf5]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fdfaf5]/80 backdrop-blur-sm border-b border-black/5">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-8 w-8">
                <Image
                  src="/enola-headhshot.png"
                  alt="Enola"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-2xl font-bold text-black">Enola</span>
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-black/60 hover:text-black transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 pt-32 pb-16 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-black mb-4">Privacy Policy</h1>
            <p className="text-sm text-black/60">Last updated: June 12, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Introduction</h2>
              <p className="text-black/70 leading-relaxed">
                Welcome to Enola. We respect your privacy and are committed to protecting your personal data.
                This privacy policy explains how we collect, use, and safeguard your information when you use
                our facial recognition application.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Information We Collect</h2>
              <h3 className="text-xl font-semibold text-black">Personal Information</h3>
              <p className="text-black/70 leading-relaxed">
                When you create an account, we collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/70">
                <li>Email address</li>
                <li>Profile information you choose to provide</li>
                <li>Authentication credentials</li>
              </ul>

              <h3 className="text-xl font-semibold text-black mt-6">Biometric Data</h3>
              <p className="text-black/70 leading-relaxed">
                When you use our facial recognition features, we process:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/70">
                <li>Facial images you upload or scan</li>
                <li>Facial feature data extracted for recognition purposes</li>
                <li>Search queries and recognition results</li>
              </ul>

              <h3 className="text-xl font-semibold text-black mt-6">Usage Data</h3>
              <p className="text-black/70 leading-relaxed">
                We automatically collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/70">
                <li>Device information (type, operating system)</li>
                <li>App usage statistics</li>
                <li>Error logs and performance data</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">How We Use Your Information</h2>
              <p className="text-black/70 leading-relaxed">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/70">
                <li>Provide and maintain our facial recognition services</li>
                <li>Process your searches and deliver accurate results</li>
                <li>Improve our algorithms and service quality</li>
                <li>Send you service-related notifications</li>
                <li>Protect against fraudulent or illegal activity</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Data Storage and Security</h2>
              <p className="text-black/70 leading-relaxed">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/70">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure cloud storage infrastructure</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
              </ul>
              <p className="text-black/70 leading-relaxed">
                Uploaded images are processed and then automatically deleted from our servers.
                We only retain facial feature vectors necessary for recognition functionality.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Data Sharing</h2>
              <p className="text-black/70 leading-relaxed">
                We do not sell your personal information. We may share data with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/70">
                <li>Service providers who assist in operating our app</li>
                <li>Law enforcement when required by law</li>
                <li>Third parties with your explicit consent</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Your Rights</h2>
              <p className="text-black/70 leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/70">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to data processing</li>
                <li>Export your data</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="text-black/70 leading-relaxed">
                To exercise these rights, contact us through the app settings or email us.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Children's Privacy</h2>
              <p className="text-black/70 leading-relaxed">
                Our service is not intended for users under 18 years of age. We do not knowingly
                collect personal information from children. If you believe we have collected data
                from a child, please contact us immediately.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">International Users</h2>
              <p className="text-black/70 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own.
                We ensure appropriate safeguards are in place for international data transfers.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Changes to This Policy</h2>
              <p className="text-black/70 leading-relaxed">
                We may update this privacy policy periodically. We will notify you of significant
                changes through the app or via email. Continued use after changes constitutes acceptance
                of the updated policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Contact Us</h2>
              <p className="text-black/70 leading-relaxed">
                If you have questions about this privacy policy or our data practices, please contact us:
              </p>
              <div className="bg-white rounded-2xl border border-black/5 p-6 space-y-2">
                <p className="text-black/70">
                  <span className="font-semibold text-black">Email:</span> privacy@enola.app
                </p>
                <p className="text-black/70">
                  <span className="font-semibold text-black">Address:</span> [Your Company Address]
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 bg-white/50">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-black/60">
              © {new Date().getFullYear()} Enola. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-black/60 hover:text-black transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-black/60 hover:text-black transition-colors">
                Terms of Service
              </Link>
              <Link href="/support" className="text-sm text-black/60 hover:text-black transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
