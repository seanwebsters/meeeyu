"use client";

import Link from "next/link";
import type { Creator, Series, Sponsor } from "@/lib/types";
import { cx, formatPrice } from "@/lib/utils";
import { Portrait } from "../ui/Avatar";

/** Editorial cover: full-bleed portrait, serif title, quiet price. */
export function SeriesCard({
  series,
  creator,
  sponsor,
  owned,
  size = "lg",
}: {
  series: Series;
  creator: Creator;
  sponsor?: Sponsor | null;
  owned?: boolean;
  size?: "lg" | "sm";
}) {
  return (
    <Link
      href={`/series/${series.id}`}
      className={cx(
        "group relative block overflow-hidden rounded-[26px] bg-ink text-cream",
        size === "lg" ? "aspect-[4/5]" : "aspect-[3/4] w-[190px] shrink-0",
      )}
    >
      <Portrait
        src={series.coverImage}
        name={creator.name}
        tone={creator.tone}
        className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/70">
          {series.billing === "subscription" ? "Creator series · monthly" : "Creator series"}
        </p>
        <h3 className={cx("display mt-1.5", size === "lg" ? "text-[30px]" : "text-[20px]")}>{series.title}</h3>
        <p className="mt-1.5 text-[13px] text-cream/80">
          {creator.name} · {series.episodeCount} notes
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="rounded-full bg-cream px-3 py-1 text-[12px] font-semibold text-ink">
            {owned ? "Continue" : series.price === 0 ? "Free" : `${formatPrice(series.price)}${series.billing === "subscription" ? "/mo" : ""}`}
          </span>
          {sponsor && <span className="text-[11px] text-cream/70">Presented by {sponsor.name}</span>}
        </div>
      </div>
    </Link>
  );
}
