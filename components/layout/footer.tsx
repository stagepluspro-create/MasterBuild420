import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-24">
      <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="font-bold gradient-text mb-2">Stage Tech Pro</div>
          <p className="text-sm text-gray-400">
            Professional toolkit for live production technicians.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Product</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <Link href="/dashboard" className="hover:text-white transition-colors">
                Tools
              </Link>
            </li>
            <li>
              <Link href="/#pricing" className="hover:text-white transition-colors">
                Pricing
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Support</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/report-bug" className="hover:text-white transition-colors">
                Report Bug
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-gray-500 pb-8">
        © 2025 Stage Tech Pro. All rights reserved.
      </div>
    </footer>
  );
}
