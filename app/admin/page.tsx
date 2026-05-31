'use client';

import dynamic from "next/dynamic";

const AdminPanel = dynamic(() => import("./AdminPanel"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export default function Page() {
  return <AdminPanel />;
}

