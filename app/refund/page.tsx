import Link from "next/link";

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white px-6 py-20 flex justify-center">
      <div className="max-w-4xl w-full">

        <h1 className="text-3xl font-bold mb-4">
          NexusVault Refund Policy
        </h1>

        <p className="text-white/60 text-sm mb-10 leading-relaxed">
          If you’ve recently made a purchase through NexusVault and want a refund,
          this page explains what can be refunded, when you can request it, and how the process works.
        </p>

        {/* SECTION */}
        <Section title="1. What is covered by this policy?">
          This policy applies to all purchases made through NexusVault Store.
          It includes games, DLCs, and digital products purchased using RD Coins or real payments.
          Purchases made outside NexusVault are not covered by this policy.
        </Section>

        <Section title="2. Refund eligibility">
          PC games are eligible for refund within <b>7 days</b> of purchase and must have less than <b>2 hours</b> of playtime.
          Digital currency (RD Coins), consumables, and activated keys are generally non-refundable.
        </Section>

        <Section title="3. Refund types">
          <ul className="list-disc pl-5 space-y-2 text-white/70">
            <li>
              <b>Self-Refundable</b> — You can refund directly from your account transactions page.
            </li>
            <li>
              <b>Refundable</b> — Requires support request approval.
            </li>
            <li>
              <b>Non-Refundable</b> — Cannot be refunded (e.g. RD Coins, consumables).
            </li>
          </ul>
        </Section>

        <Section title="4. How to request a refund">
          Go to your NexusVault account → Transactions → select purchase → click “Request Refund”.
          If manual review is required, contact support through Help Center with your order ID.
        </Section>

        <Section title="5. Refund processing">
          Refunds are processed within 3–7 business days.
          Refunds will be returned to the original payment method whenever possible.
        </Section>

        <Section title="6. Abuse policy">
          Repeated refund abuse (buying and refunding repeatedly) may result in account restrictions or suspension.
        </Section>

        <p className="text-xs text-white/40 mt-10">
          By using NexusVault, you agree to this refund policy and our{" "} 
          <Link href="/terms" className="underline text-white">
            Terms of Service
          </Link>
        </p>

      </div>
    </div>
  );
}

/* reusable section component */
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
