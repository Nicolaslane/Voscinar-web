import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Konfigurator } from "@/components/konfigurator";
import { Menu } from "@/components/menu";
import { najdiSluzbu, sluzby } from "@/lib/sluzby";
import { firma } from "@/config/firma";

export function generateStaticParams() {
  return sluzby.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/sluzby/[slug]">): Promise<Metadata> {
  const s = najdiSluzbu((await params).slug);
  return { title: s ? `${s.nazov} – konfigurátor | ${firma.nazov}` : firma.nazov, description: s?.pouzitie };
}

export default async function Page({ params }: PageProps<"/sluzby/[slug]">) {
  const { slug } = await params;
  if (!najdiSluzbu(slug)) notFound();
  return (
    <main>
      <Menu svetle />
      <Konfigurator slug={slug} />
    </main>
  );
}
