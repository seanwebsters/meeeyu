"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { episodeAccess, ownsSeries, unlockedEpisodes } from "@/lib/access";
import { episodeToPlayable } from "@/lib/audio/playable";
import { player, usePlayer } from "@/lib/audio/engine";
import { grant, startCheckout } from "@/lib/checkout";
import { actions, useApp, useCatalog, useEntitlements } from "@/lib/store/app";
import { useNow } from "@/lib/store/clock";
import { cx, formatDuration, formatPrice } from "@/lib/utils";
import type { SeriesEpisode } from "@/lib/types";
import { Avatar, Portrait } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { IconBack, IconCheck, IconLock, IconPause, IconPlay, Verified } from "../icons";
import { toast } from "../ui/Toast";

export function SeriesScreen({ id }: { id: string }) {
  const router = useRouter();
  const { catalog, idx } = useCatalog();
  const e = useEntitlements();
  const now = useNow();
  const completed = useApp((s) => s.completedEpisodes);
  const [busy, setBusy] = useState(false);

  const series = idx.series.get(id);
  const creator = series ? idx.creators.get(series.creatorId) : undefined;
  const sponsor = series?.sponsorId ? idx.sponsors.get(series.sponsorId) : null;
  const episodes = useMemo(() => catalog.episodes.filter((x) => x.seriesId === id).sort((a, b) => a.day - b.day), [catalog, id]);

  useEffect(() => {
    const off = player.on("ended", (p) => {
      if (episodes.some((x) => x.id === p.id)) actions.completeEpisode(p.id);
    });
    return () => {
      off();
    };
  }, [episodes]);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get("checkout") === "success") {
      grant({ kind: "series", seriesId: id });
      toast("Unlocked. Day 1 is ready.", "🎧");
      history.replaceState(null, "", location.pathname);
    }
  }, [id]);

  if (!series || !creator) return <p className="p-8 text-stone">This series isn&apos;t available.</p>;

  const owned = ownsSeries(series, e);
  const started = !!e.seriesStartedAt[series.id];
  const unlocked = unlockedEpisodes(series, e, now);
  const done = episodes.filter((x) => completed.includes(x.id)).length;
  const nextUp = episodes.find((x) => !completed.includes(x.id) && episodeAccess(x, series, e, now) === "open");

  const buy = async () => {
    if (series.price === 0) {
      actions.startSeries(series.id);
      toast("Started. One note unlocks every day.", "🌅");
      return;
    }
    setBusy(true);
    const r = await startCheckout({ kind: "series", seriesId: series.id });
    setBusy(false);
    if (r === "granted") toast("Unlocked. Day 1 is ready.", "🎧");
    if (r === "error") toast("Couldn't start checkout. Try again.");
  };

  const playEp = (ep: SeriesEpisode) => player.toggle(episodeToPlayable(ep, creator));

  return (
    <div className="pb-48">
      <div className="relative">
        <Portrait src={series.coverImage} name={creator.name} tone={creator.tone} className="aspect-[4/5] w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-transparent to-cream" />
        <button
          onClick={() => (history.length > 1 ? router.back() : router.push("/discover"))}
          aria-label="Back"
          className="absolute left-4 top-[max(14px,env(safe-area-inset-top))] rounded-full bg-cream/80 p-2.5 backdrop-blur"
        >
          <IconBack size={20} />
        </button>
      </div>

      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative -mt-36 px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2">
          Creator series · {series.episodeCount} notes{series.unlockCadence === "daily" ? " · one a day" : ""}
        </p>
        <h1 className="display mt-2 text-[36px]">{series.title}</h1>
        <Link href={`/c/${creator.username}`} className="mt-4 flex items-center gap-2.5">
          <Avatar src={creator.avatar} name={creator.name} tone={creator.tone} size={32} />
          <span className="text-[14px] font-semibold">{creator.name}</span>
          {creator.verified && <Verified size={13} />}
          <span className="text-[13px] text-stone">{creator.role}</span>
        </Link>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{series.description}</p>
        {sponsor && (
          <a
            href={sponsor.url}
            target="_blank"
            rel="noreferrer sponsored"
            className="mt-5 flex items-center justify-between rounded-[18px] border border-line px-4 py-3"
          >
            <span className="text-[12px] text-stone">Presented by</span>
            <span className="text-right">
              <span className="block text-[14px] font-semibold">{sponsor.name}</span>
              <span className="block text-[11px] text-stone">{sponsor.tagline}</span>
            </span>
          </a>
        )}
      </motion.section>

      {owned && started && (
        <section className="px-5 pt-8">
          <div className="rounded-[24px] bg-paper p-5 ring-1 ring-line">
            <div className="flex items-baseline justify-between">
              <p className="display text-[30px]">
                Day {unlocked} <span className="text-stone-2">of {series.episodeCount}</span>
              </p>
              <p className="text-[13px] text-stone">{done} heard</p>
            </div>
            <div className="mt-4 grid grid-cols-10 gap-1.5">
              {episodes.map((ep) => {
                const isDone = completed.includes(ep.id);
                const open = ep.day <= unlocked;
                return (
                  <span
                    key={ep.id}
                    title={`Day ${ep.day}`}
                    className={cx("aspect-square rounded-full", isDone ? "bg-accent" : open ? "bg-accent/35" : "bg-mist")}
                  />
                );
              })}
            </div>
            <p className="mt-3 text-[12px] text-stone">{unlocked < series.episodeCount ? "A new note unlocks tomorrow morning." : "Every note is unlocked."}</p>
          </div>
        </section>
      )}

      <section className="px-5 pt-8">
        <h2 className="mb-1 text-[13px] font-medium lowercase text-stone">the notes</h2>
        <ul className="divide-y divide-line/60">
          {episodes.map((ep) => (
            <EpisodeRow
              key={ep.id}
              ep={ep}
              state={episodeAccess(ep, series, e, now)}
              done={completed.includes(ep.id)}
              daysAway={ep.day - unlocked}
              onPlay={() => playEp(ep)}
              onLocked={buy}
            />
          ))}
        </ul>
      </section>

      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 mx-auto max-w-[460px] bg-gradient-to-t from-cream via-cream to-transparent px-5 pb-4 pt-8">
        {owned && (started || series.price > 0) ? (
          nextUp ? (
            <Button size="lg" className="w-full" onClick={() => playEp(nextUp)}>
              <IconPlay size={16} /> Play Day {nextUp.day}
            </Button>
          ) : (
            <p className="text-center text-[14px] font-medium text-ink-2">You&apos;re up to date. See you tomorrow.</p>
          )
        ) : (
          <>
            <Button size="lg" className="w-full" disabled={busy} onClick={buy}>
              {series.price === 0
                ? "Start the series"
                : `Unlock all ${series.episodeCount} · ${formatPrice(series.price)}${series.billing === "subscription" ? "/month" : ""}`}
            </Button>
            <p className="mt-2 text-center text-[12px] text-stone">
              {series.price === 0 ? `Free, presented by ${sponsor?.name ?? "a partner"}.` : "Day 1 is free to hear. One-off purchase, yours to keep."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function EpisodeRow({
  ep,
  state,
  done,
  daysAway,
  onPlay,
  onLocked,
}: {
  ep: SeriesEpisode;
  state: "open" | "upcoming" | "purchase";
  done: boolean;
  daysAway: number;
  onPlay: () => void;
  onLocked: () => void;
}) {
  const status = usePlayer((s) => (s.current?.id === ep.id ? s.status : "idle"));
  const playing = status === "playing";
  return (
    <li className="flex items-center gap-4 py-3.5">
      <span className={cx("w-8 text-[18px] font-semibold", state === "open" ? "text-ink" : "text-stone-2")}>{ep.day}</span>
      <div className="min-w-0 flex-1">
        <p className={cx("truncate font-medium text-[18px] leading-tight", state !== "open" && "text-stone")}>{ep.title}</p>
        <p className="mt-0.5 text-[12px] text-stone">
          {state === "upcoming" ? (daysAway === 1 ? "Unlocks tomorrow" : `Unlocks in ${daysAway} days`) : formatDuration(ep.duration)}
          {ep.day === 1 && state === "open" && " · Free preview"}
        </p>
      </div>
      {state === "open" ? (
        <button
          onClick={onPlay}
          aria-label={playing ? "Pause" : "Play"}
          className={cx(
            "flex h-10 w-10 items-center justify-center rounded-full",
            done && !playing ? "border border-accent/30 text-accent" : "bg-accent text-cream",
          )}
        >
          {playing ? <IconPause size={15} /> : done ? <IconCheck size={16} /> : <IconPlay size={15} className="translate-x-[1px]" />}
        </button>
      ) : (
        <button
          onClick={state === "purchase" ? onLocked : undefined}
          aria-label="Locked"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-mist text-stone"
        >
          <IconLock size={15} />
        </button>
      )}
    </li>
  );
}
