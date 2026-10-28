"use client";

import { Button } from "@/components/ui/button";
import { toggleFavourite } from "@/features/favourites/actions";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

/** Heart toggle for a video. Optimistic; reconciles with the server result. */
export function FavouriteButton({
  videoId,
  initial,
  signedIn,
  withLabel,
}: {
  videoId: string;
  initial: boolean;
  signedIn: boolean;
  withLabel?: boolean;
}) {
  const router = useRouter();
  const [faved, setFaved] = useState(initial);
  const [pending, start] = useTransition();

  const onClick = () => {
    if (!signedIn) {
      router.push("/login?callbackUrl=/account/favourites");
      return;
    }
    const next = !faved;
    setFaved(next); // optimistic
    start(async () => {
      const res = await toggleFavourite(videoId);
      if (!res.ok) {
        setFaved(!next);
        toast.error("Could not update favourites", { description: res.error });
      } else {
        setFaved(res.data.favourited);
      }
    });
  };

  return (
    <Button
      variant="outline"
      size={withLabel ? "md" : "icon"}
      aria-pressed={faved}
      aria-label={faved ? "Remove from favourites" : "Add to favourites"}
      disabled={pending}
      onClick={onClick}
      {...(withLabel
        ? { leftIcon: <Heart className={cn(faved && "fill-destructive text-destructive")} /> }
        : {})}
    >
      {withLabel ? (
        faved ? (
          "Saved"
        ) : (
          "Save"
        )
      ) : (
        <Heart className={cn("size-4", faved && "fill-destructive text-destructive")} />
      )}
    </Button>
  );
}
