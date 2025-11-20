"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export default function SignInPage() {
  const supabase = createBrowserSupabase();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) alert(error.message);
    else alert("Check your email for the login link!");
  };

  return (
    <div className="p-6">
      <h1>Sign In</h1>
      <input
        type="email"
        className="border p-2"
        placeholder="your@email.com"
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={signIn} disabled={loading} className="btn">
        {loading ? "Sending..." : "Send Magic Link"}
      </button>
    </div>
  );
}
