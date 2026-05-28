export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white relative overflow-hidden">
      {/* BACKGROUND DECOR */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#26bbff]/10 blur-[120px] rounded-full" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        
        {/* TITLE */}
        <h1 className="text-3xl sm:text-4xl font-bold text-center">
          NexusVault <span className="text-[#26bbff]">Support</span>
        </h1>

        {/* SUBTITLE */}
        <p className="text-white/60 mt-3 text-center">
          How can we help?
        </p>

        {/* INPUT BOX */}
        <div className="w-full max-w-2xl mt-10">
          <textarea
            placeholder="Describe your problem here"
            className="w-full h-40 p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 outline-none focus:border-[#26bbff] resize-none"
          />
        </div>

        {/* TERMS */}
        <p className="text-xs text-white/40 mt-6 text-center max-w-lg">
          By continuing, you agree to our <a href="#" className="underline text-white">Terms</a> and acknowledge our <a href="#" className="underline text-white">Privacy Policy.</a>
        </p>

        {/* BUTTON */}
        <button className="mt-6 px-6 py-3 rounded-lg bg-[#26bbff] text-black font-medium hover:bg-[#1ea8e6] transition">
          Continue
        </button>
      </div>
    </main>
  );
}