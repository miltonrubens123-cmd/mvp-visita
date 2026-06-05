import "./globals.css";
import TopMenu from "@/components/TopMenu";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white text-slate-900">
        <TopMenu />

        <main className="mx-auto max-w-7xl p-6">
          {children}
        </main>
      </body>
    </html>
  );
}