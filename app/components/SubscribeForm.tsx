"use client";

import { useState } from "react";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();

    await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setEmail("");
    alert("Subscribed!");
  }

  return (
    <form onSubmit={subscribe} className="flex gap-2">
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email"
        className="border p-2"
      />
      <button className="bg-blue-500 text-white px-4">
        Subscribe
      </button>
    </form>
  );
}