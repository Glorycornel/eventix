'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useAuthModal } from './AuthModalProvider';

type AuthLinkProps = {
  href: string;
  className?: string;
  intent?: string;
  children: React.ReactNode;
};

export function AuthLink({ href, className, intent, children }: AuthLinkProps) {
  const { token } = useAuth();
  const { openAuthModal } = useAuthModal();

  return (
    <>
      <Link
        href={href}
        className={className}
        onClick={(event) => {
          if (!token) {
            event.preventDefault();
            openAuthModal(intent);
          }
        }}
      >
        {children}
      </Link>
    </>
  );
}
