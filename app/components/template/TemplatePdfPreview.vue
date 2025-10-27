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
        id="pdf-preview-container"
        ref="previewContainer"
        class="template-preview-area"
        @mouseup="stopDrag"
        @mousemove="drag"
        @mouseleave="stopDrag"
      >
        <!-- PDF Page Container -->
        <div
          id="pdf-page-container"
          ref="pdfPageContainer"
          class="pdf-page-container"
        >
          <!-- Loading State -->
          <div
            v-if="!pdfLoaded"
            class="d-flex align-items-center justify-content-center"
            style="min-height: 400px"
          >
            <div class="text-center text-muted">
              <i class="fas fa-file-pdf fa-3x mb-3"></i>
              <p>Loading PDF...</p>
            </div>
          </div>

          <!-- PDF Canvas will be inserted here -->
          <canvas
            v-show="pdfLoaded"
            ref="pdfCanvas"
            class="pdf-page-canvas"
          ></canvas>
        </div>

        <!-- Placed Fields Overlay -->
        <div
          v-for="field in placedFieldsOnCurrentPage"
          :key="field.instanceId"
          class="placed-field"
          :class="{
            'field-selected': selectedField?.instanceId === field.instanceId,
          }"
          :style="{
            left: field.x + 'px',
            top: field.y + 'px',
            width: field.width + 'px',
            height: field.height + 'px',
          }"
          @mousedown="startDrag($event, field)"
          @touchstart="startDrag($event, field)"
          @click="selectField(field)"
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
            <span v-if="field.isGrouped" class="instance-number">
              #{{ field.instanceNumber }}
            </span>
          </div>
        </div>

        <!-- Page Selector -->
        <div v-if="pdfLoaded && totalPages > 1" class="page-selector mb-2">
          <label class="form-label small">Page:</label>
          <select
            class="form-select form-select-sm d-inline-block w-auto"
            v-model="currentPage"
            @change="renderCurrentPage"
          >
            <option v-for="i in totalPages" :key="i" :value="i">
              Page {{ i }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();

const props = defineProps({
  pdfFile: {
    type: File,
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
});

const emit = defineEmits([
  "field-selected",
  "pdf-loaded",
  "template-saved",
  "current-page-changed",
]);

// Refs
const previewContainer = ref(null);
const pdfPageContainer = ref(null);
const pdfCanvas = ref(null);

// PDF State - Using shallowRef to avoid Vue reactivity issues
const pdfLoaded = ref(false);
const pdfDoc = shallowRef(null);
const pdfjsLib = shallowRef(null);
const totalPages = ref(1);
const currentPage = ref(1);
const pdfBytes = ref(null);

// Drag State
const activeDrag = ref({
  isDragging: false,
  field: null,
  offsetX: 0,
  offsetY: 0,
  startX: 0,
  startY: 0,
});

// Computed
const placedFieldsOnCurrentPage = computed(() => {
  return props.placedFields.filter(
    (field) => !field.pageNumber || field.pageNumber === currentPage.value
  );
});

// Initialize PDF.js
const initPdfJs = async () => {
  if (pdfjsLib.value) return pdfjsLib.value;

  try {
    const pdfjs = await import("pdfjs-dist");

    if (process.client) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    }

    pdfjsLib.value = pdfjs;
    return pdfjs;
  } catch (error) {
    console.error("Error loading PDF.js:", error);
    throw new Error("Failed to load PDF library");
  }
};

// Load PDF
async function loadPdf() {
  if (!props.pdfFile) {
    return;
  }

  try {
    pdfLoaded.value = false;

    if (!pdfPageContainer.value) {
      throw new Error("PDF container not found in DOM");
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await props.pdfFile.arrayBuffer();
    pdfBytes.value = new Uint8Array(arrayBuffer);

    // Initialize PDF.js
    const pdfjs = await initPdfJs();

    // Load PDF document
    const loadingTask = pdfjs.getDocument({
      data: pdfBytes.value,
      cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
      cMapPacked: true,
    });

    const loadedDoc = await loadingTask.promise;
    pdfDoc.value = loadedDoc;

    totalPages.value = loadedDoc.numPages;
    currentPage.value = 1;

    // Wait for DOM update
    await nextTick();

    // Small delay to ensure canvas is ready
    setTimeout(async () => {
      await renderCurrentPage();
      pdfLoaded.value = true;
      emit("pdf-loaded");
    }, 100);
  } catch (error) {
    alert("Error loading PDF: " + error.message);
    pdfLoaded.value = false;
  }
}

// Render current page
async function renderCurrentPage() {
  if (!pdfDoc.value || !pdfCanvas.value) {
    return;
  }

  try {
    const pageNumber = currentPage.value;
    const page = await pdfDoc.value.getPage(pageNumber);
    const canvas = pdfCanvas.value;
    const context = canvas.getContext("2d");

    const scale = 1.5;
    const viewport = page.getViewport({ scale });

    // Set canvas dimensions
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    // Render the page
    await page.render(renderContext).promise;

    // Emit page change after successful render
    emit("current-page-changed", pageNumber);
  } catch (error) {
    alert("Error rendering PDF page: " + error.message);
  }
}

// Field selection
function selectField(field) {
  emit("field-selected", field);
}

// Get event coordinates (mouse or touch)
function getEventCoordinates(event) {
  if (event.touches && event.touches.length > 0) {
    return {
      clientX: event.touches[0].clientX,
      clientY: event.touches[0].clientY,
    };
  }
  return { clientX: event.clientX, clientY: event.clientY };
}

// Start dragging field
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

// Drag field
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

// Stop dragging
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

// Save images to storage
async function saveImagesToStorage(templateName, compositePdfBytes) {
  const timestamp = Date.now();

  // Save original PDF
  const fileExtension = props.pdfFile.name.split(".").pop();
  const originalFileName = `${templateName}_${timestamp}.${fileExtension}`;
  const originalFilePath = `templates/${originalFileName}`;

  const { error: uploadError1 } = await supabase.storage
    .from("template-images")
    .upload(originalFilePath, props.pdfFile, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError1) {
    throw new Error("Error uploading original PDF: " + uploadError1.message);
  }

  const { data: publicUrlData1 } = supabase.storage
    .from("template-images")
    .getPublicUrl(originalFilePath);

  // Save composite PDF
  const compositeFileName = `${templateName}_${timestamp}_composite.pdf`;
  const compositeFilePath = `composites/${compositeFileName}`;

  const compositeBlob = new Blob([compositePdfBytes], {
    type: "application/pdf",
  });

  const { error: uploadError2 } = await supabase.storage
    .from("template-images")
    .upload(compositeFilePath, compositeBlob, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError2) {
    throw new Error("Error uploading composite PDF: " + uploadError2.message);
  }

  const { data: publicUrlData2 } = supabase.storage
    .from("template-images")
    .getPublicUrl(compositeFilePath);

  return {
    originalImageUrl: publicUrlData1.publicUrl,
    compositeImageUrl: publicUrlData2.publicUrl,
  };
}

// Save template
async function saveTemplate() {
  try {
    if (!props.pdfFile) {
      alert("Please upload a PDF file first");
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

    // Generate composite PDF using your existing composable
    const { generateCompositePdf } = usePdfOperations();
    const compositePdfBytes = await generateCompositePdf(
      pdfBytes.value,
      props.placedFields,
      currentPage.value
    );

    if (!compositePdfBytes) {
      alert("Failed to generate composite PDF");
      return;
    }

    const { originalImageUrl, compositeImageUrl } = await saveImagesToStorage(
      templateName,
      compositePdfBytes
    );

    // Get PDF dimensions from the rendered canvas
    const canvas = pdfCanvas.value;
    const imageWidth = canvas ? canvas.width : 800;
    const imageHeight = canvas ? canvas.height : 600;

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
      pageNumber: field.pageNumber || currentPage.value,
    }));

    const templateData = {
      name: templateName.trim(),
      contract_id: props.selectedContractId,
      background_image_url: originalImageUrl,
      composite_image_url: compositeImageUrl,
      image_width: imageWidth,
      image_height: imageHeight,
      placed_fields_data: normalizedFields,
      created_at: new Date().toISOString(),
      file_type: "pdf",
    };

    const { data, error } = await supabase
      .from("contract_templates")
      .insert(templateData)
      .select()
      .single();

    if (error) {
      alert("Error saving template: " + error.message);
      return;
    }

    alert("Template and PDF saved successfully!");

    emit("template-saved", data);
  } catch (error) {
    alert("Error saving template: " + error.message);
  }
}

// Watch for PDF file changes
watch(
  () => props.pdfFile,
  async (newFile) => {
    if (newFile) {
      await nextTick();
      await loadPdf();
    }
  },
  { immediate: true }
);

// Watch for page changes and emit to parent
watch(currentPage, (newPage) => {
  emit("current-page-changed", newPage);
});

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDrag);
  document.removeEventListener("touchmove", drag);
  document.removeEventListener("touchend", stopDrag);
});
</script>

<style scoped>
@media (max-width: 820px) {
  #pdf-preview-container {
    width: 100% !important;
    margin: 0 !important;
  }
}

@media (max-width: 768px) {
  .card-body {
    padding: 1rem;
  }
}

#pdf-preview-container {
  background-image:
    linear-gradient(45deg, #eee 25%, transparent 25%),
    linear-gradient(-45deg, #eee 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #eee 75%),
    linear-gradient(-45deg, transparent 75%, #eee 75%);
  background-size: 20px 20px;
  min-height: 400px;
  position: relative;
}

.pdf-page-container {
  position: relative;
  width: 100%;
  margin: 0 auto;
}

.pdf-page-canvas {
  width: 100%;
  height: auto;
  display: block;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
  border: 1px solid #ddd;
  background: white;
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

.field-name {
  color: #333;
  font-size: 0.75rem;
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

.page-selector {
  text-align: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}
</style>
