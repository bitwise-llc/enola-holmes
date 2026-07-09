import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service - Enola",
  description: "Terms and conditions for Enola facial recognition app",
};

export default function TermsOfService() {
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
            <h1 className="text-4xl font-bold text-black mb-4">Terms of Service</h1>
            <p className="text-sm text-black/60">Last updated: June 12, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Agreement to Terms</h2>
              <p className="text-black/70 leading-relaxed">
                By accessing or using Enola, you agree to be bound by these Terms of Service and all
                applicable laws and regulations. If you do not agree with any of these terms, you are
                prohibited from using this service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Description of Service</h2>
              <p className="text-black/70 leading-relaxed">
                Enola provides facial recognition technology that allows users to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/70">
                <li>Upload or scan facial images</li>
                <li>Search for matches using facial recognition</li>
                <li>Receive identification and analysis results</li>
                <li>Access related information about recognized individuals</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Acceptable Use</h2>
              <p className="text-black/70 leading-relaxed">
                You agree to use Enola only for lawful purposes. You must not use our service:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/70">
                <li>To violate any local, state, national, or international law</li>
                <li>To stalk, harass, or harm another person</li>
                <li>To infringe upon the privacy rights of others</li>
                <li>To upload images without proper consent</li>
                <li>To engage in unauthorized surveillance</li>
                <li>For any discriminatory or unethical purposes</li>
                <li>To reverse engineer or attempt to extract our algorithms</li>
                <li>To distribute, sell, or commercially exploit recognition results</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">User Accounts</h2>
              <p className="text-black/70 leading-relaxed">
                To use Enola, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/70">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
                <li>Not share your account with others</li>
              </ul>
              <p className="text-black/70 leading-relaxed">
                You must be at least 18 years old to create an account and use our service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Content and Intellectual Property</h2>
              <h3 className="text-xl font-semibold text-black">Your Content</h3>
              <p className="text-black/70 leading-relaxed">
                You retain ownership of images you upload. By using our service, you grant us a
                limited license to process your images for the purpose of providing facial recognition
                services. We do not claim ownership of your uploaded content.
              </p>

              <h3 className="text-xl font-semibold text-black mt-6">Our Content</h3>
              <p className="text-black/70 leading-relaxed">
                The Enola app, including its algorithms, design, features, and functionality, is owned
                by us and protected by intellectual property laws. You may not copy, modify, distribute,
                or create derivative works without our explicit permission.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Subscription and Payments</h2>
              <p className="text-black/70 leading-relaxed">
                Some features may require a paid subscription. By subscribing, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/70">
                <li>Pay all applicable fees</li>
                <li>Provide accurate payment information</li>
                <li>Allow automatic renewal unless cancelled</li>
                <li>Accept that fees are non-refundable except as required by law</li>
              </ul>
              <p className="text-black/70 leading-relaxed">
                We reserve the right to modify pricing with advance notice to existing subscribers.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Service Availability</h2>
              <p className="text-black/70 leading-relaxed">
                We strive to maintain service availability but do not guarantee uninterrupted access.
                We may:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/70">
                <li>Perform maintenance that temporarily limits access</li>
                <li>Modify or discontinue features with or without notice</li>
                <li>Suspend service for security or legal reasons</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Disclaimer of Warranties</h2>
              <p className="text-black/70 leading-relaxed">
                Enola is provided "as is" and "as available" without warranties of any kind. We do not
                guarantee:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/70">
                <li>100% accuracy of recognition results</li>
                <li>Availability of all features at all times</li>
                <li>That the service will be error-free or secure</li>
                <li>That recognition results are suitable for any particular purpose</li>
              </ul>
              <p className="text-black/70 leading-relaxed">
                You use Enola at your own risk and should verify critical information independently.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Limitation of Liability</h2>
              <p className="text-black/70 leading-relaxed">
                To the maximum extent permitted by law, we shall not be liable for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/70">
                <li>Indirect, incidental, or consequential damages</li>
                <li>Loss of profits, data, or business opportunities</li>
                <li>Damages resulting from unauthorized access to your account</li>
                <li>Damages from reliance on recognition results</li>
              </ul>
              <p className="text-black/70 leading-relaxed">
                Our total liability shall not exceed the amount you paid us in the 12 months preceding
                the claim.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Indemnification</h2>
              <p className="text-black/70 leading-relaxed">
                You agree to indemnify and hold us harmless from any claims, damages, or expenses arising
                from:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/70">
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another person</li>
                <li>Your use of the service</li>
                <li>Content you upload or share</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Termination</h2>
              <p className="text-black/70 leading-relaxed">
                We reserve the right to suspend or terminate your account if you:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/70">
                <li>Violate these Terms of Service</li>
                <li>Engage in fraudulent or illegal activity</li>
                <li>Abuse or misuse the service</li>
                <li>Fail to pay applicable fees</li>
              </ul>
              <p className="text-black/70 leading-relaxed">
                You may terminate your account at any time through the app settings. Upon termination,
                your right to use the service ceases immediately.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Privacy</h2>
              <p className="text-black/70 leading-relaxed">
                Your use of Enola is also governed by our Privacy Policy. Please review it to understand
                our data practices.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Governing Law</h2>
              <p className="text-black/70 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of [Your
                Jurisdiction], without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Dispute Resolution</h2>
              <p className="text-black/70 leading-relaxed">
                Any disputes arising from these Terms or use of Enola shall be resolved through binding
                arbitration, except where prohibited by law. You waive your right to participate in class
                action lawsuits.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Changes to Terms</h2>
              <p className="text-black/70 leading-relaxed">
                We may modify these Terms at any time. We will notify users of material changes through
                the app or via email. Continued use after changes constitutes acceptance of the modified
                Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Contact Information</h2>
              <p className="text-black/70 leading-relaxed">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-white rounded-2xl border border-black/5 p-6 space-y-2">
                <p className="text-black/70">
                  <span className="font-semibold text-black">Email:</span> legal@enola.app
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
