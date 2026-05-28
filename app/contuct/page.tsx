'use client';

import { useState } from 'react';
import { Mail, User, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Message sent successfully!');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white flex justify-center px-6 py-20">
      <div className="w-full max-w-2xl space-y-10">

        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-semibold">
            Contact <span className="text-[#26bbff]">Us</span>
          </h1>
          <p className="text-white/50">
            We usually reply within 24 hours.
          </p>
        </div>

        {/* FORM CARD */}
        <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl space-y-5">

          {/* Name */}
          <Input
            icon={<User className="w-4 h-4" />}
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
          />

          {/* Email */}
          <Input
            icon={<Mail className="w-4 h-4" />}
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Your email"
          />

          {/* Subject */}
          <Input
            icon={<MessageSquare className="w-4 h-4" />}
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Subject"
          />

          {/* Message */}
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Write your message..."
            rows={6}
            className="w-full p-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-[#26bbff] resize-none"
          />

          {/* BUTTON */}
          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl bg-[#26bbff] text-black font-semibold hover:opacity-90 transition"
          >
            Send Message
          </button>

        </div>

        {/* INFO ROW */}
        <div className="grid sm:grid-cols-3 gap-4 text-center text-sm text-white/60">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            support@nexusvault.lat
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            Response: 24h
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            Secure Messaging
          </div>
        </div>

      </div>
    </div>
  );
}

function Input({
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10 focus-within:border-[#26bbff]">
      <span className="text-white/40">{icon}</span>
      <input
        {...props}
        className="w-full bg-transparent outline-none text-white"
      />
    </div>
  );
}