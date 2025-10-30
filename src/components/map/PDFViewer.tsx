'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
// PDF.js worker: must be available locally as /pdf.worker.mjs (see README)
if (typeof window !== "undefined" && (pdfjsLib as any).GlobalWorkerOptions) {
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
}

type PDFViewerProps = {
  src?: string;
};

export default function PDFViewer({ src = "/dummy.pdf" }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pageRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.2);

  // Touch logic refs for mobile
  const lastTouch = useRef<{x: number, y: number} | null>(null);
  const lastPinchDist = useRef<number | null>(null);

  // Mouse/touch pan or zoom state
  const [isPanning, setIsPanning] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number } | null>(null);

  const renderPage = useCallback(async (nextScale: number) => {
    if (!pageRef.current || !canvasRef.current) return;
    const page = pageRef.current as any;
    const canvas = canvasRef.current as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Cancel previous rendering if any
    if (renderTaskRef.current && typeof renderTaskRef.current.cancel === "function") {
      try { renderTaskRef.current.cancel(); } catch {}
    }

    const viewport = page.getViewport({ scale: nextScale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    renderTaskRef.current = page.render({ canvasContext: context, viewport });
    await renderTaskRef.current.promise.catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadingTask = pdfjsLib.getDocument(src);
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        const page = await pdf.getPage(1);
        if (cancelled) return;
        pageRef.current = page;
        await renderPage(scale);
      } catch (e) {
        console.error("Failed to load map PDF:", e); 
        setError("Failed to load map. Ensure public/radom-mapa.pdf exists and is not corrupted.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (renderTaskRef.current && typeof renderTaskRef.current.cancel === "function") {
        try { renderTaskRef.current.cancel(); } catch {}
      }
    };
  }, [src, renderPage, scale]);

  // Wheel event (desktop zoom)
  const onWheel = (e: React.WheelEvent | WheelEvent) => {
    // Only zoom, never scroll parent!
    e.preventDefault();
    const delta = (e as any).deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.min(3, Math.max(0.5, Number((s + delta).toFixed(2)))));
  };

  const startPan = (e: React.MouseEvent) => {
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const movePan = (e: React.MouseEvent) => {
    if (!isPanning || !panStartRef.current) return;
    setPan({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
  };
  const endPan = () => {
    setIsPanning(false);
    panStartRef.current = null;
  };

  const zoomIn = () => setScale((s) => Math.min(3, Number((s + 0.2).toFixed(2))));
  const zoomOut = () => setScale((s) => Math.max(0.5, Number((s - 0.2).toFixed(2))));

  // Touch gesture start handler
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      if (!e.touches[0]) return;
      lastTouch.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      };
    } else if (e.touches.length === 2) {
      if (!e.touches[0] || !e.touches[1]) return;
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastPinchDist.current = d;
    }
  };

  // Touch move: triggers pan or pinch zoom
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPanning && lastTouch.current) {
      if (!e.touches[0]) return;
      setPan({
        x: e.touches[0].clientX - lastTouch.current.x,
        y: e.touches[0].clientY - lastTouch.current.y
      });
    } else if (e.touches.length === 2 && lastPinchDist.current !== null) {
      if (!e.touches[0] || !e.touches[1]) return;
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (d - lastPinchDist.current) / 200; // pinch-zoom sensitivity
      setScale((s) => Math.min(3, Math.max(0.5, Number((s + delta).toFixed(2)))));
      lastPinchDist.current = d;
    }
    e.preventDefault();
  };

  // Touch gesture end handler
  const onTouchEnd = (e: React.TouchEvent) => {
    setIsPanning(false);
    lastTouch.current = null;
    lastPinchDist.current = null;
  };

  // On mount: block scroll for desktop zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const wheelListener = (e: WheelEvent) => {
      e.preventDefault();
      onWheel(e);
    };
    container.addEventListener("wheel", wheelListener, { passive: false });
    return () => {
      container.removeEventListener("wheel", wheelListener);
    };
  }, [onWheel]);

  return (
    <div 
      className="w-full h-[50vh] md:h-[70vh] relative rounded-md border border-zinc-700 bg-zinc-900/60 select-none overflow-hidden"
   
    >
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          onClick={zoomOut}
          className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600"
          aria-label="Zoom out"
        >
          –
        </button>
        <button
          onClick={zoomIn}
          className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600"
          aria-label="Zoom in"
        >
          +
        </button>
        <a
          href={src}
          download
          className="ml-2 px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white border border-red-700"
        >
          Download Map
        </a>
      </div>

      {/* Canvas viewport */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: "none" }}
        onMouseDown={startPan}
        onMouseMove={movePan}
        onMouseUp={endPan}
        onMouseLeave={endPan}
        // obsługa dotykowa
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {isLoading && (
          <div className="h-full w-full flex items-center justify-center text-zinc-300">Loading map…</div>
        )}
        {error && (
          <div className="h-full w-full flex items-center justify-center text-red-400 text-sm px-4 text-center">{error}</div>
        )}
        <div
          className="w-max h-max"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
        >
          <canvas ref={canvasRef} className="block" />
        </div>
      </div>
    </div>
  );
}