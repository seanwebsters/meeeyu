"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function FollowButton({
  targetId,
  viewerId,
  initiallyFollowing,
}: {
  targetId: string;
  viewerId: string | null;
  initiallyFollowing: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [following, setFollowing] = useState(initiallyFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!viewerId) {
      router.push("/login");
      return;
    }
    setLoading(true);
    if (following) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", viewerId)
        .eq("following_id", targetId);
      setFollowing(false);
    } else {
      await supabase
        .from("follows")
        .insert({ follower_id: viewerId, following_id: targetId });
      setFollowing(true);
    }
    setLoading(false);
  }

  return (
    <Button
      variant={following ? "secondary" : "pink"}
      onClick={toggle}
      disabled={loading}
      className="px-6"
    >
      {following ? "following" : "follow"}
    </Button>
  );
}
