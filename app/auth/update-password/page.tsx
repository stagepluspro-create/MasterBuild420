"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const [password, setPassword] = useState("");

  const updatePassword = async () => {
    await supabase.auth.updateUser({ password });
    alert("Password updated.");
  };

  return (
    <div className="p-6">
      <h1>Update Password</h1>
      <input
        type="password"
        className="border p-2"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={updatePassword}>Save</button>
    </div>
  );
}
