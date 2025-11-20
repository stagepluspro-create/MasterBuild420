"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function SignInPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");

  const signIn = async () => {
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    alert("Check your email for the login link.");
  };

  return (
    <div className="p-6">
      <h1>Sign In</h1>
      <input
        className="border p-2"
        type="email"
        placeholder="your@email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={signIn}>Send Magic Link</button>
    </div>
  );
}
