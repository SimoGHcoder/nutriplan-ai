import { redirect } from 'next/navigation';

// La homepage reindirizza sempre alla dashboard (o al login se non autenticato)
// Il middleware si occupa della protezione
export default function Home() {
  redirect('/dashboard');
}
