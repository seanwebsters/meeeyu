"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { CATEGORIES, type Category } from "@/lib/types";
import { joinedCreators, publishedNotes, totalReactions } from "@/lib/catalog";
import { noteAccess, ownsSeries } from "@/lib/access";
import { noteToPlayable } from "@/lib/audio/playable";
import { useApp, useCatalog, useEntitlements } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { firstName, TIME } from "@/lib/utils";
import { Avatar, Portrait } from "../ui/Avatar";
import { CreatorRow } from "../creator/CreatorRow";
import { tiltFor } from "../group/SystemItems";
import { NoteRow } from "../note/NoteRow";
import { SeriesCard } from "../series/SeriesCard";
import { CATEGORY_ICONS, IconArrowRight, IconClose, IconDiscover } from "../icons";

export function DiscoverScreen() {
  const params = useSearchParams();
  const { catalog, idx } = useCatalog();
  const e = useEntitlements();
  const interests = useApp((s) => s.user?.interests ?? []);
  const follows = useApp((s) => s.follows);
  const now = useNow();
  const [searching, setSearching] = useState(() => params.get("search") === "1");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | null>(null);
  const [all, setAll] = useState<"recent" | "trending" | null>(null);

  const creators = useMemo(() => joinedCreators(catalog, now), [catalog, now]);
  const recent = useMemo(() => [...creators].sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt)), [creators]);

  const trending = useMemo(() => {
    const notes = publishedNotes(catalog, now).filter((n) => now - +new Date(n.publishedAt) < 4 * TIME.DAY && noteAccess(n, e, now).state !== "hidden");
    return notes.sort((a, b) => totalReactions(b) - totalReactions(a)).slice(0, 8);
  }, [catalog, now, e]);
  const trendingQueue = useMemo(() => trending.map((n) => noteToPlayable(n, idx.creators.get(n.creatorId)!)), [trending, idx]);
  const trendingVoices = useMemo(() => [...new Set(trending.map((n) => n.creatorId))].map((id) => idx.creators.get(id)!).slice(0, 6), [trending, idx]);

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
    if (!query && !cat) return [];
    return publishedNotes(catalog, now)
      .filter((n) => noteAccess(n, e, now).state !== "hidden")
      .filter((n) => (cat ? idx.creators.get(n.creatorId)?.category === cat : true))
      .filter((n) => !query || n.title.toLowerCase().includes(query) || n.transcript.toLowerCase().includes(query))
      .slice(0, 8);
  }, [catalog, now, query, cat, e, idx]);

  const [featured, ...moreSeries] = catalog.series;

  return (
    <div className="pb-40">
      <header className="sticky top-0 z-20 bg-cream/[0.97] px-5 pb-2 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex h-10 items-center">
          <span className="wordmark flex-1 text-[22px]">VoysNote</span>
          <button
            onClick={() => {
              setSearching((s) => !s);
              setQ("");
            }}
            aria-label={searching ? "Close search" : "Search"}
            className="-mr-2 rounded-full p-2 hover:bg-mist"
          >
            {searching ? <IconClose size={22} /> : <IconDiscover size={22} />}
          </button>
        </div>
        <AnimatePresence initial={false}>
          {searching && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <input
                autoFocus
                value={q}
                onChange={(ev) => setQ(ev.target.value)}
                placeholder="Search voices, topics, notes"
                className="mt-2 h-11 w-full rounded-full border border-line bg-paper px-5 text-[15px] outline-none placeholder:text-stone-2 focus:border-accent/40"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {!results && (
        <div className="px-5 pt-3">
          <h1 className="display text-[40px]">discover</h1>
          <p className="mt-1 text-[14px] text-stone">new faces. big thoughts. 30 secs each.</p>
        </div>
      )}

      {results ? (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-3">
          {cat && (
            <button
              onClick={() => setCat(null)}
              className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3.5 py-1.5 text-[13px] font-medium text-accent"
            >
              {cat} <IconClose size={14} />
            </button>
          )}
          <Section title={results.length ? `${results.length} voices` : "No voices yet"}>
            {!results.length && <p className="pb-4 text-[14px] text-stone">Nobody here yet. Someone might join soon.</p>}
            <div className="divide-y divide-line/60">
              {results.map((c) => (
                <CreatorRow key={c.id} creator={c} />
              ))}
            </div>
          </Section>
          {noteResults.length > 0 && (
            <Section title="VoysNotes">
              {noteResults.map((n) => (
                <NoteRow key={n.id} note={n} creator={idx.creators.get(n.creatorId)!} access={noteAccess(n, e, now)} />
              ))}
            </Section>
          )}
        </motion.section>
      ) : (
        <>
          <Section
            title="Recently joined"
            action={all === "recent" ? "less" : "see all"}
            onAction={() => setAll(all === "recent" ? null : "recent")}
            className="px-5 pt-6"
          >
            {all === "recent" ? (
              <div className="divide-y divide-line/60">
                {recent.map((c) => (
                  <CreatorRow key={c.id} creator={c} meta={c.role} />
                ))}
              </div>
            ) : (
              <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 pb-2 pt-2">
                {recent.slice(0, 10).map((c, i) => (
                  <Link key={c.id} href={`/c/${c.username}`} className="flex w-[72px] shrink-0 flex-col items-center text-center">
                    <span className="relative">
                      <Avatar src={c.avatar} name={c.name} tone={c.tone} size={64} square sticker tilt={tiltFor(c.id) || 3} />
                      {i === 0 && (
                        <span className="absolute -right-2 -top-1.5 rotate-12 rounded-full bg-pop px-1.5 py-0.5 text-[10px] font-bold text-black">new</span>
                      )}
                    </span>
                    <span className="mt-1.5 w-full truncate text-[12px] font-medium">{firstName(c.name)}</span>
                    <span className="w-full truncate text-[11px] text-stone">{c.role.split(/[,&]/)[0].trim()}</span>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Trending voices"
            action={all === "trending" ? "less" : "see all"}
            onAction={() => setAll(all === "trending" ? null : "trending")}
            className="px-5 pt-8"
          >
            {all === "trending" ? (
              trending.map((n, i) => (
                <NoteRow key={n.id} rank={i + 1} note={n} creator={idx.creators.get(n.creatorId)!} access={noteAccess(n, e, now)} queue={trendingQueue} />
              ))
            ) : (
              <div className="no-scrollbar -mx-5 flex gap-5 overflow-x-auto px-5 pb-1">
                {trendingVoices.map((c, i) => (
                  <Link key={c.id} href={`/c/${c.username}`} className="flex shrink-0 items-end gap-1.5">
                    <span className="pb-1 text-[15px] font-semibold text-ink">{i + 1}</span>
                    <span className="flex w-[64px] flex-col items-center text-center">
                      <Avatar src={c.avatar} name={c.name} tone={c.tone} size={52} sticker tilt={tiltFor(c.id)} />
                      <span className="mt-1.5 w-full truncate text-[12px] font-medium">{firstName(c.name)}</span>
                      <span className="w-full truncate text-[11px] text-stone">{c.category}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          <Section title="Categories" className="px-5 pt-8">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICONS[c];
                return (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className="flex h-10 items-center gap-2 rounded-full bg-mist px-4 text-[14px] font-medium lowercase text-ink transition-colors hover:bg-line"
                  >
                    <Icon size={16} />
                    {c}
                  </button>
                );
              })}
            </div>
          </Section>

          {featured && (
            <Section title="Featured series" className="px-5 pt-8">
              <FeaturedSeries id={featured.id} />
              {moreSeries.length > 0 && (
                <div className="no-scrollbar -mx-5 mt-3 flex gap-3 overflow-x-auto px-5">
                  {moreSeries.map((s) => (
                    <SeriesCard
                      key={s.id}
                      size="sm"
                      series={s}
                      creator={idx.creators.get(s.creatorId)!}
                      sponsor={s.sponsorId ? idx.sponsors.get(s.sponsorId) : null}
                      owned={ownsSeries(s, e) && s.price > 0}
                    />
                  ))}
                </div>
              )}
            </Section>
          )}

          {recommended.length > 0 && (
            <Section title="Recommended for you" className="px-5 pt-8">
              <div className="divide-y divide-line/60">
                {recommended.map((c) => (
                  <CreatorRow key={c.id} creator={c} meta={`${c.category} · ${c.role}`} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

/** Wide card: words on the left, portrait on the right. */
export function FeaturedSeries({ id }: { id: string }) {
  const { idx } = useCatalog();
  const e = useEntitlements();
  const s = idx.series.get(id);
  const c = s ? idx.creators.get(s.creatorId) : undefined;
  if (!s || !c) return null;
  const owned = ownsSeries(s, e) && s.price > 0;
  return (
    <Link href={`/series/${s.id}`} className="card relative flex min-h-[150px] overflow-hidden">
      <div className="relative z-10 flex flex-1 flex-col p-4 pr-2">
        <h3 className="text-[20px] font-semibold leading-tight tracking-[-0.02em]">{s.title}</h3>
        <p className="mt-1.5 line-clamp-3 text-[12px] leading-snug text-stone">{s.description}</p>
        <div className="mt-auto flex items-center gap-2 pt-3">
          <span className="rounded-full bg-accent px-3 py-1 text-[12px] font-semibold text-black">
            {owned ? "Continue" : s.price === 0 ? "Free" : `£${(s.price / 100).toFixed(2)}`}
          </span>
          <span className="flex items-center gap-1 text-[12px] font-medium text-accent">
            {s.episodeCount} notes <IconArrowRight size={14} />
          </span>
        </div>
      </div>
      <div className="relative w-[38%] shrink-0">
        <Portrait src={c.portrait ?? c.avatar} name={c.name} tone={c.tone} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-paper to-transparent" />
      </div>
    </Link>
  );
}

function Section({
  title,
  action,
  onAction,
  children,
  className,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[13px] font-medium lowercase text-stone">{title}</h2>
        {action && (
          <button onClick={onAction} className="text-[12px] font-medium text-stone hover:text-accent">
            {action}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
