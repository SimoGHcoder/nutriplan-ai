import { createClient } from '../../lib/supabase/server.js';
import Header from '../../components/layout/Header.js';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Protezione server-side (doppia sicurezza rispetto al middleware)
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="max-w-4xl w-full mx-auto p-4 flex-1">
        {children}
      </main>
    </div>
  );
}
