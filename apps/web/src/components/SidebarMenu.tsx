'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useAuthModal } from './AuthModalProvider';

const navItems = [
  {
    key: 'discover',
    label: 'Discover',
    href: '/',
    requiresAuth: false,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-10.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'saved',
    label: 'Saved',
    href: '/saved',
    requiresAuth: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M12 20.5c-4.5-2.5-8-6-8-10.1A4.9 4.9 0 0 1 9 5.5c1.5 0 2.8.7 3.6 1.8A4.5 4.5 0 0 1 16.2 5c2.4 0 4.8 1.7 4.8 5.3 0 4.3-3.6 7.8-9 10.2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'tickets',
    label: 'Tickets',
    href: '/me/tickets',
    requiresAuth: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v2a2 2 0 0 0 0 4v3A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-3a2 2 0 0 0 0-4v-2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 8.5v7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: 'account',
    label: 'Account',
    href: '/me',
    requiresAuth: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M12 13.5c-2.8 0-5.5 1.4-6.5 3.5a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3c-1-2.1-3.7-3.5-6.5-3.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    ),
  },
];

export function SidebarMenu({ buttonClassName = '' }: { buttonClassName?: string }) {
  const { token, clearToken } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const activeHref = useMemo(() => {
    if (pathname && navItems.some((item) => item.href === pathname)) {
      return pathname;
    }
    return '/';
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className={`z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-neutral-900/80 text-white shadow-lg shadow-black/40 backdrop-blur ${buttonClassName}`}
      >
        <span className="sr-only">Open menu</span>
        <span className="flex h-4 w-5 flex-col justify-between">
          <span className="h-0.5 w-full rounded-full bg-white" />
          <span className="h-0.5 w-full rounded-full bg-white/80" />
          <span className="h-0.5 w-full rounded-full bg-white/60" />
        </span>
      </button>

      <div
        className={`fixed inset-0 z-40 bg-black/55 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-72 max-w-[82vw] flex-col border-l border-white/10 bg-neutral-950/95 px-6 pb-6 pt-8 text-white shadow-2xl shadow-black/70 backdrop-blur transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold tracking-[0.2em] uppercase text-white/80">
            Menu
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        <nav className="mt-10 flex flex-1 flex-col gap-3">
          {navItems.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={(event) => {
                  if (item.requiresAuth && !token) {
                    event.preventDefault();
                    openAuthModal(
                      'Sign in to access saved events, tickets, and your account.',
                      'login',
                    );
                    return;
                  }
                  setOpen(false);
                }}
                className={`group flex items-center justify-between rounded-2xl border px-4 py-3 text-base font-medium transition ${
                  isActive
                    ? 'border-emerald-300/70 bg-emerald-400/10 text-emerald-100'
                    : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-white/70 group-hover:text-white">{item.icon}</span>
                  {item.label}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    isActive ? 'bg-emerald-300' : 'bg-white/20 group-hover:bg-white/60'
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          {token ? (
            <button
              type="button"
              onClick={() => {
                clearToken();
                setOpen(false);
              }}
              className="w-full rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 hover:border-white/30"
            >
              Sign out
            </button>
          ) : null}
          <div className="text-xs uppercase tracking-[0.3em] text-white/40">
            Eventix
          </div>
        </div>
      </aside>
    </>
  );
}
