import Link from "next/link";
import { Menu } from "@/components/menu";

export function Podstranka({ nadpis, popis, children }: { nadpis: string; popis?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6">
      <Menu svetle />
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">← Späť</Link>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">{nadpis}</h1>
      {popis && <p className="mt-2 text-neutral-600">{popis}</p>}
      <div className="mt-10">{children}</div>
    </main>
  );
}
