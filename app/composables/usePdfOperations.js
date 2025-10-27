export const usePdfOperations = () => {
  // Load PDF.js
  async function loadPdfJs() {
    if (typeof window === "undefined") return null;

    try {
      console.log("[PDF Operations] PDF.js initialization started");

      // Import PDF.js dynamically
      const pdfjs = await import("pdfjs-dist");

      // Set worker source after importing
      if (process.client) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      }

      return pdfjs;
    } catch (error) {
      console.error("[PDF Operations] Error initializing PDF.js:", error);
      throw error;
    }
  }

  // Load pdf-lib dynamically
  async function loadPdfLib() {
    if (typeof window !== "undefined" && !window.PDFLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    return window.PDFLib;
  }

  // Load PDF document
  async function loadPdfDocument(pdfUrl) {
    console.log("[PDF Operations] Starting loadPdfDocument");
    const pdfjsLib = await loadPdfJs();
    console.log("[PDF Operations] PDF.js library loaded:", !!pdfjsLib);

    try {
      if (typeof pdfUrl === "string") {
        // URL-based loading
        console.log("[PDF Operations] Loading from URL");
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        return await loadingTask.promise;
      } else {
        // ArrayBuffer/Uint8Array-based loading
        console.log("[PDF Operations] Loading from binary data");
        const loadingTask = pdfjsLib.getDocument({
          data: pdfUrl,
          cMapUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/pdfjs-dist/3.11.174/cmaps/",
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        console.log(
          "[PDF Operations] PDF loaded successfully, pages:",
          pdf.numPages
        );
        return pdf;
      }
    } catch (error) {
      console.error("[PDF Operations] Error loading PDF document:", error);
      throw error;
    }
  }

  // Render a PDF page to canvas
  async function renderPdfPage(pdf, pageNumber, scale = 1.5) {
    try {
      console.log("[PDF Operations] Starting renderPdfPage", {
        pageNumber,
        scale,
      });
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      console.log("[PDF Operations] Created viewport:", {
        width: viewport.width,
        height: viewport.height,
      });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { alpha: false });
      console.log("[PDF Operations] Canvas context created:", !!context);

      // Set display size
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      console.log("[PDF Operations] Display size set:", {
        styleWidth: canvas.style.width,
        styleHeight: canvas.style.height,
        pixelRatio,
      });

      // Set actual size in memory
      canvas.width = viewport.width * pixelRatio;
      canvas.height = viewport.height * pixelRatio;

      // Scale context to match the device pixel ratio
      context.scale(pixelRatio, pixelRatio);

      // Set white background
      context.fillStyle = "white";
      context.fillRect(0, 0, viewport.width, viewport.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        enableWebGL: true,
      };

      await page.render(renderContext).promise;

      return {
        canvas,
        viewport,
        page,
      };
    } catch (error) {
      console.error("Error rendering PDF page:", error);
      throw error;
    }
  }

  // Convert canvas to blob
  function canvasToBlob(canvas, quality = 0.95) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", quality);
    });
  }

  // Calculate font size based on field dimensions
  function calculateFontSize(width, height, baseFontSize) {
    const aspectRatio = width / height;
    let fontSize = baseFontSize;

    if (aspectRatio > 3) {
      fontSize = baseFontSize * 0.7;
    } else if (aspectRatio > 2) {
      fontSize = baseFontSize * 0.8;
    } else if (aspectRatio < 0.5) {
      fontSize = baseFontSize * 1.2;
    }

    return Math.max(8, Math.min(fontSize, height * 0.6));
  }

  // Render text with wrapping on canvas
  function renderTextWithWrapping(
    ctx,
    text,
    x,
    y,
    width,
    height,
    fontSize,
    fontFamily
  ) {
    ctx.save();
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const words = text.split(" ");
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + " " + word;
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > width && currentLine !== "") {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const lineHeight = fontSize * 1.2;
    const startY = y + (height - lines.length * lineHeight) / 2;

    lines.forEach((line, index) => {
      const lineY = startY + index * lineHeight;
      if (lineY + fontSize <= y + height) {
        ctx.fillText(line, x, lineY);
      }
    });

    ctx.restore();
  }

  // Render check mark on canvas
  function renderCheckMark(ctx, x, y, width, height, fontSize) {
    ctx.save();
    ctx.strokeStyle = "#198754";
    ctx.lineWidth = fontSize * 0.15;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const size = Math.min(width, height) * 0.4;

    ctx.beginPath();
    ctx.moveTo(centerX - size / 2, centerY);
    ctx.lineTo(centerX - size / 6, centerY + size / 3);
    ctx.lineTo(centerX + size / 2, centerY - size / 3);
    ctx.stroke();

    ctx.restore();
  }

  // Check if field is within bounds
  function isFieldInBounds(
    x,
    y,
    width,
    height,
    containerWidth,
    containerHeight
  ) {
    return (
      x >= 0 &&
      y >= 0 &&
      x + width <= containerWidth &&
      y + height <= containerHeight
    );
  }

  // Generate composite PDF with fields embedded
  async function generateCompositePdf(pdfBytes, placedFields, pageNumber = 1) {
    const PDFLib = await loadPdfLib();
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const targetPage = pages[pageNumber - 1];

    const { width: pageWidth, height: pageHeight } = targetPage.getSize();

    // Embed font
    let font;
    try {
      font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    } catch (e) {
      font = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
    }

    // Process each field
    for (const field of placedFields) {
      try {
        if (field.name === "Check Mark") {
          // For check marks, we'll create a simple canvas and embed it
          const canvas = document.createElement("canvas");
          canvas.width = field.width;
          canvas.height = field.height;
          const ctx = canvas.getContext("2d");

          renderCheckMark(ctx, 0, 0, field.width, field.height, 12);

          const imageData = canvas.toDataURL("image/png");
          const pngImage = await pdfDoc.embedPng(imageData);

          targetPage.drawImage(pngImage, {
            x: field.x,
            y: pageHeight - field.y - field.height,
            width: field.width,
            height: field.height,
          });
        } else {
          // For text fields
          const text = field.label ? field.label.trim() : "";
          if (text) {
            // Try to draw text directly first (for ASCII)
            if (/^[a-zA-Z0-9\s\-_@.]+$/.test(text)) {
              targetPage.drawText(text, {
                x: field.x,
                y: pageHeight - field.y - field.height,
                size: 12,
                font: font,
                color: PDFLib.rgb(0, 0, 0),
              });
            } else {
              // For non-ASCII characters, render to canvas and embed as image
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");

              const fontSize = calculateFontSize(field.width, field.height, 12);
              ctx.font = `${fontSize * 2}px "Sarabun", Arial, sans-serif`;
              const textMetrics = ctx.measureText(text);
              const textWidth = textMetrics.width;
              const textHeight = fontSize * 2;

              canvas.width = Math.max(textWidth + 10, field.width);
              canvas.height = Math.max(textHeight + 10, field.height);

              ctx.fillStyle = "white";
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              ctx.font = `${fontSize * 2}px "Sarabun", Arial, sans-serif`;
              ctx.fillStyle = "black";
              ctx.textAlign = "left";
              ctx.textBaseline = "top";
              ctx.fillText(text, 5, 5);

              const imageData = canvas.toDataURL("image/png");
              const pngImage = await pdfDoc.embedPng(imageData);

              const scaleFactor = fontSize / (fontSize * 2);
              targetPage.drawImage(pngImage, {
                x: field.x,
                y: pageHeight - field.y - field.height,
                width: Math.min((textWidth + 10) * scaleFactor, field.width),
                height: Math.min((textHeight + 10) * scaleFactor, field.height),
              });
            }
          }
        }
      } catch (error) {
        console.error("Error processing field:", field, error);
      }
    }

    const modifiedPdfBytes = await pdfDoc.save();
    return modifiedPdfBytes;
  }

  // Convert Uint8Array to base64
  async function uint8ArrayToBase64(bytes) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(new Blob([bytes]));
      reader.onload = () => {
        resolve(reader.result.split(",")[1]);
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
  }

  // Convert base64 to Uint8Array
  function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  return {
    loadPdfJs,
    loadPdfLib,
    loadPdfDocument,
    renderPdfPage,
    canvasToBlob,
    calculateFontSize,
    renderTextWithWrapping,
    renderCheckMark,
    isFieldInBounds,
    generateCompositePdf,
    uint8ArrayToBase64,
    base64ToUint8Array,
  };
};
