export const useUseTemplateOperations = () => {
  async function generateCompositeImage() {
    try {
      if (!previewImageUrl.value || !previewContainer.value) {
        throw new Error("No image or container available");
      }

      // Create a temporary image to get natural dimensions
      const tempImage = new Image();
      tempImage.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        tempImage.onload = resolve;
        tempImage.onerror = reject;
        tempImage.src = previewImageUrl.value;
      });

      // Create canvas with original image dimensions
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const originalWidth = tempImage.naturalWidth;
      const originalHeight = tempImage.naturalHeight;

      canvas.width = originalWidth;
      canvas.height = originalHeight;

      // Draw the background image
      ctx.drawImage(tempImage, 0, 0, originalWidth, originalHeight);

      // Get the image bounds for scaling calculations
      const imageBounds = getImageBounds();

      // Calculate responsive font size based on image dimensions and field size
      const baseFontSize = Math.min(originalWidth, originalHeight) * 0.02;
      const minFontSize = 12;
      const maxFontSize = 48;

      // Render each field onto the canvas
      for (const field of placedFields.value) {
        // Calculate position on the original image
        const scaledX = (field.x - imageBounds.offsetX) * imageBounds.scaleX;
        const scaledY = (field.y - imageBounds.offsetY) * imageBounds.scaleY;
        const scaledWidth = field.width * imageBounds.scaleX;
        const scaledHeight = field.height * imageBounds.scaleY;

        if (
          scaledX < -scaledWidth ||
          scaledY < -scaledHeight ||
          scaledX > originalWidth ||
          scaledY > originalHeight
        ) {
          continue;
        }

        const fieldFontSize = Math.max(
          minFontSize,
          Math.min(
            maxFontSize,
            Math.min(scaledHeight * 0.6, scaledWidth * 0.1, baseFontSize)
          )
        );

        if (field.name === "Check Mark") {
          ctx.save();
          const checkmarkSize = Math.max(fieldFontSize * 1.2, 16);
          ctx.font = `normal ${checkmarkSize}px Arial, sans-serif`;
          ctx.fillStyle = "#1a1a1a";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          ctx.shadowBlur = 2;
          const checkmarkX = scaledX + scaledWidth / 2;
          const checkmarkY = scaledY + scaledHeight / 2;
          ctx.fillText("✓", checkmarkX, checkmarkY);
          ctx.restore();
        } else {
          const textToRender = field.label ? field.label.trim() : "";
          if (textToRender) {
            ctx.save();
            ctx.font = `normal ${fieldFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`;
            ctx.fillStyle = "#1a1a1a";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const centerX = scaledX + scaledWidth / 2;
            const centerY = scaledY + scaledHeight / 2;

            const maxTextWidth = scaledWidth * 0.95;
            const words = textToRender.split(" ");
            let lines = [];
            let line = "";

            for (let i = 0; i < words.length; i++) {
              const testLine = line + words[i] + " ";
              const metrics = ctx.measureText(testLine);
              const testWidth = metrics.width;
              if (testWidth > maxTextWidth && i > 0) {
                lines.push(line.trim());
                line = words[i] + " ";
              } else {
                line = testLine;
              }
            }
            if (line.trim()) lines.push(line.trim());

            const lineHeight = fieldFontSize * 1.2;
            const totalTextHeight = lines.length * lineHeight;
            let startY = centerY - totalTextHeight / 2 + lineHeight / 2;

            for (let i = 0; i < lines.length; i++) {
              ctx.fillText(lines[i], centerX, startY + i * lineHeight);
            }
            ctx.restore();
          }
        }
      }

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/png",
          0.95
        );
      });
    } catch (error) {
      console.error("Error generating composite image:", error);
      return null;
    }
  }

  
  return ref();
};
