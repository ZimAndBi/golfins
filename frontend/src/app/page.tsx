'use client'

import Link from 'next/link'

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section
        className="relative text-white py-32 px-6 rounded-lg overflow-hidden"
        style={{
          backgroundImage: 'url(/bgr-golf2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55 rounded-lg" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">Golf Insurance Made Simple</h1>
          <p className="text-xl mb-8 text-gray-200 drop-shadow">
            Protect your golf game with affordable, hassle-free insurance coverage.
          </p>
          <Link
            href="/quote"
            className="bg-accent text-black px-8 py-3 rounded-lg font-bold hover:bg-amber-600 text-lg shadow-lg"
          >
            Get a Quote →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="my-12">
        <h2 className="text-3xl font-bold text-center mb-8">Why Golfins?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2">Instant Quotes</h3>
            <p className="text-gray-600">Get insurance quotes in seconds, personalized to your play style.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2">Hole-in-One Protection</h3>
            <p className="text-gray-600">Special coverage for the shot of a lifetime with verification workflow.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-2">Easy Claims</h3>
            <p className="text-gray-600">Submit claims in minutes and track status in real-time.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="my-12 bg-gray-100 py-12 px-6 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-2">Insurance Programs</h2>
        <p className="text-center text-gray-500 mb-8">Choose the coverage that fits your game</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-1">Spot — 1 Day</h3>
            <p className="text-gray-400 text-sm mb-4">Single round coverage</p>
            <p className="text-3xl font-bold text-secondary mb-1">100,000 ₫</p>
            <p className="text-xs text-gray-500 mb-4">(incl. VAT)</p>
            <ul className="space-y-2 mb-6 text-sm">
              <li>✓ Liability to public: 20M ₫</li>
              <li>✓ Golfing equipment: 5M ₫</li>
              <li>✓ Personal accident: 50M ₫</li>
              <li>✓ Personal effects: 4M ₫</li>
            </ul>
            <Link href="/quote" className="block text-center bg-secondary text-white py-2 rounded hover:bg-emerald-700">
              Get Quote
            </Link>
          </div>
          <div className="bg-white p-8 rounded-lg shadow border-2 border-secondary relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full">POPULAR</span>
            <h3 className="text-xl font-bold mb-1">Annual — Plan B</h3>
            <p className="text-gray-400 text-sm mb-4">Full year, balanced coverage</p>
            <p className="text-3xl font-bold text-accent mb-1">2,090,000 ₫</p>
            <p className="text-xs text-gray-500 mb-4">(incl. VAT)</p>
            <ul className="space-y-2 mb-6 text-sm">
              <li>✓ Liability: 2 Billion ₫</li>
              <li>✓ Equipment: 30M ₫</li>
              <li>✓ Personal accident: 200M ₫</li>
              <li>✓ Hole-in-one: 20M ₫</li>
              <li>✓ Personal effects: 8M ₫</li>
            </ul>
            <Link href="/quote" className="block text-center bg-accent text-black py-2 rounded hover:bg-amber-600 font-bold">
              Best Value →
            </Link>
          </div>
          <div className="bg-white p-8 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-1">Annual — Plan C</h3>
            <p className="text-gray-400 text-sm mb-4">Maximum protection</p>
            <p className="text-3xl font-bold text-secondary mb-1">3,080,000 ₫</p>
            <p className="text-xs text-gray-500 mb-4">(incl. VAT)</p>
            <ul className="space-y-2 mb-6 text-sm">
              <li>✓ Liability: 3 Billion ₫</li>
              <li>✓ Equipment: 50M ₫</li>
              <li>✓ Personal accident: 200M ₫</li>
              <li>✓ Hole-in-one: 30M ₫</li>
              <li>✓ Personal effects: 10M ₫</li>
            </ul>
            <Link href="/quote" className="block text-center bg-secondary text-white py-2 rounded hover:bg-emerald-700">
              Get Quote
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-12">
        <h2 className="text-3xl font-bold mb-4">Ready to Protect Your Game?</h2>
        <Link href="/quote" className="inline-block bg-secondary text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-700 text-lg">
          Get Your Quote Today
        </Link>
      </section>
    </div>
  )
}
