"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Menu, X, LayoutDashboard, Plus, LogOut, User, Compass } from "lucide-react";
import { useState } from "react";

function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-violet via-violet-hover to-cyan shadow-[0_10px_35px_rgba(124,58,237,.3)] transition group-hover:rotate-3 group-hover:scale-105">
        <Compass size={21} className="text-white" />
        <Sparkles size={9} className="absolute right-2 top-2 text-white/90" />
      </div>
      <div>
        <span className="block text-lg font-extrabold tracking-[-0.035em] text-white-soft sm:text-xl">TripGen AI</span>
        <span className="hidden text-[10px] font-medium uppercase tracking-[0.24em] text-gray-soft sm:block">Adaptive travel intelligence</span>
      </div>
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between rounded-[22px] border border-white/10 bg-[#090f1f]/80 px-4 shadow-[0_16px_60px_rgba(0,0,0,.26)] backdrop-blur-2xl sm:px-5 lg:px-6">
        <Brand />

        <div className="hidden items-center gap-1 md:flex">
          {session ? (
            <>
              <Link href="/dashboard" className={`rounded-xl px-4 py-2 text-sm font-medium transition ${isActive("/dashboard") ? "bg-white/[0.08] text-white" : "text-gray-soft hover:bg-white/[0.05] hover:text-white"}`}>
                <span className="flex items-center gap-2"><LayoutDashboard size={16} /> Dashboard</span>
              </Link>
              <Link href="/trips/new" className={`rounded-xl px-4 py-2 text-sm font-medium transition ${isActive("/trips/new") ? "bg-white/[0.08] text-white" : "text-gray-soft hover:bg-white/[0.05] hover:text-white"}`}>
                <span className="flex items-center gap-2"><Plus size={16} /> New trip</span>
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="rounded-xl px-4 py-2 text-sm font-medium text-gray-soft transition hover:bg-white/[0.05] hover:text-white">
                <span className="flex items-center gap-2"><LogOut size={16} /> Logout</span>
              </button>
              <Link href="/dashboard" className="ml-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-violet/80 to-cyan/80 text-sm font-bold text-white shadow-lg">
                {session.user?.name?.[0]?.toUpperCase() ?? <User size={17} />}
              </Link>
            </>
          ) : (
            <>
              <Link href="/#features" className="rounded-xl px-4 py-2 text-sm font-medium text-gray-soft transition hover:bg-white/[0.05] hover:text-white">Features</Link>
              <Link href="/#how" className="rounded-xl px-4 py-2 text-sm font-medium text-gray-soft transition hover:bg-white/[0.05] hover:text-white">How it works</Link>
              <Link href="/#dna" className="rounded-xl px-4 py-2 text-sm font-medium text-gray-soft transition hover:bg-white/[0.05] hover:text-white">Travel DNA</Link>
              <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-medium text-gray-soft transition hover:text-white">Sign in</Link>
              <Link href="/register" className="ml-1 rounded-xl border border-white/10 bg-gradient-to-r from-violet to-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(124,58,237,.22)] transition hover:-translate-y-0.5">Start planning</Link>
            </>
          )}
        </div>

        <button aria-label="Toggle navigation" className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white md:hidden" onClick={() => setOpen((value) => !value)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mx-auto mt-2 max-w-7xl rounded-[22px] border border-white/10 bg-[#090f1f]/95 p-3 shadow-2xl backdrop-blur-2xl md:hidden">
            <div className="grid gap-1">
              {(session
                ? [["Dashboard", "/dashboard"], ["New Trip", "/trips/new"]]
                : [["Features", "/#features"], ["How it works", "/#how"], ["Travel DNA", "/#dna"], ["Sign in", "/login"], ["Create account", "/register"]]
              ).map(([label, href]) => (
                <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium text-gray-soft transition hover:bg-white/[0.06] hover:text-white">{label}</Link>
              ))}
              {session && <button onClick={() => signOut({ callbackUrl: "/" })} className="rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-soft transition hover:bg-white/[0.06] hover:text-white">Logout</button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
