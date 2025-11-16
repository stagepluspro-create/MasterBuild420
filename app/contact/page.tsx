"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Contact() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    setSent(true);
    setTimeout(() => {
      setEmail("");
      setMsg("");
      setSent(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen pt-28 px-4 pb-12">
      <div className="max-w-lg mx-auto glass-panel p-8">
        <h1 className="text-3xl font-bold gradient-text mb-4">Contact Us</h1>
        <p className="text-gray-400 mb-6">
          Have questions? We&apos;d love to hear from you.
        </p>

        {sent && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
            Message sent successfully!
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Your Email</label>
            <Input
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Message</label>
            <Textarea
              className="h-32"
              placeholder="Tell us what you need help with..."
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleSubmit}>
            Send Message
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 space-y-2 text-sm">
          <p className="text-gray-400">You can also reach us at:</p>
          <p className="text-gray-300">Email: info@stagetechpro.online</p>
          <p className="text-gray-300">Support: support@stagetechpro.online</p>
        </div>
      </div>
    </div>
  );
}
