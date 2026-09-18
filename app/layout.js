import './globals.css';

export const metadata = {
  title: 'NutriPlan AI',
  description: 'Gestione nutrizionale personale con piani alimentari personalizzati.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className="bg-gray-50 text-gray-900 min-h-screen flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
