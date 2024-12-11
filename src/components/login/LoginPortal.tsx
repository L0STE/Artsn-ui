'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LoginDialog } from './LoginDialog';

export function LoginPortal() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <LoginDialog />,
    document.body
  );
}