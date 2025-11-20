"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export default function SignUpPage() {
  const supabase = createBrowserSupabase();
  const [email, setEmail] = useState("");

  const signUp = async () => {
    await supabase.auth.signUp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });

    alert("Check email to confirm your account!");
  };

  return (
    <div className="p-6">
      <h1>Create Account</h1>
      <input
        className="border p-2"
        type="email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={signUp}>Sign Up</button>
    </div>
  );
}
