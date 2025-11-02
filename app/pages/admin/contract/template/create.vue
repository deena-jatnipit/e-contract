<template>
  <div class="container-fluid">
    <!-- Template Info Section -->
    <div class="card template-info-card shadow-sm mb-3">
      <div class="card-body p-3">
        <div class="row">
          <div class="col-md-6">
            <label class="form-label font-weight-600">Template Name</label>
            <input
              type="text"
              class="form-control"
              :class="{ 'is-invalid': templateNameError }"
              v-model="newTemplateName"
              @input="validateTemplateName"
              placeholder="Enter template name"
            />
            <div class="invalid-feedback" v-if="templateNameError">
              {{ templateNameError }}
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label font-weight-600">Contract</label>
            <select class="form-control" v-model="selectedContractId">
              <option hidden :value="null">-- Choose Contract --</option>
              <option
                v-for="contract in contracts"
                :key="contract.id"
                :value="contract.id"
              >
                {{ contract.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- Left Sidebar -->
      <div class="col-lg-2 col-md-3">
        <!-- Upload -->
        <div class="card shadow-sm mb-3">
          <div class="card-header bg-primary">
            <i class="fas fa-cloud-upload-alt mr-2"></i>Upload Background
          </div>
          <div class="card-body p-2">
            <div
              class="upload-area"
              :class="{ dragging: isDragging }"
              @click="triggerFileInput"
              @drop.prevent="handleFileDrop"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
            >
              <i class="fas fa-cloud-upload-alt"></i>
              <span>Click or drop file</span>
              <small>Image or PDF</small>
            </div>
            <input
              ref="fileInput"
              type="file"
              @change="handleImageUpload"
              accept="image/*,application/pdf"
              style="display: none"
            />
          </div>
        </div>

        <!-- Fields -->
        <FieldList @field-added="addFieldToPreview" />
      </div>

      <!-- Center - Preview -->
      <div class="col-lg-8 col-md-6">
        <TemplateImageCreate
          v-if="fileType === 'image' && previewImageUrl"
          :preview-image-url="previewImageUrl"
          :placed-fields="placedFields"
          :selected-field="selectedField"
          :new-template-name="newTemplateName"
          :selected-contract-id="selectedContractId"
          :original-file="uploadedFile"
          @field-selected="selectField"
          @image-loaded="onImageLoad"
          @template-saved="handleTemplateSaved"
        />

        <TemplatePdfCreate
          v-else-if="fileType === 'pdf' && uploadedFile"
          :pdf-file="uploadedFile"
          :placed-fields="placedFields"
          :selected-field="selectedField"
          :new-template-name="newTemplateName"
          :selected-contract-id="selectedContractId"
          @field-selected="selectField"
          @pdf-loaded="onImageLoad"
          @template-saved="handleTemplateSaved"
          @current-page-changed="handlePdfPageChange"
        />

        <div v-else class="card shadow-sm">
          <div class="card-body text-center py-5">
            <i class="fas fa-image fa-3x text-muted mb-3"></i>
            <p class="text-muted mb-0">Upload a file to start</p>
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="col-lg-2 col-md-3">
        <FieldProperties
          v-if="selectedField"
          :selectedField="selectedField"
          @field-updated="handleFieldUpdate"
          @field-removed="handleFieldRemoval"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "template",
  pageTitle: "Create Template",
});

const supabase = useSupabaseClient();
const router = useRouter();
const hasChanges = ref(false);
const isSaving = ref(false);
const isDragging = ref(false);
const fileInput = ref(null);

const newTemplateName = ref("");
const templateNameError = ref("");
const previewImageUrl = ref(null);
const placedFields = ref([]);
const selectedField = ref(null);
const contracts = ref([]);
const selectedContractId = ref(null);
const imageLoaded = ref(false);
const uploadedFile = ref(null);
const fileType = ref(null);
const currentPdfPage = ref(1);

async function fetchContracts() {
  try {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("is_active", true);
    if (!error) {
      contracts.value = data || [];
    }
  } catch (err) {
    console.error(err);
  }
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) processFile(file);
}

function handleFileDrop(event) {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (file) processFile(file);
}

function processFile(file) {
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    alert("File size too large. Max 50MB.");
    return;
  }

  const fileName = file.name.toLowerCase();
  const fileTypeFromMime = file.type.toLowerCase();
  const fileExtension = fileName.split(".").pop();
  const validImageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
  const validExtensions = [...validImageExtensions, "pdf"];

  if (!validExtensions.includes(fileExtension)) {
    alert("Invalid file type. Upload image or PDF.");
    return;
  }

  if (previewImageUrl.value) {
    URL.revokeObjectURL(previewImageUrl.value);
    previewImageUrl.value = null;
  }

  placedFields.value = [];
  selectedField.value = null;
  currentPdfPage.value = 1;
  uploadedFile.value = file;

  if (
    fileTypeFromMime.startsWith("image/") ||
    validImageExtensions.includes(fileExtension)
  ) {
    fileType.value = "image";
    previewImageUrl.value = URL.createObjectURL(file);
  } else if (
    fileTypeFromMime === "application/pdf" ||
    fileExtension === "pdf"
  ) {
    fileType.value = "pdf";
  }
}

function addFieldToPreview(fieldToAdd) {
  if (!fieldToAdd) return;

  const amount = fieldToAdd.amount || 1;
  const groupId = amount > 1 ? `group_${fieldToAdd.id}_${Date.now()}` : null;

  for (let i = 0; i < amount; i++) {
    const newFieldInstance = {
      ...fieldToAdd,
      instanceId: `field_${fieldToAdd.id}_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
      instanceNumber: i + 1,
      groupId: groupId,
      isGrouped: amount > 1,
      groupSize: amount,
      groupPosition: i,
      x: 50 + i * 40,
      y: 50,
      width: fieldToAdd.default_width || 150,
      height: fieldToAdd.default_height || 40,
      label: fieldToAdd.name === "Check Mark" ? "" : fieldToAdd.label,
      pageNumber: currentPdfPage.value,
    };

    placedFields.value.push(newFieldInstance);
    if (i === amount - 1) {
      selectedField.value = newFieldInstance;
    }
  }
}

function selectField(field) {
  selectedField.value = field;
}

function onImageLoad() {
  imageLoaded.value = true;
}

function handlePdfPageChange(pageNumber) {
  currentPdfPage.value = pageNumber;
}

function removeSelectedField() {
  if (!selectedField.value) return;
  const idx = placedFields.value.findIndex(
    (f) => f.instanceId === selectedField.value.instanceId
  );
  if (idx > -1) {
    placedFields.value.splice(idx, 1);
    selectedField.value = null;
  }
}

function handleKeyDown(event) {
  if (!selectedField.value) return;
  const step = event.shiftKey ? 10 : 1;

  switch (event.key) {
    case "ArrowUp":
      event.preventDefault();
      selectedField.value.y = Math.max(0, (selectedField.value.y || 0) - step);
      break;
    case "ArrowDown":
      event.preventDefault();
      selectedField.value.y = (selectedField.value.y || 0) + step;
      break;
    case "ArrowLeft":
      event.preventDefault();
      selectedField.value.x = Math.max(0, (selectedField.value.x || 0) - step);
      break;
    case "ArrowRight":
      event.preventDefault();
      selectedField.value.x = (selectedField.value.x || 0) + step;
      break;
    case "Delete":
      event.preventDefault();
      removeSelectedField();
      break;
  }
}

function handleFieldUpdate(data) {
  const idx = placedFields.value.findIndex(
    (field) => field.instanceId === data.instanceId
  );
  if (idx > -1) {
    Object.assign(placedFields.value[idx], data.updates);
  }
}

function handleFieldRemoval(instanceId) {
  const idx = placedFields.value.findIndex((f) => f.instanceId === instanceId);
  if (idx > -1) {
    placedFields.value.splice(idx, 1);
    selectedField.value = null;
  }
}

function validateTemplateName() {
  const result = validateTemplateNameFormat(newTemplateName.value);
  templateNameError.value = result.isValid ? "" : result.message;
  return result.isValid;
}

function handleTemplateSaved() {
  if (!validateTemplateName()) return;
  isSaving.value = true;
  router.back();
}

function handleBeforeUnload(e) {
  if (hasChanges.value) {
    e.preventDefault();
    e.returnValue = "";
  }
}

onMounted(async () => {
  await fetchContracts();
  document.addEventListener("keydown", handleKeyDown);
  window.addEventListener("beforeunload", handleBeforeUnload);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("beforeunload", handleBeforeUnload);
  if (previewImageUrl.value) {
    URL.revokeObjectURL(previewImageUrl.value);
  }
});

watch([newTemplateName, placedFields, uploadedFile], () => {
  hasChanges.value = true;
});

watch(
  selectedField,
  (newField) => {
    if (newField && typeof newField === "object") {
      if (typeof newField.x !== "number") newField.x = 50;
      if (typeof newField.y !== "number") newField.y = 50;
      if (typeof newField.width !== "number") newField.width = 150;
      if (typeof newField.height !== "number") newField.height = 40;
      if (typeof newField.label !== "string") newField.label = "";
      if (!newField.instanceId)
        newField.instanceId = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  },
  { deep: true }
);
</script>

<style scoped>
/* Card Enhancements */
.card {
  border: none;
  border-radius: 10px;
  overflow: hidden;
}

.shadow-sm {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
}

.card-header {
  border-bottom: 1px solid #dee2e6;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Form Styling */
.form-label {
  font-size: 0.875rem;
  color: #495057;
  margin-bottom: 0.5rem;
}

.font-weight-600 {
  font-weight: 600;
}

.form-control {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-control:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.15);
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  font-size: 0.8rem;
  color: #dc3545;
  margin-top: 0.25rem;
}

/* Upload Area */
.upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 2rem 1rem;
  text-align: center;
  cursor: pointer;
  background: #f8f9fa;
  transition: all 0.2s ease;
}

.upload-area:hover {
  border-color: #007bff;
  background: #e7f3ff;
  transform: translateY(-1px);
}

.upload-area.dragging {
  border-color: #007bff;
  background: #cfe2ff;
  transform: scale(1.02);
}

.upload-area i {
  display: block;
  font-size: 2.5rem;
  color: #6c757d;
  margin-bottom: 0.75rem;
}

.upload-area span {
  display: block;
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.upload-area small {
  display: block;
  color: #6c757d;
  font-size: 0.75rem;
}

/* Icon Spacing */
.mr-2 {
  margin-right: 0.5rem;
}

/* Empty State */
.text-center {
  text-align: center;
}

.text-muted {
  color: #6c757d !important;
}

.py-5 {
  padding-top: 3rem !important;
  padding-bottom: 3rem !important;
}

.mb-0 {
  margin-bottom: 0 !important;
}

.mb-3 {
  margin-bottom: 1rem !important;
}

.fa-3x {
  font-size: 3rem;
}
</style>
