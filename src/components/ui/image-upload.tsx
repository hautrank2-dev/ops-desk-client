"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageGroup, Image } from "@/components/ui/image";

type ImageUploadProps = {
  value?: File[];
  onChange?: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
}

export function ImageUpload({ value = [], onChange, maxFiles = 10, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);

  const [dragging, setDragging] = useState(false);

  const handleFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const newFiles = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    const combined = [...value, ...newFiles].slice(0, maxFiles);
    const newPreviews = newFiles.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, maxFiles));
    onChange?.(combined);
  };

  const remove = (index: number) => {
    URL.revokeObjectURL(previews[index]?.url);
    const next = previews.filter((_, i) => i !== index);
    setPreviews(next);
    onChange?.(next.map((p) => p.file));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // Ctrl/Cmd+V anywhere while mounted (e.g. inside the upload dialog) adds clipboard images.
  const handleFilesRef = useRef(handleFiles);
  handleFilesRef.current = handleFiles;
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (files.length === 0) return;
      e.preventDefault();
      handleFilesRef.current(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        className={cn(
          "group/drop flex flex-col items-center justify-center gap-3 rounded-2xl border-[1.5px] border-dashed border-black/15 bg-muted/40 px-6 py-8 cursor-pointer transition-colors duration-200 hover:border-primary/50 hover:bg-primary/[0.03] dark:border-white/15",
          dragging && "border-primary bg-primary/[0.06] dark:border-primary"
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-soft transition-transform duration-200 group-hover/drop:scale-105">
          <ImagePlus className="h-5 w-5 text-primary" />
        </span>
        <div className="text-center">
          <p className="text-sm font-medium">{dragging ? "Drop to add" : "Click, drag or paste images here"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP — up to {maxFiles} files</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {previews.length > 0 && (
        <ImageGroup>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {previews.map((p, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-muted shadow-soft">
              <Image src={p.url} alt={p.file.name} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/55 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        </ImageGroup>
      )}
    </div>
  );
}
