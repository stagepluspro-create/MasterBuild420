"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ReportBug() {
  const [email, setEmail] = useState("");
  const [desc, setDesc] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    setSent(true);
    setTimeout(() => {
      setEmail("");
      setDesc("");
      setSent(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen pt-28 px-4 pb-12">
      <div className="max-w-lg mx-auto glass-panel p-8">
        <h1 className="text-3xl font-bold gradient-text mb-4">Report a Bug</h1>
        <p className="text-gray-400 mb-6">
          Help us improve by reporting any issues you encounter.
        </p>

        {sent && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
            Bug report submitted successfully. Thank you!
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
            <label className="text-sm text-gray-300 mb-2 block">Describe the Issue</label>
            <Textarea
              className="h-32"
              placeholder="What happened? What were you trying to do?"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleSubmit}>
            Send Report
          </Button>
        </div>
      </div>
    </div>
  );
}
