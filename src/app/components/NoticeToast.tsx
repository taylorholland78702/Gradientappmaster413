import { useEffect, useState } from 'react';
import { onNotice } from '../utils/notify';

export function NoticeToast() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => onNotice(setMessage), []);
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 6000);
    return () => window.clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return (
    <div role="status" aria-live="polite" className="absolute top-4 left-1/2 -translate-x-1/2 max-w-[90vw] bg-wav-surface backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full shadow-lg z-50">
      {message}
    </div>
  );
}
