"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="h-screen w-64 bg-gradient-to-b from-gray-900 to-black text-white p-6 border-r border-gray-800">

      <h1 className="text-2xl font-bold mb-10 tracking-wide">
        AI Copilot 🚀
      </h1>

      <nav className="flex flex-col gap-4 text-gray-300">

        <NavItem href="/" label="Dashboard" />
        <NavItem href="/pipeline" label="Pipeline" />
        <NavItem href="/jobs" label="Jobs" />
        <NavItem href="/notes" label="Notes" />
        <NavItem href="/automation" label="Automation" />

      </nav>
    </div>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}>
      <div className="p-3 rounded-xl hover:bg-gray-800 hover:text-white transition cursor-pointer">
        {label}
      </div>
    </Link>
  );
}