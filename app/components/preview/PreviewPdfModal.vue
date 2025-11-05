<template>
  <div
    class="modal fade"
    :id="modalId"
    tabindex="-1"
    role="dialog"
    :aria-labelledby="modalLabelId"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-xl" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h4 class="modal-title" :id="modalLabelId">
            Template Preview: {{ template?.name }}
          </h4>
          <button
            type="button"
            class="close"
            data-dismiss="modal"
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <!-- Page Selector (if multi-page) -->
          <div v-if="totalPages > 1" class="page-selector mb-3 text-center">
            <label class="form-label small mb-0 mr-2">Page:</label>
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

          <div
            id="preview-container"
            ref="previewContainer"
            class="template-preview-area"
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

            <!-- PDF Canvas -->
            <canvas
              v-show="pdfLoaded"
              ref="pdfCanvas"
              class="pdf-canvas"
            ></canvas>

            <!-- Render fields overlay with scaled positions (only for current page) -->
            <div
              v-for="field in currentPageFields"
              :key="field.instanceId"
              class="placed-field-preview"
              :class="{ 'signing-mode': isSigningMode }"
              :style="getScaledFieldStyle(field)"
            >
              <div
                class="field-content-preview"
                :class="{ 'signing-mode': isSigningMode }"
              >
                <template v-if="isSignatureField(field) && signatureImageUrl">
                  <img
                    :src="signatureImageUrl"
                    class="signature-preview-img"
                    :style="{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }"
                    alt="Signature"
                  />
                </template>
                <template v-else-if="getFieldValue(field)">
                  <span class="field-value-preview">{{
                    getFieldValue(field)
                  }}</span>
                </template>
                <template v-else>
                  <i v-if="field.icon" :class="field.icon"></i>
                  <span v-else-if="field.label" class="field-label-preview">{{
                    field.label
                  }}</span>
                </template>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  template: Object,
  displayFields: Array,
  pdfUrl: String,
  modalId: {
    type: String,
    default: "pdfPreviewModal",
  },
  modalLabelId: {
    type: String,
    default: "pdfPreviewModalLabel",
  },
  fieldValues: {
    type: Object,
    default: () => ({}),
  },
  signatureImageUrl: {
    type: String,
    default: null,
  },
  isSigningMode: {
    type: Boolean,
    default: false,
  },
});

const previewContainer = ref(null);
const pdfCanvas = ref(null);
const pdfLoaded = ref(false);
const pdfDoc = shallowRef(null);
const pdfjsLib = shallowRef(null);
const totalPages = ref(1);
const currentPage = ref(1);
const scale = ref(1.5);
const canvasScale = ref(1);
const DESIGN_WIDTH = 800; // The width used when designing field positions

// Computed: Filter fields for current page
const currentPageFields = computed(() => {
  if (!props.displayFields) return [];
  return props.displayFields.filter(
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
    console.error("[PdfPreviewModal] Error loading PDF.js:", error);
    throw new Error("Failed to load PDF library");
  }
};

// Load PDF
async function loadPdf() {
  if (!props.pdfUrl) return;

  try {
    pdfLoaded.value = false;

    // Initialize PDF.js
    const pdfjs = await initPdfJs();

    // Load PDF document
    const loadingTask = pdfjs.getDocument(props.pdfUrl);
    const loadedDoc = await loadingTask.promise;
    pdfDoc.value = loadedDoc;

    totalPages.value = loadedDoc.numPages;
    currentPage.value = 1;

    // Wait for DOM update
    await nextTick();

    // Render first page
    await renderCurrentPage();
    pdfLoaded.value = true;
  } catch (error) {
    console.error("[PdfPreviewModal] Error loading PDF:", error);
    alert("Error loading PDF: " + error.message);
    pdfLoaded.value = false;
  }
}

// Render current page
async function renderCurrentPage() {
  if (!pdfDoc.value || !pdfCanvas.value) return;

  try {
    const pageNumber = currentPage.value;
    const page = await pdfDoc.value.getPage(pageNumber);
    const canvas = pdfCanvas.value;
    const context = canvas.getContext("2d");

    const viewport = page.getViewport({ scale: scale.value });

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

    // Calculate scale after rendering
    await nextTick();
    calculateScale();

  } catch (error) {
    console.error("[PdfPreviewModal] Error rendering PDF page:", error);
  }
}

// Calculate scale factor based on canvas display size
function calculateScale() {
  if (!pdfCanvas.value || !previewContainer.value) return;

  const displayedWidth = pdfCanvas.value.clientWidth;
  canvasScale.value = displayedWidth / DESIGN_WIDTH;
}

// Get scaled field style based on current canvas size
function getScaledFieldStyle(field) {
  const scaleValue = canvasScale.value;

  // Calculate font size based on field height to maintain proportions
  const baseFontSize = field.height * 0.4; // 40% of field height
  const scaledFontSize = Math.max(8, baseFontSize * scaleValue); // Minimum 8px

  return {
    left: `${field.x * scaleValue}px`,
    top: `${field.y * scaleValue}px`,
    width: `${field.width * scaleValue}px`,
    height: `${field.height * scaleValue}px`,
    fontSize: `${scaledFontSize}px`,
    lineHeight: `${field.height * scaleValue}px`,
  };
}

// Helper function to get field value from fieldValues prop
function getFieldValue(field) {
  if (!props.fieldValues || !field.instanceId) {
    return null;
  }
  return props.fieldValues[field.instanceId] || null;
}

// Helper function to check if field is a signature field
function isSignatureField(field) {
  return field.type === "Signature" || field.id === "default-signature";
}

// Watch for pdfUrl changes
watch(
  () => props.pdfUrl,
  async (newUrl) => {
    if (newUrl) {
      await loadPdf();
    }
  }
);

// Recalculate scale on window resize
onMounted(() => {
  window.addEventListener("resize", calculateScale);

  // Load PDF and recalculate when modal is shown
  if (process.client) {
    $(`#${props.modalId}`).on("shown.bs.modal", async () => {
      if (props.pdfUrl && !pdfLoaded.value) {
        await loadPdf();
      }
      nextTick(() => {
        calculateScale();
      });
    });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", calculateScale);
  if (process.client) {
    $(`#${props.modalId}`).off("shown.bs.modal");
  }
});
</script>

<style scoped>
.gap-1 {
  gap: 0.25rem;
}

.badge {
  font-size: 0.75rem;
  padding: 0.25em 0.5em;
}

.d-flex.flex-wrap {
  align-items: center;
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

.pdf-canvas {
  width: 100%;
  height: auto;
  display: block;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
  background: white;
}

.placed-field-preview {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.3);
  border: 1px solid #ddd;
  pointer-events: none;
  transition: all 0.2s ease;
}

/* Signing mode styling - make fields invisible/transparent */
.placed-field-preview.signing-mode {
  background-color: transparent;
  border: none;
}

.field-content-preview {
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

/* Signing mode styling for field content */
.field-content-preview.signing-mode {
  background-color: transparent;
  padding: 0;
}

.field-label-preview {
  font-weight: bold;
  margin-left: 8px;
  font-size: 1em;
}

.field-value-preview {
  font-weight: bold;
  font-size: 1em;
  color: #000;
  text-align: center;
  word-break: break-word;
  max-width: 100%;
}

.signature-preview-img {
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  display: block;
}

.template-preview-area {
  position: relative;
  border: 1px dashed #6c757d !important;
  background-color: #f8f9fa;
  user-select: none;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  max-width: 800px;
}

.page-selector {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0.25rem;
}

/* Mobile specific adjustments */
@media (max-width: 820px) {
  .template-preview-area {
    max-width: 100%;
    border-left: none !important;
    border-right: none !important;
  }

  #preview-container {
    width: 100% !important;
    margin: 0 !important;
  }

  .pdf-canvas {
    width: 100% !important;
  }

  .placed-field-preview {
    transform-origin: top left;
  }
}
</style>
