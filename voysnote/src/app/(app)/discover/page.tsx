"use client";

import { Suspense } from "react";
import { DiscoverScreen } from "@/components/discover/DiscoverScreen";

export default function DiscoverPage() {
  return (
    <Suspense>
      <DiscoverScreen />
    </Suspense>
  );
}
