'use client';

import Link from 'next/link';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-light dark:bg-bg-dark">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-7xl font-bold mb-4 text-fg-light dark:text-fg-dark inline-block px-8 py-4 bg-primary-light dark:bg-primary-dark text-white dark:text-black rounded-xl shadow-lg">
            RUSH
          </h1>
          <p className="text-xl mt-6 text-fg-light dark:text-fg-dark">
            Build websites with AI assistance
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-left">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="font-semibold text-lg mb-2">AI-Powered</h3>
            <p className="text-sm text-muted-light dark:text-muted-dark">
              Describe your vision and let AI generate production-ready code
            </p>
          </Card>
          <Card className="p-6 text-left">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="font-semibold text-lg mb-2">Live Preview</h3>
            <p className="text-sm text-muted-light dark:text-muted-dark">
              See your changes instantly with integrated preview
            </p>
          </Card>
          <Card className="p-6 text-left">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="font-semibold text-lg mb-2">Full Control</h3>
            <p className="text-sm text-muted-light dark:text-muted-dark">
              Edit code directly with Monaco editor for fine-tuning
            </p>
          </Card>
        </div>

        {/* CTA */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/dashboard">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" size="lg">
              View on GitHub
            </Button>
          </a>
        </div>
      </div>
    </main>
  );
}



