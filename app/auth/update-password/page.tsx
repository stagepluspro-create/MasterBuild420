"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export default function UpdatePasswordPage() {
  const supabase = createBrowserSupabase();
  const [password, setPassword] = useState("");

  const updatePassword = async () => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) alert(error.message);
    else alert("Password updated!");
  };

  return (
    <div className="p-6">
      <h1>Update Password</h1>
      <input
        type="password"
        placeholder="New Password"
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2"
      />
      <button onClick={updatePassword}>Save</button>
    </div>
  );
}
