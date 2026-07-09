import Image from "next/image";
import Link from "next/link";
import WaitlistForm from "./components/WaitlistForm";

export default function Home() {
  return (
    <div className="relative h-screen overflow-hidden bg-[#fdfaf5]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fdfaf5]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Small Enola Avatar in Header */}
              <div className="relative h-8 w-8">
                <Image
                  src="/enola-headhshot.png"
                  alt="Enola"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-2xl font-bold text-black">Enola</span>
            </div>
            <a href="#waitlist" className="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-black/80">
              Join Waitlist
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative mx-auto max-w-7xl px-6 pt-28 pb-20 lg:px-8 h-[calc(100vh-140px)] flex items-center mt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Content */}
          <div className="relative z-10 space-y-8">
            <div>
              <span className="inline-block rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-medium tracking-wide text-black/70">
                INSTANT PHOTO RECOGNITION
              </span>
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight text-black lg:text-6xl">
              Scan any face,
              <br />
              get instant results.
            </h1>

            <p className="max-w-lg text-lg leading-relaxed text-black/60">
              Upload or scan any face and get powerful recognition results. Identify people, find matches, and unlock information instantly.
            </p>

            {/* Waitlist Section */}
            <div className="space-y-4" id="waitlist">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/5 px-4 py-2">
                <svg className="h-4 w-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-black">Get 5 free searches as a waitlisted user</span>
              </div>
              <WaitlistForm />
            </div>
          </div>

          {/* Right Phone Mockup */}
          <div className="relative lg:h-[700px]">
            {/* Phone Mockup */}
            <div className="relative z-10 mx-auto w-[300px] lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2">
              <div className="relative overflow-hidden rounded-[3rem] border-[14px] border-black bg-black shadow-2xl">
                <div className="aspect-[9/19.5] bg-gradient-to-b from-white to-gray-50">
                  {/* Phone Screen Content */}
                  <div className="flex h-full flex-col">
                    {/* Status Bar */}
                    <div className="flex items-center justify-between px-6 py-4 text-xs text-black/60">
                      <span className="font-medium">9:41</span>
                      <div className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">100%</span>
                      </div>
                    </div>

                    {/* Header */}
                    <div className="px-6 pt-2 pb-4">
                      <h2 className="text-2xl font-bold text-black">Scan Results</h2>
                      <p className="text-sm text-black/50">Analysis complete</p>
                    </div>

                    {/* Main Content */}
                    <div className="flex flex-1 flex-col px-6 pb-6">
                      {/* Image Card */}
                      <div className="relative mb-5 overflow-hidden rounded-3xl bg-white shadow-lg shadow-black/5 border border-black/5">
                        <div className="relative mx-auto h-52 w-full bg-gradient-to-br from-gray-50 to-gray-100">
                          <Image
                            src="/enola-body.png"
                            alt="Scanned result"
                            fill
                            className="object-contain p-4"
                          />
                          {/* Success Badge */}
                          <div className="absolute top-3 right-3">
                            <div className="flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="mb-5 grid grid-cols-3 gap-2">
                        <div className="rounded-2xl bg-white border border-black/5 p-3 text-center shadow-sm">
                          <div className="text-lg font-bold text-black">98%</div>
                          <div className="text-[10px] font-medium text-black/50">Match</div>
                        </div>
                        <div className="rounded-2xl bg-white border border-black/5 p-3 text-center shadow-sm">
                          <div className="text-lg font-bold text-black">0.2s</div>
                          <div className="text-[10px] font-medium text-black/50">Speed</div>
                        </div>
                        <div className="rounded-2xl bg-white border border-black/5 p-3 text-center shadow-sm">
                          <div className="text-lg font-bold text-black">High</div>
                          <div className="text-[10px] font-medium text-black/50">Quality</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-auto space-y-2.5">
                        <button className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all active:scale-95">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Details
                        </button>
                        <button className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-black/10 bg-white px-6 py-3.5 text-sm font-semibold text-black transition-all active:scale-95">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Scan Again
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notch */}
                <div className="absolute left-1/2 top-0 h-7 w-32 -translate-x-1/2 rounded-b-3xl bg-black"></div>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 border-t border-black/5 bg-white/50">
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
