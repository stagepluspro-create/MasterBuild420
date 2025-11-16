import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050510] via-[#0B0C1A] to-[#121227] p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-white/5 border border-white/10">
            <FileQuestion className="w-12 h-12 text-[#00E8FF]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-white font-heading">404</h1>
          <h2 className="text-2xl font-bold text-white font-heading">
            Page Not Found
          </h2>
          <p className="text-gray-400">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="bg-gradient-to-r from-[#00E8FF] via-[#9B5CFF] to-[#FF008C] hover:opacity-90">
              Return Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="border-white/10 hover:bg-white/5">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
