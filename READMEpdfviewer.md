# PDF Viewer – PR Summary (for /map subpage)

**What was added**
- `/map` subpage with an interactive PDF map/document viewer using PDF.js.
- Zoom via mouse scroll (desktop) and pinch gesture (mobile).
- Pan (drag to move) with mouse (desktop) or one finger (touch).
- Responsive design for both desktop and mobile use.

**What was changed/optimized**
- User can't accidentally scroll the page when zooming or panning inside the viewer—scroll/zoom only affects the PDF itself.
- Touch-action and event handler logic were added to provide natural pinch-to-zoom and pan on smartphones.
- Error handling provided when PDF is missing or cannot be loaded.
- Viewer height and scaling tuned for better UX.
- Code is fully TS-checked and linted; all gesture logic is typesafe and robust.

**About the PDF.js worker (`pdf.worker.mjs`) in /public:**
- PDF.js requires a separate web worker file to run parsing efficiently outside the main browser UI thread.
- Modern `pdfjs-dist` delivers this as `pdf.worker.mjs` (an ES module), not a classic `.js` file.
- Next.js (and most frontend frameworks) cannot automatically expose this worker from `node_modules` for direct use—browser workers must be served as standalone, public files.
- Therefore, developers must manually copy `pdf.worker.mjs` from `node_modules/pdfjs-dist/build/` to the project's `public` folder (so it's available at `/pdf.worker.mjs`).
- Without this, PDF rendering will not work or will fall back to slow, single-threaded parsing.

**Instructions:**
- Place `pdf.worker.mjs` into the `public` folder before using `/map`.
- By default, the viewer loads `dummy.pdf` for demo/testing—replace with any file in `/public` as needed.
- The component is ready to use on both desktop (mouse, scroll) and smartphones (pinch, touch, drag). No page scroll happens during map navigation.
