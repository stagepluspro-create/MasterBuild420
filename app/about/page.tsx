export default function About() {
  return (
    <div className="min-h-screen pt-28 px-4 pb-12">
      <div className="max-w-4xl mx-auto glass-panel p-8">
        <h1 className="text-4xl font-bold gradient-text mb-6">About Stage Tech Pro</h1>
        <div className="space-y-6 text-gray-300">
          <p className="text-xl">
            Stage Tech Pro is the ultimate toolkit for live production professionals.
          </p>

          <p>
            Built by technicians for technicians, our platform brings together 35+
            specialized tools for audio, lighting, video, planning, networking, and
            utilities - all in one unified dashboard.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Our Mission</h2>
          <p>
            To empower live production professionals with reliable, accessible tools that
            make their work easier, faster, and more efficient.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Why Stage Tech Pro?</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Comprehensive toolkit in one place</li>
            <li>Works offline with PWA technology</li>
            <li>Regular updates and new tools</li>
            <li>Built with industry standards in mind</li>
            <li>Affordable pricing for individuals and teams</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Get in Touch</h2>
          <p>
            Have feedback or suggestions? We&apos;d love to hear from you at
            feedback@stagetechpro.online
          </p>
        </div>
      </div>
    </div>
  );
}
