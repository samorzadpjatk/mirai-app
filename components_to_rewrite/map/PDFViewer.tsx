'use client';

import { useEffect, useRef, useState, useCallback } from "react";
// PDF.js will be loaded dynamically from CDN; no direct import here


type PDFViewerProps = {
  src?: string;
};

export default function PDFViewer({ src = "/dummy.pdf" }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  type PdfRenderTask = { cancel?: () => void; promise: Promise<unknown> };
  type PdfPage = {
    getViewport: (opts: { scale: number }) => { width: number; height: number };
    render: (params: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => PdfRenderTask;
  };
  type PdfDocument = { getPage: (pageNumber: number) => Promise<PdfPage> };
  type PdfJsModule = {
    GlobalWorkerOptions: { workerSrc: string };
    getDocument: (src: string) => { promise: Promise<PdfDocument> };
  };

  const pageRef = useRef<PdfPage | null>(null);
  const renderTaskRef = useRef<PdfRenderTask | null>(null);

  // Render scale - always render at high resolution (oversampling)
  const RENDER_SCALE = 4.0;
  
  // Display scale - CSS transform scale for zoom (0.1 to 1.0, where 1.0 = full render scale)
  const [displayScale, setDisplayScale] = useState(0.3);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Touch logic refs for mobile
  const lastTouch = useRef<{x: number, y: number} | null>(null);
  const lastPinchDist = useRef<number | null>(null);

  // Mouse/touch pan or zoom state
  const [isPanning, setIsPanning] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number } | null>(null);

  const renderPage = useCallback(async () => {
    if (!pageRef.current || !canvasRef.current) return;
    const page = pageRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Cancel previous rendering if any
    renderTaskRef.current?.cancel?.();

    // Always render at high resolution (oversampling)
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    renderTaskRef.current = page.render({ canvasContext: context, viewport });
    await renderTaskRef.current.promise.catch((error: unknown) => {
      // Ignore cancellation errors
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "RenderingCancelledException"
      ) {
        return;
      }
      console.warn("PDF render error:", error);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Load PDF.js ESM directly from CDN (no bundler import)
        const pdfjs = (await (0, eval)(
          "import('https://unpkg.com/pdfjs-dist@4.7.76/build/pdf.mjs')"
        )) as unknown as PdfJsModule;
        // Configure worker URL from CDN
        pdfjs.GlobalWorkerOptions.workerSrc =
          "https://unpkg.com/pdfjs-dist@4.7.76/build/pdf.worker.min.mjs";

        const loadingTask = pdfjs.getDocument(src);
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        const page = await pdf.getPage(1);
        if (cancelled) return;
        pageRef.current = page;
        await renderPage();
      } catch (e) {
        console.error("Failed to load map PDF:", e); 
        setError("Failed to load map.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
    };
  }, [src, renderPage]);

  // Wheel event (desktop zoom) - only changes CSS scale, no re-rendering
  const onWheel = useCallback((e: React.WheelEvent | WheelEvent) => {
    // Only zoom, never scroll parent!
    e.preventDefault();
    const deltaY = 'deltaY' in e ? e.deltaY : (e as React.WheelEvent).deltaY;
    const delta = deltaY > 0 ? -0.02 : 0.02;
    setDisplayScale((s) => Math.min(1.0, Math.max(0.1, Number((s + delta).toFixed(3)))));
  }, []);

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

  const zoomIn = () => setDisplayScale((s) => Math.min(1.0, Number((s + 0.05).toFixed(3))));
  const zoomOut = () => setDisplayScale((s) => Math.max(0.1, Number((s - 0.05).toFixed(3))));

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
      const delta = (d - lastPinchDist.current) / 1000; // pinch-zoom sensitivity
      setDisplayScale((s) => Math.min(1.0, Math.max(0.1, Number((s + delta).toFixed(3)))));
      lastPinchDist.current = d;
    }
    e.preventDefault();
  };

  // Touch gesture end handler
  const onTouchEnd = () => {
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
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${displayScale})`,
            transformOrigin: '0 0',
            willChange: 'transform'
          }}
        >
          <canvas 
            ref={canvasRef} 
            className="block" 
            style={{ 
              imageRendering: 'auto',
              willChange: 'contents'
            }} 
          />
        </div>
      </div>
    </div>
  );
}