export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white px-6 py-20 flex justify-center">
      <div className="max-w-4xl w-full">

        <h1 className="text-3xl font-bold mb-4">
          NexusVault Terms of Service
        </h1>

        <p className="text-white/60 text-sm mb-10 leading-relaxed">
          These Terms of Service govern your use of NexusVault platform, including
          browsing, purchasing, and interacting with our digital game store.
        </p>

        <Section title="1. Acceptance of Terms">
          By accessing or using NexusVault, you agree to be bound by these Terms.
          If you do not agree, you must stop using the service immediately.
        </Section>

        <Section title="2. Account Registration">
          You may be required to create an account. You are responsible for maintaining
          the confidentiality of your login credentials and all activities under your account.
        </Section>

        <Section title="3. Purchases & Payments">
          All purchases made through NexusVault are final unless eligible under our Refund Policy.
          Prices may change at any time without prior notice.
        </Section>

        <Section title="4. Digital Content">
          All games, DLCs, and digital products are licensed, not sold.
          You are granted a non-transferable, non-exclusive license for personal use only.
        </Section>

        <Section title="5. User Conduct">
          You agree not to misuse the platform, attempt fraud, exploit bugs, or violate any laws.
          Abuse of the system may result in account suspension or termination.
        </Section>

        <Section title="6. Refunds">
          Refunds are subject to our Refund Policy. Certain digital goods like RD Coins are non-refundable.
        </Section>

        <Section title="7. Termination">
          We reserve the right to suspend or terminate accounts that violate these Terms without prior notice.
        </Section>

        <Section title="8. Changes to Terms">
          We may update these Terms at any time. Continued use of NexusVault means acceptance of the updated Terms.
        </Section>

        <p className="text-xs text-white/40 mt-10">
          By using NexusVault, you acknowledge and agree to these Terms of Service.
        </p>

      </div>
    </div>
  );
}

/* reusable section */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="text-white/70 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}