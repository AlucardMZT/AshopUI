// Type declarations for pdfjs-dist legacy build imports used in the project
declare module 'pdfjs-dist/legacy/build/pdf' {
  const pdfjsLib: any;
  export = pdfjsLib;
}

// Se eliminó la declaración para `pdf.worker.entry` ya que el worker usado es
// `pdf.worker.min.mjs` y las importaciones con `?url` se cubren por `vite-url.d.ts`.
