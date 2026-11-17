"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ImageIcon, Link2, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  /** Upload target — selects the storage folder + required permission. */
  folder: "banners" | "donate";
  label?: string;
  /** Guidance shown under the dropzone, e.g. recommended dimensions. */
  hint?: string;
  /** Show the "paste a URL" fallback (banners only; donate is upload-only). */
  allowUrl?: boolean;
  /** Tailwind classes for the preview box (controls aspect ratio). */
  previewClassName?: string;
  error?: string;
}

/**
 * Reusable image picker: drag-and-drop (or browse) uploads the file to
 * `/api/admin/image` under the given folder and stores the returned URL.
 */
export function ImageUploadField({
  value,
  onChange,
  folder,
  label = "Image",
  hint,
  allowUrl = true,
  previewClassName = "h-40",
  error,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [showUrl, setShowUrl] = useState(false);

  const upload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setProgress(0);
    const body = new FormData();
    body.append("file", file);
    body.append("folder", folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/image");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      let res: { url?: string; error?: string } = {};
      try {
        res = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300 && res.url) {
        onChange(res.url);
        toast.success("Image uploaded");
      } else {
        toast.error("Upload failed", { description: res.error ?? `Error ${xhr.status}` });
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      toast.error("Upload failed", { description: "Network error." });
    };
    xhr.send(body);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const uploading = progress !== null;

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>

      {value ? (
        <div className="relative overflow-hidden rounded-lg border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- preview only */}
          <img src={value} alt="Preview" className={cn("w-full object-cover", previewClassName)} />
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="size-8"
              aria-label="Replace image"
              onClick={() => inputRef.current?.click()}
            >
              <UploadCloud className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="size-8 text-destructive"
              aria-label="Remove image"
              onClick={() => onChange("")}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input px-6 py-8 text-center transition-colors outline-none",
            "hover:border-primary/60 hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
            dragging && "border-primary bg-accent/60",
            uploading && "pointer-events-none opacity-70",
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ImageIcon className="size-5" />
          </div>
          <p className="text-sm font-medium">
            Drag &amp; drop an image, or <span className="text-primary">browse</span>
          </p>
          <p className="text-xs text-muted-foreground">JPG, PNG, WebP or AVIF — up to 4 MB</p>
        </div>
      )}

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {uploading && <Progress value={progress ?? 0} className="h-1.5" />}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />

      {allowUrl && (
        <div>
          <button
            type="button"
            onClick={() => setShowUrl((s) => !s)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link2 className="size-3" />
            {showUrl ? "Hide URL field" : "…or paste an image URL"}
          </button>
          {showUrl && (
            <Input
              className="mt-2"
              placeholder="https://…"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
