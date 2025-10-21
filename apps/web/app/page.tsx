import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            Rush
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Rush is a tool for building websites with AI assistance
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-lg mb-2">AI-Powered</h3>
            <p className="text-gray-600 text-sm">
              Describe your vision and let AI generate production-ready code
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-lg mb-2">Live Preview</h3>
            <p className="text-gray-600 text-sm">
              See your changes instantly with integrated preview
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="font-semibold text-lg mb-2">Full Control</h3>
            <p className="text-gray-600 text-sm">
              Edit code directly with Monaco editor for fine-tuning
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
          >
            Get Started
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:shadow-lg transition-shadow border border-gray-200"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </main>
  );
}



