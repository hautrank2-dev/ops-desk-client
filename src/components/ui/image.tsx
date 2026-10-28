"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  ChevronLeft,
  ChevronRight,
  FlipHorizontal2,
  FlipVertical2,
  RotateCcw,
  RotateCw,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PreviewItem = { src: string; alt?: string };

const MIN_SCALE = 0.25;
const MAX_SCALE = 8;
const ZOOM_STEP = 1.25;

type Transform = { scale: number; rotate: number; flipX: boolean; flipY: boolean; x: number; y: number };
const INITIAL: Transform = { scale: 1, rotate: 0, flipX: false, flipY: false, x: 0, y: 0 };

const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

// ─── Viewer ────────────────────────────────────────────────────────────────

export type ImagePreviewProps = {
  items: PreviewItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  index: number;
  onIndexChange: (index: number) => void;
};

/** Full-screen viewer: zoom, rotate, flip, pan; prev / next + thumbnails when there are several images. */
export function ImagePreview({ items, open, onOpenChange, index, onIndexChange }: ImagePreviewProps) {
  const [t, setT] = useState<Transform>(INITIAL);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const multiple = items.length > 1;
  const current = items[index];

  // Every image starts untransformed.
  useEffect(() => setT(INITIAL), [index, open]);

  /**
   * Anchor the image to the stage: on an axis where it is smaller than the
   * stage it snaps back to the centre, where it is larger its edges may not
   * pull inside the stage — so it can never be dragged or zoomed off screen.
   */
  const anchor = useCallback((p: Transform): Transform => {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img) return p;
    // offsetWidth/Height ignore CSS transforms: the fitted size at scale 1.
    const sideways = Math.abs(p.rotate / 90) % 2 === 1;
    const w = (sideways ? img.offsetHeight : img.offsetWidth) * p.scale;
    const h = (sideways ? img.offsetWidth : img.offsetHeight) * p.scale;
    const maxX = Math.max(0, (w - stage.clientWidth) / 2);
    const maxY = Math.max(0, (h - stage.clientHeight) / 2);
    return { ...p, x: Math.min(maxX, Math.max(-maxX, p.x)), y: Math.min(maxY, Math.max(-maxY, p.y)) };
  }, []);

  /**
   * Zoom keeping a point fixed. `point` is relative to the stage centre; the
   * image centre sits at the stage centre + (x, y), so the offset of the point
   * from the image centre scales by the same ratio as the image.
   */
  const zoomAt = (factor: number, point = { x: 0, y: 0 }) =>
    setT((p) => {
      const scale = clampScale(p.scale * factor);
      const k = scale / p.scale;
      return anchor({ ...p, scale, x: point.x - (point.x - p.x) * k, y: point.y - (point.y - p.y) * k });
    });

  const pointFromEvent = (e: { clientX: number; clientY: number }) => {
    const r = stageRef.current?.getBoundingClientRect();
    return r ? { x: e.clientX - (r.left + r.width / 2), y: e.clientY - (r.top + r.height / 2) } : { x: 0, y: 0 };
  };

  const go = useCallback(
    (delta: number) => {
      if (!multiple) return;
      onIndexChange((index + delta + items.length) % items.length);
    },
    [index, items.length, multiple, onIndexChange]
  );

  const zoom = (factor: number) => zoomAt(factor);
  const rotate = (deg: number) => setT((p) => anchor({ ...p, rotate: p.rotate + deg }));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "+" || e.key === "=") zoom(ZOOM_STEP);
    else if (e.key === "-") zoom(1 / ZOOM_STEP);
    else return;
    e.preventDefault();
  };

  // Bound to the <img> only: wheeling over the empty stage does nothing.
  const onWheel = (e: ReactWheelEvent<HTMLImageElement>) =>
    zoomAt(e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, pointFromEvent(e));

  const onPointerDown = (e: ReactPointerEvent<HTMLImageElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: t.x, oy: t.y };
    setDragging(true);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setT((p) => ({ ...p, x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y }));
  };
  // Free drag while held; on release the image snaps back inside the anchor bounds.
  const onPointerUp = () => {
    drag.current = null;
    setDragging(false);
    setT(anchor);
  };

  const tools: { icon: ReactNode; label: string; onClick: () => void; disabled?: boolean }[] = [
    { icon: <FlipHorizontal2 />, label: "Flip horizontal", onClick: () => setT((p) => ({ ...p, flipX: !p.flipX })) },
    { icon: <FlipVertical2 />, label: "Flip vertical", onClick: () => setT((p) => ({ ...p, flipY: !p.flipY })) },
    { icon: <RotateCcw />, label: "Rotate left", onClick: () => rotate(-90) },
    { icon: <RotateCw />, label: "Rotate right", onClick: () => rotate(90) },
    { icon: <ZoomOut />, label: "Zoom out", onClick: () => zoom(1 / ZOOM_STEP), disabled: t.scale <= MIN_SCALE },
    { icon: <ZoomIn />, label: "Zoom in", onClick: () => zoom(ZOOM_STEP), disabled: t.scale >= MAX_SCALE },
    { icon: <Undo2 />, label: "Reset", onClick: () => setT(INITIAL) },
  ];

  const transform = [
    `translate3d(${t.x}px, ${t.y}px, 0)`,
    `scale3d(${t.flipX ? -t.scale : t.scale}, ${t.flipY ? -t.scale : t.scale}, 1)`,
    `rotate(${t.rotate}deg)`,
  ].join(" ");

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-50 text-white outline-none select-none"
        >
          <DialogPrimitive.Title className="sr-only">{current?.alt || "Image preview"}</DialogPrimitive.Title>

          {/* Top bar */}
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent px-4 py-3">
            <span className="text-sm tabular-nums text-white/70">{multiple && `${index + 1} / ${items.length}`}</span>
            <DialogPrimitive.Close aria-label="Close" className={toolButton}>
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>

          {/* Stage */}
          <div
            ref={stageRef}
            className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
            onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
          >
            {current && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                key={current.src}
                src={current.src}
                alt={current.alt ?? ""}
                draggable={false}
                onWheel={onWheel}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onDoubleClick={(e) =>
                  t.scale === 1 ? zoomAt(2, pointFromEvent(e)) : setT((p) => ({ ...p, scale: 1, x: 0, y: 0 }))
                }
                style={{ transform }}
                className={cn(
                  "max-h-full max-w-full cursor-grab object-contain active:cursor-grabbing",
                  !dragging && "transition-transform duration-200 ease-apple"
                )}
              />
            )}

            {multiple && (
              <>
                <button type="button" aria-label="Previous image" onClick={() => go(-1)} className={cn(navButton, "left-4")}>
                  <ChevronLeft className="size-6" />
                </button>
                <button type="button" aria-label="Next image" onClick={() => go(1)} className={cn(navButton, "right-4")}>
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom controls: overlay the stage; only the controls catch pointer events */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2 bg-gradient-to-t from-black/50 to-transparent pb-4 pt-6">
          {/* Toolbar */}
          <div className="pointer-events-auto flex justify-center">
            <div className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 backdrop-blur-xl">
              {tools.map((tool) => (
                <button
                  key={tool.label}
                  type="button"
                  title={tool.label}
                  aria-label={tool.label}
                  onClick={tool.onClick}
                  disabled={tool.disabled}
                  className={cn(toolButton, "[&_svg]:size-[18px]")}
                >
                  {tool.icon}
                </button>
              ))}
              <span className="ml-1 w-12 text-center text-xs tabular-nums text-white/70">{Math.round(t.scale * 100)}%</span>
            </div>
          </div>

          {/* Thumbnails */}
          {multiple && (
            <div className="pointer-events-auto flex max-w-full justify-center gap-2 overflow-x-auto px-4 py-2">
              {items.map((item, i) => (
                <button
                  key={`${item.src}-${i}`}
                  type="button"
                  aria-label={`Show image ${i + 1}`}
                  aria-current={i === index}
                  onClick={() => onIndexChange(i)}
                  className={cn(
                    "size-14 shrink-0 cursor-pointer overflow-hidden rounded-lg opacity-50 ring-2 ring-transparent transition-all hover:opacity-90",
                    i === index && "opacity-100 ring-white"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.src} alt="" draggable={false} className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

const toolButton =
  "inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white disabled:pointer-events-none disabled:opacity-35";
const navButton =
  "absolute z-10 top-1/2 -translate-y-1/2 inline-flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-xl transition-colors hover:bg-white/20";

// ─── Group ─────────────────────────────────────────────────────────────────

type GroupEntry = { id: string; el: HTMLElement | null; item: PreviewItem };

type GroupContextValue = {
  register: (entry: GroupEntry) => () => void;
  openAt: (id: string) => void;
};

const GroupContext = createContext<GroupContextValue | null>(null);

/**
 * Every `Image` inside opens one shared viewer with prev / next and
 * thumbnails, ordered as the images appear in the DOM.
 */
export function ImageGroup({ children }: { children: ReactNode }) {
  const entries = useRef(new Map<string, GroupEntry>());
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const ordered = () =>
    [...entries.current.values()].sort((a, b) =>
      a.el && b.el && a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    );

  const value: GroupContextValue = {
    register: (entry) => {
      entries.current.set(entry.id, entry);
      return () => { entries.current.delete(entry.id); };
    },
    openAt: (id) => {
      const list = ordered();
      setItems(list.map((e) => e.item));
      setIndex(Math.max(0, list.findIndex((e) => e.id === id)));
      setOpen(true);
    },
  };

  return (
    <GroupContext.Provider value={value}>
      {children}
      <ImagePreview items={items} open={open} onOpenChange={setOpen} index={index} onIndexChange={setIndex} />
    </GroupContext.Provider>
  );
}

// ─── Image ─────────────────────────────────────────────────────────────────

export type ImageProps = Omit<ComponentProps<"img">, "src"> & {
  src: string;
  /** Full-size source for the viewer when `src` is a thumbnail. */
  previewSrc?: string;
  /** Set false for decorative images that must not open the viewer. */
  preview?: boolean;
};

/** An `<img>` that opens the viewer on click — alone, or as part of the nearest `ImageGroup`. */
export function Image({ src, previewSrc, preview = true, alt, className, onClick, ...props }: ImageProps) {
  const id = useId();
  const ref = useRef<HTMLImageElement>(null);
  const group = useContext(GroupContext);
  const [open, setOpen] = useState(false);
  const item = { src: previewSrc ?? src, alt: alt ?? undefined };
  const register = group?.register;

  useEffect(() => {
    if (!register || !preview) return;
    return register({ id, el: ref.current, item });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, id, preview, item.src, item.alt]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        onClick={(e) => {
          onClick?.(e);
          if (!preview || e.defaultPrevented) return;
          if (group) group.openAt(id);
          else setOpen(true);
        }}
        className={cn(preview && "cursor-zoom-in", className)}
        {...props}
      />
      {preview && !group && (
        <ImagePreview items={[item]} open={open} onOpenChange={setOpen} index={0} onIndexChange={() => {}} />
      )}
    </>
  );
}
