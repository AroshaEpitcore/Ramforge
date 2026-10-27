"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveVideo } from "@/features/admin/actions";
import * as UpChunk from "@mux/upchunk";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Phase = "idle" | "creating" | "uploading" | "processing" | "error";

/**
 * Uploads a source video straight to Mux with a real progress bar:
 *   1. create a DRAFT (paid) Video to get an id,
 *   2. ask the server for a Mux direct-upload URL (passing the video id),
 *   3. UpChunk streams the file to Mux (chunked/resumable),
 *   4. the Mux webhook later attaches the playback id and marks it READY.
 */
export function MuxUploadPanel({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);

  const busy = phase === "creating" || phase === "uploading";

  const start = async () => {
    if (!title.trim() || !categoryId || !file) {
      toast.error("Add a title, category and file first.");
      return;
    }
    setPhase("creating");

    const draft = await saveVideo({
      title,
      slug: "",
      description: title,
      categoryId,
      courseId: "",
      position: 0,
      source: "MUX",
      youtubeId: "",
      fullAssetId: "",
      accessMode: "PAID",
      priceMajor: 0,
      status: "DRAFT",
      publishAt: "",
      notes: "",
    });
    if (!draft.ok) {
      setPhase("error");
      toast.error("Could not create the video", { description: draft.error });
      return;
    }

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        sizeBytes: file.size,
        contentType: file.type || "video/mp4",
        videoId: draft.data.id,
      }),
    });
    if (!res.ok) {
      setPhase("error");
      const err = await res.json().catch(() => ({}));
      toast.error("Could not start the upload", { description: err.error });
      return;
    }
    const { uploadUrl } = (await res.json()) as { uploadUrl: string; assetId: string };

    setPhase("uploading");
    setProgress(0);
    const upload = UpChunk.createUpload({ endpoint: uploadUrl, file });
    upload.on("progress", (e) => setProgress(Math.round((e.detail as number) ?? 0)));
    upload.on("error", (e) => {
      setPhase("error");
      toast.error("Upload failed", {
        description: String((e.detail as { message?: string })?.message ?? ""),
      });
    });
    upload.on("success", () => {
      setPhase("processing");
      toast.success("Uploaded — Mux is now processing the video.", {
        description: "It will appear as READY in the Videos list shortly.",
      });
      setTitle("");
      setCategoryId("");
      setFile(null);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="u-title">Title</Label>
            <Input
              id="u-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={busy}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="u-file">Video file</Label>
          <Input
            id="u-file"
            type="file"
            accept="video/*"
            disabled={busy}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {(phase === "uploading" || phase === "processing") && (
          <div className="space-y-1">
            <Progress value={phase === "processing" ? 100 : progress} />
            <p className="text-xs text-muted-foreground">
              {phase === "processing" ? "Processing on Mux…" : `Uploading… ${progress}%`}
            </p>
          </div>
        )}

        <Button onClick={start} loading={busy} disabled={busy}>
          {phase === "creating" ? "Preparing…" : "Upload to Mux"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Creates a paid DRAFT lesson. After processing, edit it in Videos to set the price, assign
          a course and publish.
        </p>
      </CardContent>
    </Card>
  );
}
