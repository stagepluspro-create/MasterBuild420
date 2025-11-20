"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const supabase = createBrowserSupabase();
  const [email, setEmail] = useState("");

  const sendReset = async () => {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/update-password`,
    });
    alert("Check your email for reset link.");
  };

  return (
    <div className="p-6">
      <h1>Reset Password</h1>
      <input
        className="border p-2"
        type="email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={sendReset}>Send Reset Email</button>
    </div>
  );
}
