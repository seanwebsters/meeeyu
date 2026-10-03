import type { Metadata } from "next";
import { SeriesScreen } from "@/components/series/SeriesScreen";
import { SEED_SERIES } from "@/lib/demo/seed";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const s = SEED_SERIES.find((x) => x.id === id);
  return s ? { title: s.title, description: s.description } : { title: "Series" };
}

export default async function SeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SeriesScreen id={id} />;
}
