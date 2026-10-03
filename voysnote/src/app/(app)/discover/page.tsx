"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { CATEGORIES, type Category } from "@/lib/types";
import { joinedCreators, publishedNotes, totalReactions } from "@/lib/catalog";
import { noteAccess, ownsSeries } from "@/lib/access";
import { noteToPlayable } from "@/lib/audio/playable";
import { useApp, useCatalog, useEntitlements } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { cx, firstName, relativeShort, TIME } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { CreatorRow } from "@/components/creator/CreatorRow";
import { NoteRow } from "@/components/note/NoteRow";
import { SeriesCard } from "@/components/series/SeriesCard";
import { IconClose, IconDiscover } from "@/components/icons";

export default function DiscoverPage() {
  const { catalog, idx } = useCatalog();
  const e = useEntitlements();
  const interests = useApp((s) => s.user?.interests ?? []);
  const follows = useApp((s) => s.follows);
  const now = useNow();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | null>(null);

  const creators = useMemo(() => joinedCreators(catalog, now), [catalog, now]);
  const recent = useMemo(() => [...creators].sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt)).slice(0, 10), [creators]);

  const trending = useMemo(() => {
    const notes = publishedNotes(catalog, now).filter((n) => now - +new Date(n.publishedAt) < 4 * TIME.DAY && noteAccess(n, e, now).state !== "hidden");
    return notes.sort((a, b) => totalReactions(b) - totalReactions(a)).slice(0, 5);
  }, [catalog, now, e]);
  const trendingQueue = useMemo(() => trending.map((n) => noteToPlayable(n, idx.creators.get(n.creatorId)!)), [trending, idx]);

  const recommended = useMemo(
    () => creators.filter((c) => !follows.includes(c.id) && (interests.length ? interests.includes(c.category) : true)).slice(0, 5),
    [creators, follows, interests],
  );

  const query = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!query && !cat) return null;
    return creators.filter(
      (c) => (!cat || c.category === cat) && (!query || [c.name, c.username, c.role, c.bio, c.category].some((f) => f.toLowerCase().includes(query))),
    );
  }, [creators, query, cat]);
  const noteResults = useMemo(() => {
    if (!query) return [];
    return publishedNotes(catalog, now)
      .filter((n) => noteAccess(n, e, now).state !== "hidden" && (n.title.toLowerCase().includes(query) || n.transcript.toLowerCase().includes(query)))
      .slice(0, 6);
  }, [catalog, now, query, e]);

  const featured = catalog.series[0];

  return (
    <div className="pb-40">
      <header className="px-5 pb-4 pt-[max(20px,env(safe-area-inset-top))]">
        <h1 className="display text-[44px]">Discover</h1>
        <div className="relative mt-4">
          <IconDiscover size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone" />
          <input
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
            placeholder="Search voices, topics, notes"
            className="h-12 w-full rounded-full border border-line bg-paper pl-11 pr-11 text-[15px] outline-none placeholder:text-stone-2 focus:border-ink/30"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Clear" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone">
              <IconClose size={18} />
            </button>
          )}
        </div>
      </header>

      <div className="no-scrollbar -mt-1 flex gap-2 overflow-x-auto px-5 pb-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(cat === c ? null : c)}
            className={cx(
              "h-9 shrink-0 rounded-full border px-4 text-[13px] font-medium transition-colors",
              cat === c ? "border-ink bg-ink text-cream" : "border-line text-ink-2 hover:border-ink/30",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {results ? (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-4">
          <SectionTitle>{results.length ? `${results.length} voices` : "No voices yet"}</SectionTitle>
          {!results.length && <p className="py-6 text-[14px] text-stone">Nobody here yet. Someone might join soon.</p>}
          <div className="divide-y divide-line/60">
            {results.map((c) => (
              <CreatorRow key={c.id} creator={c} />
            ))}
          </div>
          {noteResults.length > 0 && (
            <>
              <SectionTitle className="mt-8">Notes</SectionTitle>
              {noteResults.map((n) => (
                <NoteRow key={n.id} note={n} creator={idx.creators.get(n.creatorId)!} access={noteAccess(n, e, now)} />
              ))}
            </>
          )}
        </motion.section>
      ) : (
        <>
          <section className="pt-5">
            <SectionTitle className="px-5">Recently joined</SectionTitle>
            <div className="no-scrollbar flex gap-4 overflow-x-auto px-5 pb-1">
              {recent.map((c, i) => (
                <Link key={c.id} href={`/c/${c.username}`} className="flex w-[68px] shrink-0 flex-col items-center text-center">
                  <span className={cx("rounded-full p-[2.5px]", i === 0 ? "bg-ember" : "bg-transparent ring-1 ring-line")}>
                    <Avatar src={c.avatar} name={c.name} tone={c.tone} size={60} className="rounded-full ring-2 ring-cream" />
                  </span>
                  <span className="mt-1.5 w-full truncate text-[12px] font-medium">{firstName(c.name)}</span>
                  <span className="text-[11px] text-stone">{relativeShort(c.joinedAt, now)}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="px-5 pt-9">
            <SectionTitle>Trending voices</SectionTitle>
            <div>
              {trending.map((n, i) => (
                <NoteRow key={n.id} rank={i + 1} note={n} creator={idx.creators.get(n.creatorId)!} access={noteAccess(n, e, now)} queue={trendingQueue} />
              ))}
            </div>
          </section>

          {featured && (
            <section className="px-5 pt-9">
              <SectionTitle>Featured series</SectionTitle>
              <SeriesCard series={featured} creator={idx.creators.get(featured.creatorId)!} owned={ownsSeries(featured, e) && featured.price > 0} />
              <div className="no-scrollbar -mx-5 mt-3 flex gap-3 overflow-x-auto px-5">
                {catalog.series.slice(1).map((s) => (
                  <SeriesCard
                    key={s.id}
                    size="sm"
                    series={s}
                    creator={idx.creators.get(s.creatorId)!}
                    sponsor={s.sponsorId ? idx.sponsors.get(s.sponsorId) : null}
                  />
                ))}
              </div>
            </section>
          )}

          {recommended.length > 0 && (
            <section className="px-5 pt-9">
              <SectionTitle>Recommended for you</SectionTitle>
              <div className="divide-y divide-line/60">
                {recommended.map((c) => (
                  <CreatorRow key={c.id} creator={c} meta={`${c.category} · ${c.role}`} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cx("mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-stone", className)}>{children}</h2>;
}
