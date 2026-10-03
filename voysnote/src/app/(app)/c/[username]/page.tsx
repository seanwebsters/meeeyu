import type { Metadata } from "next";
import { CreatorScreen } from "@/components/creator/CreatorScreen";
import { SEED_CREATORS } from "@/lib/demo/seed";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const c = SEED_CREATORS.find((x) => x.username === username);
  return c ? { title: c.name, description: `${c.name} is in the group. ${c.bio}` } : { title: "Voice" };
}

export default async function CreatorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <CreatorScreen username={username} />;
}
