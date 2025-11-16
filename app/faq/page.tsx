export default function FAQ() {
  const faqs = [
    {
      question: "What is Stage Tech Pro?",
      answer:
        "Stage Tech Pro is an all-in-one web platform providing 35+ specialized tools for live production professionals, including audio, lighting, video, planning, and networking tools.",
    },
    {
      question: "How much does it cost?",
      answer:
        "We offer two plans: Pro at $9.99/month for individuals and Team at $99.99/month for up to 30 members. Both include a 7-day free trial.",
    },
    {
      question: "Can I use it offline?",
      answer:
        "Yes! Stage Tech Pro is a PWA (Progressive Web App) that can be installed on your device and works offline with cached tools and data.",
    },
    {
      question: "What tools are available?",
      answer:
        "We currently have 5 live tools including DMX Calculator, Power Calculator, SPL Meter, Stage Plot Designer, and Patch List Generator. 30+ more tools are coming soon.",
    },
    {
      question: "Do I need to install anything?",
      answer:
        "No installation required! Access directly through your browser, or install as a PWA for offline access and a native app experience.",
    },
    {
      question: "Is there a free trial?",
      answer:
        "Yes, all plans include a 7-day free trial with no credit card required.",
    },
    {
      question: "Can I cancel anytime?",
      answer:
        "Absolutely. You can cancel your subscription at any time with no cancellation fees.",
    },
    {
      question: "Are the tools industry-standard compliant?",
      answer:
        "Yes, our tools follow industry standards including AES for audio, ESTA for DMX, and SMPTE for video and timecode.",
    },
  ];

  return (
    <div className="min-h-screen pt-28 px-4 pb-12">
      <div className="max-w-4xl mx-auto glass-panel p-8">
        <h1 className="text-4xl font-bold gradient-text mb-6">
          Frequently Asked Questions
        </h1>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="pb-6 border-b border-white/10 last:border-0">
              <h3 className="text-xl font-bold text-white mb-2">{faq.question}</h3>
              <p className="text-gray-300">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
