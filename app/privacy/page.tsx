export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white px-6 py-16 flex justify-center">
      <div className="w-full max-w-4xl space-y-10">

        <header className="space-y-2">
          <h1 className="text-3xl font-bold">NexusVault Privacy Policy</h1>
          <p className="text-sm text-white/40">Last Updated: May 29, 2026</p>
        </header>

        <section className="space-y-4">
          <p className="text-white/80">
            Welcome to NexusVault. This Privacy Policy explains how we collect, use,
            and protect your information when you use our platform.
          </p>
        </section>

        <Section title="1. Information We Collect">
          <ul className="list-disc pl-5 text-white/80 space-y-1">
            <li>Account information (email, username)</li>
            <li>Device and browser data</li>
            <li>Purchase and transaction history</li>
            <li>Usage data (pages visited, clicks, interactions)</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Data">
          <ul className="list-disc pl-5 text-white/80 space-y-1">
            <li>To provide and improve NexusVault services</li>
            <li>To process purchases and manage your account</li>
            <li>To personalize game recommendations</li>
            <li>To detect fraud and improve security</li>
          </ul>
        </Section>

        <Section title="3. Cookies & Tracking">
          <p className="text-white/80">
            We use cookies to improve your experience, remember preferences,
            and analyze platform performance.
          </p>
        </Section>

        <Section title="4. Data Sharing">
          <p className="text-white/80">
            We do not sell your personal data. We may share limited data with:
            payment providers, analytics services, and security partners.
          </p>
        </Section>

        <Section title="5. Data Security">
          <p className="text-white/80">
            We use industry-standard security measures to protect your data,
            but no system is 100% secure.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <ul className="list-disc pl-5 text-white/80 space-y-1">
            <li>Access your data</li>
            <li>Request deletion</li>
            <li>Update account information</li>
            <li>Opt out of marketing emails</li>
          </ul>
        </Section>

        <Section title="7. Third-Party Services">
          <p className="text-white/80">
            NexusVault may use third-party services such as payment gateways
            and analytics tools. Each service has its own privacy policy.
          </p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p className="text-white/80">
            We may update this Privacy Policy from time to time. Changes will be
            posted on this page with an updated date.
          </p>
        </Section>

        <footer className="pt-10 text-center text-xs text-white/40">
          By using NexusVault, you agree to this Privacy Policy.
        </footer>

      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}