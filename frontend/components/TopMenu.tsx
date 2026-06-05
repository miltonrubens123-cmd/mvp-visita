import Link from "next/link";
import Image from "next/image";

export default function TopMenu() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="https://www.mbusinessvision.com.br"
          target="_blank"
          className="flex items-center gap-3"
        >

          <Image
            src="/Logo.png"
            alt="Business Vision"
            width={40}
            height={40}
          />

          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-900">
              Business Vision
            </p>
            <p className="text-xs text-slate-500">
              Hub Executivo
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-slate-700">
          <Link href="/monitoramento" className="hover:text-blue-600">
            Monitoramento
          </Link>

          <Link href="/planejado-realizado" className="hover:text-blue-600">
            Dashboard
          </Link>

          <Link href="/ranking" className="hover:text-blue-600">
            Ranking
          </Link>

          <Link href="/analitico" className="hover:text-blue-600">
            Analítico
          </Link>

          <Link href="/programacao" className="hover:text-blue-600">
            Programação
          </Link>
        </nav>
      </div>
    </header>
  );
}