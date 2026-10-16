"use client";

import { FileDropzone, type UploadableFile } from "@/components/ui/file-dropzone";
import { useCallback, useRef, useState } from "react";

/**
 * Demonstrates the large-file upload UI with a simulated progress bar.
 * Replace the fake interval with a real resumable upload to the chosen
 * VideoProvider (`createUpload`) later.
 */
export function UploadDemo() {
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const simulate = useCallback((id: string) => {
    timers.current[id] = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          const next = Math.min(100, (f.progress ?? 0) + Math.random() * 18);
          if (next >= 100) {
            clearInterval(timers.current[id]);
            delete timers.current[id];
          }
          return { ...f, progress: next };
        }),
      );
    }, 400);
  }, []);

  const onFilesSelected = useCallback(
    (selected: File[]) => {
      const mapped = selected.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}`,
        file,
        progress: 0,
      }));
      setFiles((prev) => [...prev, ...mapped]);
      mapped.forEach((m) => simulate(m.id));
    },
    [simulate],
  );

  const onRemove = useCallback((id: string) => {
    clearInterval(timers.current[id]);
    delete timers.current[id];
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <FileDropzone
      multiple
      accept="video/*"
      maxSizeLabel="MP4, MOV or WebM — up to 10 GB per file"
      files={files}
      onFilesSelected={onFilesSelected}
      onRemove={onRemove}
    />
  );
}
