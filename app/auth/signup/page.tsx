"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export default function SignUpPage() {
  const supabase = createBrowserSupabase();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) alert(error.message);
    else alert("Check your email to confirm your account!");
  };

  return (
    <div className="p-6">
      <h1>Create Account</h1>
      <input
        type="email"
        className="border p-2"
        placeholder="Email address"
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={signUp} className="btn">
        Sign Up
      </button>
    </div>
  );
}
