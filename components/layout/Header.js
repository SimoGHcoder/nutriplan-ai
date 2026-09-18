'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client.js';
import { version } from '../../package.json';

export default function Header({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const tabs = [
    { href: '/dashboard',          label: '👤 Profilo'   },
    { href: '/dashboard/alimenti', label: '🥦 Alimenti'  },
    { href: '/dashboard/piano',    label: '📋 Piano'     },
  ];

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  // Avatar Google (prima lettera o foto profilo)
  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email || 'Utente';
  const initiale = displayName.charAt(0).toUpperCase();

  return (
    <header className="bg-emerald-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">

        {/* Logo + Nome + Versione */}
        <h1 className="text-lg font-bold flex items-center gap-2">
          <span>🥗</span>
          <span>NutriPlan AI</span>
          <span className="text-xs font-mono bg-emerald-700 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-500">
            v{version}
          </span>
        </h1>

        {/* Avatar + Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-8 h-8 rounded-full border-2 border-emerald-400"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-700 border-2 border-emerald-400 flex items-center justify-center text-sm font-bold">
                {initiale}
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title="Esci"
            className="p-2 hover:bg-emerald-700 rounded-lg transition text-sm font-medium"
          >
            🚪 Esci
          </button>
        </div>
      </div>

      {/* Tabs navigazione */}
      <nav className="max-w-4xl mx-auto px-2 flex border-t border-emerald-500/40 text-sm">
        {tabs.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 py-2.5 text-center font-medium border-b-2 transition ${
              isActive(tab.href)
                ? 'border-white bg-emerald-700 text-white'
                : 'border-transparent text-emerald-100 hover:bg-emerald-700/50'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
