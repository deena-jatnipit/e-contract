<template>
  <div class="container-fluid">
    <div class="row">
      <!-- Left Sidebar - Controls -->
      <div class="col-lg-2 col-md-4">
        <!-- Selected Template -->
        <div class="card card-primary">
          <div class="card-header">
            <h3 class="card-title">Create Template</h3>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label>Choose Contracts</label>
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
            <div class="form-group">
              <label for="newTemplateName">New Template Name</label>
              <input
                type="text"
                class="form-control"
                :class="{ 'is-invalid': templateNameError }"
                id="newTemplateName"
                v-model="newTemplateName"
                @input="validateTemplateName"
                placeholder="Enter name for new template"
                required
              />
              <div class="invalid-feedback" v-if="templateNameError">
                {{ templateNameError }}
              </div>
            </div>
          </div>
        </div>

        <!-- Upload Background -->
        <div class="card card-primary">
          <div class="card-header">
            <h3 class="card-title">Upload Background</h3>
          </div>
          <div class="card-body">
            <p class="small">
              Select an image or PDF to use as a template background.
            </p>
            <input
              type="file"
              @change="handleImageUpload"
              accept="image/*,application/pdf"
              class="form-control"
            />
          </div>
        </div>

        <!-- Available Fields -->
        <FieldList @field-added="addFieldToPreview" />
      </div>

      <!-- Center - Image Preview -->
      <div class="col-lg-9 col-md-8">
        <TemplateImagePreview
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

        <TemplatePdfPreview
          v-if="fileType === 'pdf'"
          :pdf-file="uploadedFile"
          :placed-fields="placedFields"
          :selected-field="selectedField"
          :new-template-name="newTemplateName"
          :selected-contract-id="selectedContractId"
          @field-selected="selectField"
          @pdf-loaded="onPdfLoad"
          @template-saved="handleTemplateSaved"
        />

        <!-- <div v-else class="card card-primary">
          <div class="card-header">
            <h3 class="card-title">Preview</h3>
          </div>
          <div class="card-body p-3">
            <div
              class="d-flex align-items-center justify-content-center"
              style="min-height: 400px"
            >
              <div class="text-center text-muted">
                <i class="fas fa-cloud-upload-alt fa-3x mb-3"></i>
                <h5>Upload a File to Get Started</h5>
                <p>
                  Please upload an image or PDF file to start creating your
                  template.
                </p>
              </div>
            </div>
          </div>
        </div> -->
      </div>

      <!-- Right Sidebar - Field Properties -->
      <div class="col-lg-1 col-md-12">
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
const supabase = useSupabaseClient();
const router = useRouter();
const hasChanges = ref(false);
const isSaving = ref(false);

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

async function fetchContracts() {
  try {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("is_active", true);
    if (error) {
      console.error("Error fetching contracts:", error);
    } else {
      contracts.value = data || [];
    }
  } catch (err) {
    console.error("Error fetching contracts:", err);
  }
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    uploadedFile.value = file;

    if (previewImageUrl.value) {
      URL.revokeObjectURL(previewImageUrl.value);
    }

    previewImageUrl.value = URL.createObjectURL(file);
  }
}

function addFieldToPreview(fieldToAdd) {
  if (!fieldToAdd) {
    console.warn("addFieldToPreview: fieldToAdd is null or undefined");
    return;
  }

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

function removeSelectedField() {
  if (!selectedField.value) return;

  const indexToRemove = placedFields.value.findIndex(
    (f) => f.instanceId === selectedField.value.instanceId
  );

  if (indexToRemove > -1) {
    placedFields.value.splice(indexToRemove, 1);
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
  // Find the field by instanceId and update its properties
  const fieldIndex = placedFields.value.findIndex(
    (field) => field.instanceId === data.instanceId
  );

  if (fieldIndex > -1) {
    Object.assign(placedFields.value[fieldIndex], data.updates);
  }
}

function handleFieldRemoval(instanceId) {
  const indexToRemove = placedFields.value.findIndex(
    (f) => f.instanceId === instanceId
  );

  if (indexToRemove > -1) {
    placedFields.value.splice(indexToRemove, 1);
    selectedField.value = null;
  }
}

function validateTemplateName() {
  const result = validateTemplateNameFormat(newTemplateName.value);
  templateNameError.value = result.isValid ? "" : result.message;
  return result.isValid;
}

function handleTemplateSaved() {
  if (!validateTemplateName()) {
    return;
  }
  isSaving.value = true;
  router.back();
}

// function detectFileType(file) {
//   if (!file) return null;

//   const fileName = file.name.toLowerCase();
//   const fileTypeFromMime = file.type.toLowerCase();

//   if (fileTypeFromMime.startsWith("image/")) {
//     return "image";
//   } else if (
//     fileTypeFromMime === "application/pdf" ||
//     fileName.endsWith(".pdf")
//   ) {
//     return "pdf";
//   }

//   // Fallback to file extension
//   const extension = fileName.split(".").pop();
//   if (["jpg", "jpeg", "png"].includes(extension)) {
//     return "image";
//   } else if (extension === "pdf") {
//     return "pdf";
//   }

//   return null;
// }

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

function handleBeforeUnload(e) {
  if (hasChanges.value) {
    e.preventDefault();
    e.returnValue = "";
  }
}

watch(
  [newTemplateName, placedFields, uploadedFile],
  () => {
    hasChanges.value = true;
  },
  { deep: true }
);

onBeforeRouteLeave((to, from, next) => {
  if (isSaving.value || !hasChanges.value) {
    next();
    return;
  }

  if (
    window.confirm(
      "คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่?"
    )
  ) {
    next();
  } else {
    next(false);
  }
});

watch(
  selectedField,
  (newField) => {
    if (newField && typeof newField === "object") {
      // Ensure all required properties exist with default values
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
@media (max-width: 820px) {
  #preview-container {
    width: 100% !important;
    margin: 0 !important;
  }

  #preview-container img {
    width: 100% !important;
  }

  .col-lg-3 {
    margin-bottom: 1rem;
  }
}

@media (max-width: 768px) {
  .container-fluid {
    padding-left: 15px;
    padding-right: 15px;
  }

  .card-body {
    padding: 1rem;
  }

  .form-control-sm {
    font-size: 0.875rem;
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

.badge-info {
  background-color: #17a2b8;
  color: white;
  font-size: 0.6rem;
  padding: 2px 5px;
  border-radius: 3px;
}

/* Card improvements */
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.card-primary .card-header {
  background-color: #007bff;
  border-color: #007bff;
}

.card-secondary .card-header {
  background-color: #6c757d;
  border-color: #6c757d;
}

.card-info .card-header {
  background-color: #17a2b8;
  border-color: #17a2b8;
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
