<template>
  <div class="container-fluid">
    <div class="row">
      <!-- Left Sidebar - Controls -->
      <div class="col-lg-2 col-md-4">
        <!-- Selected Template -->
        <div class="card card-primary">
          <div class="card-header">
            <h3 class="card-title">Edit Template</h3>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label for="currentTemplateName">Template Name</label>
              <input
                type="text"
                class="form-control"
                :class="{ 'is-invalid': templateNameError }"
                id="currentTemplateName"
                v-model="currentTemplateName"
                @input="validateTemplateName"
                placeholder="Enter name for a template"
                required
              />
              <div class="invalid-feedback" v-if="templateNameError">
                {{ templateNameError }}
              </div>
            </div>
          </div>
        </div>

        <!-- Available Fields -->
        <FieldList @field-added="addFieldToPreview" />
      </div>

      <!-- Center - Preview -->
      <div class="col-lg-8 col-md-8">
        <TemplateImageEdit
          v-if="fileType === 'image' && previewImageUrl"
          :preview-image-url="previewImageUrl"
          :placed-fields="placedFields"
          :selected-field="selectedField"
          :template-name="currentTemplateName"
          :selected-contract-id="selectedContractId"
          :template-id="selectedTemplateId"
          :original-composite-url="originalCompositeUrl"
          @field-selected="selectField"
          @image-loaded="onImageLoad"
          @template-saved="handleTemplateSaved"
        />

        <TemplatePdfEdit
          v-else-if="fileType === 'pdf' && pdfBytes"
          :pdf-bytes="pdfBytes"
          :original-pdf-bytes="originalPdfBytes"
          :placed-fields="placedFields"
          :selected-field="selectedField"
          :template-name="currentTemplateName"
          :selected-contract-id="selectedContractId"
          :template-id="selectedTemplateId"
          :original-composite-url="originalCompositeUrl"
          :image-width="imageWidth"
          :image-height="imageHeight"
          @field-selected="selectField"
          @pdf-loaded="onPdfLoad"
          @template-saved="handleTemplateSaved"
          @current-page-changed="handlePdfPageChange"
        />

        <div v-else class="card card-primary">
          <div class="card-header">
            <h3 class="card-title">Preview</h3>
          </div>
          <div class="card-body p-3">
            <div
              class="d-flex align-items-center justify-content-center"
              style="min-height: 400px"
            >
              <div class="text-center text-muted">
                <i class="fas fa-spinner fa-spin fa-3x mb-3"></i>
                <h5>Loading Template...</h5>
                <p>Please wait while we load your template.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar - Field Properties -->
      <div class="col-lg-2 col-md-12">
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
definePageMeta({ layout: "template", pageTitle: "Edit Template" });

const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();

const selectedTemplateId = computed(() => route.query.id || null);
const hasChanges = ref(false);
const isSaving = ref(false);
const templateNameError = ref("");

// Template data
const currentTemplateName = ref("");
const previewImageUrl = ref(null);
const placedFields = ref([]);
const selectedField = ref(null);
const selectedContractId = ref(null);
const imageLoaded = ref(false);

// Available fields from database for merging
const availableFields = ref([]);

// File handling
const fileType = ref(null); // 'image' or 'pdf'
const pdfBytes = ref(null);
const originalPdfBytes = ref(null);
const imageWidth = ref(0);
const imageHeight = ref(0);
const currentPdfPage = ref(1);

// URLs for cleanup
const originalCompositeUrl = ref(null);

async function fetchTemplateAndFields() {
  if (!selectedTemplateId.value) {
    console.error("No template ID provided");
    return;
  }

  try {
    // First fetch contract fields for merging
    const { data: allFieldsData, error: fieldsError } = await supabase
      .from("contract_fields")
      .select("*")
      .order("id");

    if (fieldsError) {
      console.error("Error fetching fields:", fieldsError);
    } else {
      availableFields.value = allFieldsData || [];
    }

    // Then fetch template
    const { data: templateData, error: templateError } = await supabase
      .from("contract_templates")
      .select("*")
      .eq("id", selectedTemplateId.value)
      .single();

    if (templateError) {
      console.error("Error fetching template:", templateError);
      alert("Error loading template: " + templateError.message);
      return;
    }

    // Load template data
    currentTemplateName.value = templateData.name;
    selectedContractId.value = templateData.contract_id;
    fileType.value = templateData.file_type || "image";
    imageWidth.value = templateData.image_width || 0;
    imageHeight.value = templateData.image_height || 0;

    // Store original composite URL for deletion later
    originalCompositeUrl.value = templateData.composite_image_url;

    // Load background file based on type
    if (fileType.value === "pdf") {
      if (templateData.background_image_url) {
        try {
          const response = await fetch(templateData.background_image_url);
          const arrayBuffer = await response.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);

          // Store two separate copies
          pdfBytes.value = new Uint8Array(bytes); // For PDF.js rendering
          originalPdfBytes.value = new Uint8Array(bytes); // For saving (won't be detached)
        } catch (error) {
          console.error("Error loading PDF:", error);
          alert("Error loading PDF file: " + error.message);
        }
      }
    } else {
      // Load image
      previewImageUrl.value = templateData.background_image_url;
    }

    // Load placed fields and merge with available fields
    const fieldsData = Array.isArray(templateData.placed_fields_data)
      ? templateData.placed_fields_data
      : [];

    placedFields.value = fieldsData.map((field) => {
      // Merge with availableFields if possible
      let mergedField = { ...field };

      if (typeof field.id === "number") {
        const availableField = availableFields.value.find(
          (af) => af.id === field.id
        );
        if (availableField) {
          mergedField = { ...availableField, ...field };
        }
      }

      return {
        ...mergedField,
        instanceId:
          field.instanceId ||
          `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        x: Number(field.x) || 50,
        y: Number(field.y) || 50,
        width: Number(field.width) || 150,
        height: Number(field.height) || 40,
        label: mergedField.name === "Check Mark" ? "" : mergedField.label || "",
        pageNumber: field.pageNumber || 1,
      };
    });

    selectedField.value = null;
  } catch (error) {
    console.error("Error in fetchTemplateAndFields:", error);
    alert("Error loading template data: " + error.message);
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
      pageNumber: currentPdfPage.value,
    };

    placedFields.value.push(newFieldInstance);

    if (i === amount - 1) {
      selectedField.value = newFieldInstance;
    }
  }

  hasChanges.value = true;
}

function selectField(field) {
  selectedField.value = field;
}

function onImageLoad() {
  imageLoaded.value = true;
}

function onPdfLoad() {
  imageLoaded.value = true;
}

function handlePdfPageChange(pageNumber) {
  currentPdfPage.value = pageNumber;
}

function removeSelectedField() {
  if (!selectedField.value) return;

  const indexToRemove = placedFields.value.findIndex(
    (f) => f.instanceId === selectedField.value.instanceId
  );

  if (indexToRemove > -1) {
    placedFields.value.splice(indexToRemove, 1);
    selectedField.value = null;
    hasChanges.value = true;
  }
}

function handleKeyDown(event) {
  if (!selectedField.value) return;

  const step = event.shiftKey ? 10 : 1;

  switch (event.key) {
    case "ArrowUp":
      event.preventDefault();
      selectedField.value.y = Math.max(0, (selectedField.value.y || 0) - step);
      hasChanges.value = true;
      break;
    case "ArrowDown":
      event.preventDefault();
      selectedField.value.y = (selectedField.value.y || 0) + step;
      hasChanges.value = true;
      break;
    case "ArrowLeft":
      event.preventDefault();
      selectedField.value.x = Math.max(0, (selectedField.value.x || 0) - step);
      hasChanges.value = true;
      break;
    case "ArrowRight":
      event.preventDefault();
      selectedField.value.x = (selectedField.value.x || 0) + step;
      hasChanges.value = true;
      break;
    case "Delete":
      event.preventDefault();
      removeSelectedField();
      break;
  }
}

function handleFieldUpdate(data) {
  const fieldIndex = placedFields.value.findIndex(
    (field) => field.instanceId === data.instanceId
  );

  if (fieldIndex > -1) {
    Object.assign(placedFields.value[fieldIndex], data.updates);
    hasChanges.value = true;
  }
}

function handleFieldRemoval(instanceId) {
  const indexToRemove = placedFields.value.findIndex(
    (f) => f.instanceId === instanceId
  );

  if (indexToRemove > -1) {
    placedFields.value.splice(indexToRemove, 1);
    selectedField.value = null;
    hasChanges.value = true;
  }
}

function validateTemplateName() {
  const result = validateTemplateNameFormat(currentTemplateName.value);
  templateNameError.value = result.isValid ? "" : result.message;
  return result.isValid;
}

function handleTemplateSaved() {
  if (!validateTemplateName()) {
    return;
  }
  isSaving.value = true;
  hasChanges.value = false;
  router.back();
}

function handleBeforeUnload(e) {
  if (hasChanges.value && !isSaving.value) {
    e.preventDefault();
    e.returnValue = "";
  }
}

onMounted(async () => {
  await fetchTemplateAndFields();
  document.addEventListener("keydown", handleKeyDown);
  window.addEventListener("beforeunload", handleBeforeUnload);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("beforeunload", handleBeforeUnload);
  if (previewImageUrl.value && previewImageUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(previewImageUrl.value);
  }
});

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
  [currentTemplateName, placedFields],
  () => {
    hasChanges.value = true;
  },
  { deep: true }
);

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
@media (max-width: 820px) {
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

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.card-primary .card-header {
  background-color: #007bff;
  border-color: #007bff;
}
</style>
