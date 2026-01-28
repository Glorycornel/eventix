'use client';

import { useEffect, useState } from 'react';

type TokenFieldProps = {
  onToken?: (token: string) => void;
};

export function TokenField({ onToken }: TokenFieldProps) {
  const [token, setToken] = useState('');

  useEffect(() => {
    const stored = window.localStorage.getItem('eventix_token') || '';
    setToken(stored);
    if (stored && onToken) {
      onToken(stored);
    }
  }, [onToken]);

  const persist = (value: string) => {
    setToken(value);
    window.localStorage.setItem('eventix_token', value);
    if (onToken) {
      onToken(value);
    }
  };

  return (
    <label className="flex flex-col gap-2 text-sm">
      Organizer JWT
      <input
        className="rounded-lg border border-neutral-300 bg-white/70 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
        placeholder="Paste access token"
        value={token}
        onChange={(event) => persist(event.target.value)}
      />
    </label>
  );
}
