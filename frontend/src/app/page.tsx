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
        <h2 className="text-3xl font-bold text-center mb-8">Affordable Coverage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-lg shadow">
            <h3 className="text-2xl font-bold mb-4">Round Play</h3>
            <p className="text-4xl font-bold text-secondary mb-4">$15-50</p>
            <p className="text-gray-600 mb-4">Per round, based on your profile</p>
            <ul className="space-y-2 mb-6">
              <li>✓ Hole damage coverage</li>
              <li>✓ Lost ball protection</li>
              <li>✓ Injury coverage</li>
            </ul>
            <Link href="/register" className="block text-center bg-secondary text-white py-2 rounded hover:bg-emerald-700">
              Get Started
            </Link>
          </div>
          <div className="bg-white p-8 rounded-lg shadow border-2 border-secondary">
            <h3 className="text-2xl font-bold mb-4">Annual Pass</h3>
            <p className="text-4xl font-bold text-accent mb-4">$299</p>
            <p className="text-gray-600 mb-4">Unlimited coverage for 1 year</p>
            <ul className="space-y-2 mb-6">
              <li>✓ All round play benefits</li>
              <li>✓ Equipment coverage</li>
              <li>✓ Hole-in-one bonus</li>
              <li>✓ Priority claims</li>
            </ul>
            <Link href="/register" className="block text-center bg-accent text-black py-2 rounded hover:bg-amber-600 font-bold">
              Best Value
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
