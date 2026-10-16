"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/formatters";
import { File as FileIcon, UploadCloud, X } from "lucide-react";
import { useCallback, useRef, useState, type ComponentProps, type DragEvent } from "react";

export interface UploadableFile {
  id: string;
  file: File;
  /** 0–100; undefined means not started. */
  progress?: number;
  error?: string;
}

export interface FileDropzoneProps extends Omit<ComponentProps<"div">, "onDrop"> {
  accept?: string;
  multiple?: boolean;
  maxSizeLabel?: string;
  files?: UploadableFile[];
  onFilesSelected?: (files: File[]) => void;
  onRemove?: (id: string) => void;
  disabled?: boolean;
}

/**
 * Presentational drag-and-drop upload surface with per-file progress bars.
 * Wire `onFilesSelected` to a real uploader (e.g. the VideoProvider) later;
 * this component owns no upload logic.
 */
export function FileDropzone({
  accept,
  multiple = false,
  maxSizeLabel,
  files = [],
  onFilesSelected,
  onRemove,
  disabled,
  className,
  ...props
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      onFilesSelected?.(Array.from(list));
    },
    [onFilesSelected],
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input px-6 py-10 text-center transition-colors outline-none",
          "hover:border-primary/60 hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
          dragging && "border-primary bg-accent/60",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <UploadCloud className="size-5" />
        </div>
        <p className="text-sm font-medium">
          Drag &amp; drop {multiple ? "files" : "a file"} here, or{" "}
          <span className="text-primary">browse</span>
        </p>
        {maxSizeLabel && <p className="text-xs text-muted-foreground">{maxSizeLabel}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm"
            >
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{f.file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatFileSize(f.file.size)}
                  </span>
                </div>
                {typeof f.progress === "number" && !f.error && (
                  <Progress value={f.progress} className="mt-1.5 h-1" />
                )}
                {f.error && <p className="mt-1 text-xs text-destructive">{f.error}</p>}
              </div>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(f.id)}
                  aria-label={`Remove ${f.file.name}`}
                  className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <X className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
