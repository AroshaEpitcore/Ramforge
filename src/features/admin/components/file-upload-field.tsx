"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { File as FileIcon, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";

interface FileUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  error?: string;
}

/**
 * Generic file picker for downloadable assets: drag-and-drop (or browse) uploads
 * to `/api/admin/asset` and stores the returned `/api/assets/…` URL. Any file
 * type is accepted (up to the server cap); shows the file name with actions.
 */
export function FileUploadField({
  value,
  onChange,
  label = "File",
  hint,
  error,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const upload = (file: File) => {
    setProgress(0);
    const body = new FormData();
    body.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/asset");
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
        toast.success("File uploaded");
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
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
          <FileIcon className="size-5 shrink-0 text-primary" />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
          >
            {value.split("/").pop() || "File"}
          </a>
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="size-8"
              aria-label="Replace file"
              onClick={() => inputRef.current?.click()}
            >
              <UploadCloud className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="size-8 text-destructive"
              aria-label="Remove file"
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
            <FileIcon className="size-5" />
          </div>
          <p className="text-sm font-medium">
            Drag &amp; drop a file, or <span className="text-primary">browse</span>
          </p>
          <p className="text-xs text-muted-foreground">Up to 4 MB — use a link for larger files</p>
        </div>
      )}

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {uploading && <Progress value={progress ?? 0} className="h-1.5" />}

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
