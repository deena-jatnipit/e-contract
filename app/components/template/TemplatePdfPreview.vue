<template>
  <div class="card card-primary">
    <div class="card-header">
      <h3 class="card-title">PDF Preview</h3>
      <div class="card-tools">
        <button type="submit" class="btn btn-success" @click="saveTemplate">
          <i class="fas fa-save"></i> Save Template
        </button>
      </div>
    </div>
    <div class="card-body p-3">
      <div v-if="pdfDoc" class="page-selector mb-3">
        <label class="form-label">Select page to add fields:</label>
        <select
          class="form-select form-select-sm"
          v-model="currentPage"
          @change="renderPage"
        >
          <option v-for="pageNum in totalPages" :key="pageNum" :value="pageNum">
            Page {{ pageNum }}
          </option>
        </select>
      </div>

      <div
        id="pdf-container"
        ref="pdfContainer"
        class="template-preview-area"
        @mouseup="stopDrag"
        @mousemove="drag"
        @mouseleave="stopDrag"
      >
        <div
          v-if="!pdfDoc"
          class="d-flex align-items-center justify-content-center"
          style="min-height: 400px"
        >
          <div class="text-center text-muted">
            <i class="fas fa-file-pdf fa-3x mb-3"></i>
            <p>Please upload a PDF file to start creating your template.</p>
          </div>
        </div>

        <div v-else id="pdf-viewer" class="pdf-viewer">
          <div class="loading" v-show="isLoading">Loading PDF page...</div>
          <!-- PDF pages will be rendered here -->
        </div>

        <div
          v-for="field in placedFields.filter(
            (f) => f.pageNumber === currentPage
          )"
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

const emit = defineEmits(["field-selected", "pdf-loaded", "template-saved"]);

const pdfContainer = ref(null);
const pdfDoc = ref(null);
const currentPage = ref(1);
const totalPages = ref(0);
const isLoading = ref(false);
const pdfPages = ref([]);
const originalPdfBytes = ref(null);

const activeDrag = ref({
  isDragging: false,
  field: null,
  offsetX: 0,
  offsetY: 0,
  startX: 0,
  startY: 0,
});

// Load PDF.js
onMounted(async () => {
  // Load PDF.js library
  if (typeof window !== "undefined" && !window.pdfjsLib) {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    document.head.appendChild(script);

    await new Promise((resolve) => {
      script.onload = resolve;
    });

    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
});

// Watch for PDF file changes
watch(
  () => props.pdfFile,
  (newFile) => {
    if (newFile) {
      loadPDF(newFile);
    }
  },
  { immediate: true }
);

async function loadPDF(file) {
  if (!file || !window.pdfjsLib) return;

  isLoading.value = true;

  try {
    const fileReader = new FileReader();

    fileReader.onload = async function (e) {
      try {
        const arrayBuffer = e.target.result;
        originalPdfBytes.value = new Uint8Array(arrayBuffer);

        const pdfJsBuffer = arrayBuffer.slice();
        pdfDoc.value = await window.pdfjsLib.getDocument(pdfJsBuffer).promise;
        totalPages.value = pdfDoc.value.numPages;
        currentPage.value = 1;

        await renderPage(1);
        emit("pdf-loaded");
      } catch (error) {
        console.error("PDF loading error:", error);
        alert("Unable to load PDF file");
      } finally {
        isLoading.value = false;
      }
    };

    fileReader.onerror = function () {
      alert("Unable to read PDF file");
      isLoading.value = false;
    };

    fileReader.readAsArrayBuffer(file);
  } catch (error) {
    console.error("Error loading PDF:", error);
    isLoading.value = false;
  }
}

async function renderPage(pageNum = currentPage.value) {
  if (!pdfDoc.value || !pdfContainer.value) return;

  isLoading.value = true;

  try {
    // Clear existing pages
    const pdfViewer = pdfContainer.value.querySelector("#pdf-viewer");
    if (pdfViewer) {
      const existingPages = pdfViewer.querySelectorAll(".pdf-page");
      existingPages.forEach((page) => page.remove());
    }

    const page = await pdfDoc.value.getPage(pageNum);
    const scale = 1.5;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.className = "pdf-page-canvas";

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    const pageContainer = document.createElement("div");
    pageContainer.className = "pdf-page";
    pageContainer.appendChild(canvas);

    if (pdfViewer) {
      pdfViewer.insertBefore(pageContainer, pdfViewer.firstChild);
    }

    // Store page information
    pdfPages.value[pageNum - 1] = {
      canvas: canvas,
      viewport: viewport,
      scale: scale,
    };

    currentPage.value = pageNum;
  } catch (error) {
    console.error("Error rendering PDF page:", error);
  } finally {
    isLoading.value = false;
  }
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
  if (!pdfContainer.value || !field) return;

  const coords = getEventCoordinates(event);
  const containerRect = pdfContainer.value.getBoundingClientRect();

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
    !pdfContainer.value
  ) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const coords = getEventCoordinates(event);
  const containerRect = pdfContainer.value.getBoundingClientRect();

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

async function saveTemplate() {
  try {
    if (!pdfDoc.value || !originalPdfBytes.value) {
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

    // For now, we'll save the PDF template data
    // You'll need to implement the actual PDF processing and saving logic
    const templateData = {
      name: templateName.trim(),
      contract_id: props.selectedContractId,
      is_pdf: true,
      total_pages: totalPages.value,
      placed_fields_data: props.placedFields.map((field) => ({
        ...field,
        pageNumber: field.pageNumber || 1,
      })),
      created_at: new Date().toISOString(),
    };

    // You'll need to implement the actual save logic here
    console.log("PDF Template data to save:", templateData);

    alert("PDF Template structure ready! (Implement actual save logic)");
    emit("template-saved", templateData);
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
.pdf-viewer {
  position: relative;
  width: 100%;
  min-height: 450px;
  max-height: 70vh;
  overflow-y: auto;
}

.pdf-page {
  position: relative;
  margin: 0 auto 1rem auto;
  display: block;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
  border: 1px solid #ddd;
}

.pdf-page canvas {
  width: 100%;
  height: auto;
  display: block;
}

.loading {
  text-align: center;
  padding: 50px;
  color: #6c757d;
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

@media (max-width: 820px) {
  .template-preview-area {
    width: 100% !important;
    margin: 0 !important;
  }
}

@media (max-width: 768px) {
  .card-body {
    padding: 1rem;
  }
}
</style>
