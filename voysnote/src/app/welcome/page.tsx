import { Suspense } from "react";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { Toaster } from "@/components/ui/Toast";

export const metadata = { title: "Join the group" };

export default function WelcomePage() {
  return (
    <div className="relative mx-auto min-h-dvh max-w-[460px] overflow-hidden bg-cream sm:border-x sm:border-line/60">
      <Suspense>
        <Onboarding />
      </Suspense>
      <Toaster />
    </div>
  );
}
