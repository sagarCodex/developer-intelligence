'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't trigger in inputs/textareas
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Escape to blur
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // Navigation shortcuts (g + key)
      if (e.key === 'g') {
        // Wait for next key
        const handler = (e2: KeyboardEvent) => {
          document.removeEventListener('keydown', handler);
          switch (e2.key) {
            case 'd': router.push('/dashboard'); break;
            case 'n': router.push('/dashboard/notes'); break;
            case 's': router.push('/dashboard/snippets'); break;
            case 't': router.push('/dashboard/tasks'); break;
            case 'f': router.push('/dashboard/focus'); break;
            case 'p': router.push('/dashboard/projects'); break;
            case 'a': router.push('/dashboard/assistant'); break;
          }
        };
        document.addEventListener('keydown', handler);
        setTimeout(() => document.removeEventListener('keydown', handler), 1000);
        return;
      }

      // Slash to focus search
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        router.push('/dashboard/search');
      }

      // Escape closes modals (handled by individual components)
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [router, pathname]);
}
