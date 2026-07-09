import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Support - Enola",
  description: "Get support for Enola facial recognition app",
};

export default function Support() {
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
            <h1 className="text-4xl font-bold text-black mb-4">Support</h1>
            <p className="text-lg text-black/70">We're here to help</p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Get in Touch</h2>
              <p className="text-black/70 leading-relaxed">
                Have questions, feedback, or need assistance? Our support team is ready to help you.
                We typically respond within 24 hours.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Contact Information</h2>
              <div className="bg-white rounded-2xl border border-black/5 p-8 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-black mb-2">Email Support</h3>
                  <a
                    href="mailto:support@tryenola.com"
                    className="text-xl text-blue-600 hover:text-blue-700 transition-colors font-medium"
                  >
                    support@tryenola.com
                  </a>
                </div>
                <p className="text-black/70 text-sm">
                  When reaching out, please include:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-black/70 text-sm">
                  <li>A detailed description of your issue or question</li>
                  <li>Your account email (if applicable)</li>
                  <li>Any relevant screenshots or error messages</li>
                  <li>Device and operating system information (if technical issue)</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-black">Privacy & Data</h2>
              <p className="text-black/70 leading-relaxed">
                For questions about how we handle your data, please review our{" "}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-700 transition-colors font-medium">
                  Privacy Policy
                </Link>
                . For data deletion requests or privacy concerns, contact us at the email above.
              </p>
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
