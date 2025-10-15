<template>
  <div class="card card-primary">
    <div class="card-header">
      <h3 class="card-title">Preview</h3>
      <div class="card-tools">
        <button type="submit" class="btn btn-success" @click="saveTemplate">
          <i class="fas fa-save"></i> Save Template
        </button>
      </div>
    </div>
    <div class="card-body p-3">
      <div
        id="preview-container"
        ref="previewContainer"
        class="template-preview-area"
        @mouseup="stopDrag"
        @mousemove="drag"
        @mouseleave="stopDrag"
      >
        <img
          v-if="previewImageUrl"
          :src="previewImageUrl"
          class="d-block"
          @load="onImageLoad"
        />
        <div
          v-else
          class="d-flex align-items-center justify-content-center"
          style="min-height: 400px"
        >
          <div class="text-center text-muted">
            <i class="fas fa-image fa-3x mb-3"></i>
            <p>Please upload an image to start creating your template.</p>
          </div>
        </div>

        <div
          v-for="field in placedFields"
          :key="field.instanceId"
          class="placed-field border-2 d-flex align-items-center p-2 small text-nowrap overflow-hidden rounded"
          :class="{
            'field-selected': selectedField?.instanceId === field.instanceId,
          }"
          :style="{
            left: field.x + 'px',
            top: field.y + 'px',
            width: field.width + 'px',
            height: field.height + 'px',
            transform:
              activeDrag.isDragging &&
              activeDrag.field?.instanceId === field.instanceId
                ? 'scale(1.05)'
                : 'scale(1)',
            zIndex: selectedField?.instanceId === field.instanceId ? 1000 : 1,
          }"
          @click.stop="selectField(field)"
          @mousedown.prevent="startDrag($event, field)"
          @touchstart.prevent="startDrag($event, field)"
        >
          <div class="field-content">
            <i
              v-if="field.name === 'Check Mark'"
              :class="field.icon"
              style="font-size: 1.2em"
            ></i>
            <span v-if="field.label" class="field-label">{{
              field.label
            }}</span>
            <span v-if="field.instanceNumber > 1" class="instance-number">
              #{{ field.instanceNumber }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();

const props = defineProps({
  previewImageUrl: {
    type: String,
    default: null,
  },
  placedFields: {
    type: Array,
    default: () => [],
  },
  selectedField: {
    type: Object,
    default: null,
  },
  newTemplateName: {
    type: String,
    default: "",
  },
  selectedContractId: {
    type: [String, Number],
    default: null,
  },
  originalFile: {
    type: File,
    default: null,
  },
});

const emit = defineEmits(["field-selected", "image-loaded", "template-saved"]);

const previewContainer = ref(null);

const activeDrag = ref({
  isDragging: false,
  field: null,
  offsetX: 0,
  offsetY: 0,
  startX: 0,
  startY: 0,
});

function onImageLoad() {
  emit("image-loaded");
}

function selectField(field) {
  emit("field-selected", field);
}

function getEventCoordinates(event) {
  if (event.touches && event.touches.length > 0) {
    return {
      clientX: event.touches[0].clientX,
      clientY: event.touches[0].clientY,
    };
  }
  return { clientX: event.clientX, clientY: event.clientY };
}

function startDrag(event, field) {
  if (!previewContainer.value || !field) return;

  const coords = getEventCoordinates(event);
  const containerRect = previewContainer.value.getBoundingClientRect();

  activeDrag.value = {
    isDragging: true,
    field: field,
    offsetX: coords.clientX - containerRect.left - field.x,
    offsetY: coords.clientY - containerRect.top - field.y,
    startX: coords.clientX,
    startY: coords.clientY,
  };

  emit("field-selected", field);

  event.preventDefault();
  event.stopPropagation();

  document.addEventListener("mousemove", drag, { passive: false });
  document.addEventListener("mouseup", stopDrag);
  document.addEventListener("touchmove", drag, { passive: false });
  document.addEventListener("touchend", stopDrag);
}

function drag(event) {
  if (
    !activeDrag.value.isDragging ||
    !activeDrag.value.field ||
    !previewContainer.value
  ) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const coords = getEventCoordinates(event);
  const containerRect = previewContainer.value.getBoundingClientRect();

  let newX = coords.clientX - containerRect.left - activeDrag.value.offsetX;
  let newY = coords.clientY - containerRect.top - activeDrag.value.offsetY;

  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;
  const fieldWidth = activeDrag.value.field.width || 150;
  const fieldHeight = activeDrag.value.field.height || 40;

  newX = Math.max(0, Math.min(newX, containerWidth - fieldWidth));
  newY = Math.max(0, Math.min(newY, containerHeight - fieldHeight));

  activeDrag.value.field.x = Math.round(newX);
  activeDrag.value.field.y = Math.round(newY);
}

function stopDrag(event) {
  if (activeDrag.value.isDragging) {
    activeDrag.value.isDragging = false;
    activeDrag.value.field = null;

    document.removeEventListener("mousemove", drag);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchmove", drag);
    document.removeEventListener("touchend", stopDrag);
  }
}

function getImageBounds() {
  if (!previewContainer.value) {
    return {
      offsetX: 0,
      offsetY: 0,
      width: 0,
      height: 0,
      scaleX: 1,
      scaleY: 1,
    };
  }

  const containerRect = previewContainer.value.getBoundingClientRect();
  const img = previewContainer.value.querySelector("img");

  if (!img) {
    return {
      offsetX: 0,
      offsetY: 0,
      width: containerRect.width,
      height: containerRect.height,
      scaleX: 1,
      scaleY: 1,
    };
  }

  // Wait for image to load and get its natural dimensions
  const naturalWidth = img.naturalWidth || containerRect.width;
  const naturalHeight = img.naturalHeight || containerRect.height;

  if (!naturalWidth || !naturalHeight) {
    return {
      offsetX: 0,
      offsetY: 0,
      width: containerRect.width,
      height: containerRect.height,
      scaleX: 1,
      scaleY: 1,
    };
  }

  const naturalAspectRatio = naturalWidth / naturalHeight;

  // Calculate displayed image dimensions within the 800px container
  const maxWidth = 800;
  const containerWidth = Math.min(containerRect.width, maxWidth);

  let imageDisplayWidth, imageDisplayHeight;
  let offsetX = 0,
    offsetY = 0;

  // Scale image to fit within container while maintaining aspect ratio
  if (naturalWidth > naturalHeight) {
    // Landscape image
    imageDisplayWidth = containerWidth;
    imageDisplayHeight = containerWidth / naturalAspectRatio;
  } else {
    // Portrait image
    const maxHeight = containerRect.height;
    imageDisplayHeight = Math.min(
      maxHeight,
      containerWidth / naturalAspectRatio
    );
    imageDisplayWidth = imageDisplayHeight * naturalAspectRatio;
  }

  // Center the image in the container
  offsetX = (containerWidth - imageDisplayWidth) / 2;
  offsetY = (containerRect.height - imageDisplayHeight) / 2;

  return {
    offsetX: Math.max(0, offsetX),
    offsetY: Math.max(0, offsetY),
    width: imageDisplayWidth,
    height: imageDisplayHeight,
    scaleX: naturalWidth / imageDisplayWidth,
    scaleY: naturalHeight / imageDisplayHeight,
  };
}

// Import canvas operations composable
const {
  createCanvas,
  loadImage,
  drawBackgroundImage,
  renderCheckMark,
  renderTextWithWrapping,
  canvasToBlob,
  calculateFontSize,
  isFieldInBounds,
} = useCanvasOperations();

async function generateCompositeImage() {
  try {
    if (!props.previewImageUrl || !previewContainer.value) {
      throw new Error("No image or container available");
    }

    // Load background image
    const tempImage = await loadImage(props.previewImageUrl);
    const originalWidth = tempImage.naturalWidth;
    const originalHeight = tempImage.naturalHeight;

    // Create canvas with original image dimensions
    const canvas = createCanvas(originalWidth, originalHeight);
    const ctx = canvas.getContext("2d");
    drawBackgroundImage(ctx, tempImage, originalWidth, originalHeight);

    // Get the image bounds for scaling calculations
    const imageBounds = getImageBounds();

    // Calculate responsive font size based on image dimensions and field size
    const baseFontSize = Math.min(originalWidth, originalHeight) * 0.02; // 2% of smallest dimension

    // Render each field onto the canvas
    for (const field of props.placedFields) {
      // Calculate position on the original image
      const scaledX = (field.x - imageBounds.offsetX) * imageBounds.scaleX;
      const scaledY = (field.y - imageBounds.offsetY) * imageBounds.scaleY;
      const scaledWidth = field.width * imageBounds.scaleX;
      const scaledHeight = field.height * imageBounds.scaleY;

      // Skip if field is outside image bounds
      if (
        !isFieldInBounds(
          scaledX,
          scaledY,
          scaledWidth,
          scaledHeight,
          originalWidth,
          originalHeight
        )
      ) {
        continue;
      }

      // Calculate font size based on field dimensions
      const fieldFontSize = calculateFontSize(
        scaledWidth,
        scaledHeight,
        baseFontSize
      );

      if (field.name === "Check Mark") {
        renderCheckMark(
          ctx,
          scaledX,
          scaledY,
          scaledWidth,
          scaledHeight,
          fieldFontSize
        );
      } else {
        const textToRender = field.label ? field.label.trim() : "";
        if (textToRender) {
          renderTextWithWrapping(
            ctx,
            textToRender,
            scaledX,
            scaledY,
            scaledWidth,
            scaledHeight,
            fieldFontSize,
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"
          );
        }
      }
    }

    return await canvasToBlob(canvas, "image/png", 0.95);
  } catch (error) {
    console.error("Error generating composite image:", error);
    return null;
  }
}

async function saveImagesToStorage(templateName, originalFile, compositeBlob) {
  // Save original image
  const timestamp = Date.now();
  const fileExtension = originalFile.name.split(".").pop();
  const originalFileName = `${templateName}_${timestamp}.${fileExtension}`;
  const originalFilePath = `templates/${originalFileName}`;

  const { error: uploadError1 } = await supabase.storage
    .from("template-images")
    .upload(originalFilePath, originalFile, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError1) {
    throw new Error("Error uploading original image: " + uploadError1.message);
  }

  const { data: publicUrlData1 } = supabase.storage
    .from("template-images")
    .getPublicUrl(originalFilePath);

  // Save composite image
  const compositeFileName = `${templateName}_${timestamp}.png`;
  const compositeFilePath = `composites/${compositeFileName}`;

  const { error: uploadError2 } = await supabase.storage
    .from("template-images")
    .upload(compositeFilePath, compositeBlob, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError2) {
    throw new Error("Error uploading composite image: " + uploadError2.message);
  }

  const { data: publicUrlData2 } = supabase.storage
    .from("template-images")
    .getPublicUrl(compositeFilePath);

  return {
    originalImageUrl: publicUrlData1.publicUrl,
    compositeImageUrl: publicUrlData2.publicUrl,
  };
}

async function saveTemplate() {
  try {
    if (!props.previewImageUrl) {
      alert("Please upload a background image first");
      return;
    }

    if (props.placedFields.length === 0) {
      alert("Please add at least one field to the template");
      return;
    }

    const templateName = props.newTemplateName;
    if (!templateName?.trim()) {
      alert("Please enter a template name");
      return;
    }

    if (!props.selectedContractId) {
      alert("Please select a contract");
      return;
    }

    if (!props.originalFile) {
      alert("Please select an image file");
      return;
    }

    // Get the natural dimensions of the uploaded image
    const originalImage = new Image();
    const imageData = await new Promise((resolve, reject) => {
      originalImage.onload = () =>
        resolve({
          naturalWidth: originalImage.naturalWidth,
          naturalHeight: originalImage.naturalHeight,
        });
      originalImage.onerror = reject;
      originalImage.src = props.previewImageUrl;
    });

    // Generate composite image
    const compositeBlob = await generateCompositeImage();
    if (!compositeBlob) {
      alert("Failed to generate composite image");
      return;
    }

    const { originalImageUrl, compositeImageUrl } = await saveImagesToStorage(
      templateName,
      props.originalFile,
      compositeBlob
    );

    const normalizedFields = props.placedFields.map((field) => ({
      id: field.id,
      instanceId: field.instanceId,
      instanceNumber: field.instanceNumber,
      x: Math.round(field.x),
      y: Math.round(field.y),
      width: Math.round(field.width),
      height: Math.round(field.height),
      type: field.type,
      groupId: field.groupId,
      isGrouped: field.isGrouped,
      groupSize: field.groupSize,
      groupPosition: field.groupPosition,
    }));

    const templateData = {
      name: templateName.trim(),
      contract_id: props.selectedContractId,
      background_image_url: originalImageUrl,
      composite_image_url: compositeImageUrl,
      image_width: imageData.naturalWidth,
      image_height: imageData.naturalHeight,
      placed_fields_data: normalizedFields,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("contract_templates")
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      alert("Error saving template: " + error.message);
      return;
    }

    alert("Template and images saved successfully!");

    emit("template-saved", data);
  } catch (error) {
    console.error("Save error:", error);
    alert("Error saving template: " + error.message);
  }
}

onUnmounted(() => {
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDrag);
  document.removeEventListener("touchmove", drag);
  document.removeEventListener("touchend", stopDrag);
});
</script>

<style scoped>
@media (max-width: 820px) {
  #preview-container {
    width: 100% !important;
    margin: 0 !important;
  }

  #preview-container img {
    width: 100% !important;
  }
}

@media (max-width: 768px) {
  .card-body {
    padding: 1rem;
  }
}

#preview-container {
  background-image:
    linear-gradient(45deg, #eee 25%, transparent 25%),
    linear-gradient(-45deg, #eee 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #eee 75%),
    linear-gradient(-45deg, transparent 75%, #eee 75%);
  background-size: 20px 20px;
  min-height: 400px;
}

.placed-field {
  position: absolute;
  cursor: grab;
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.3);
  border: 1px solid #ddd;
}

.placed-field * {
  user-select: none;
  pointer-events: none;
}

.placed-field:active {
  cursor: grabbing;
  transform: scale(1.05);
  z-index: 1000;
}

.placed-field:hover {
  background-color: rgba(255, 255, 255, 0.35);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.field-selected {
  border: rgba(0, 0, 255, 0.3) 2px dashed !important;
  background-color: rgba(0, 0, 255, 0.05) !important;
}

.field-content {
  padding: 2px 5px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  pointer-events: none;
  width: 100%;
  overflow: hidden;
}

.field-label {
  font-weight: bold;
  margin-left: 8px;
  font-size: 0.75rem;
}

.instance-number {
  font-size: 0.6rem;
  color: #666;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 1px 3px;
  border-radius: 2px;
  margin-left: 3px;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.card-primary .card-header {
  background-color: #007bff;
  border-color: #007bff;
}

.template-preview-area {
  position: relative;
  border: 1px dashed #6c757d !important;
  background-color: #f8f9fa;
  user-select: none;
  margin-left: auto;
  margin-right: auto;
  width: 55vw;
  max-width: 800px;
}

.template-preview-area img {
  width: 100%;
  height: auto;
  display: block;
  pointer-events: none;
}
</style>
