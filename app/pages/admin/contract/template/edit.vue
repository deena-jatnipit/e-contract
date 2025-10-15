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

      <!-- Center - Image Preview -->
      <div class="col-lg-9 col-md-8">
        <div class="card card-primary">
          <div class="card-header">
            <h3 class="card-title">Preview</h3>
            <div class="card-tools">
              <button
                type="submit"
                class="btn btn-success"
                @click="saveTemplate"
              >
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
                  'field-selected':
                    selectedField?.instanceId === field.instanceId,
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
                  zIndex:
                    selectedField?.instanceId === field.instanceId ? 1000 : 1,
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
const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();

const selectedTemplateId = computed(() => route.query.id || null);
const hasChanges = ref(false);
const isSaving = ref(false);
const templateNameError = ref("");

const currentTemplateName = ref("");
const availableFields = ref([]);
const previewImageUrl = ref(null);
const placedFields = ref([]);
const previewContainer = ref(null);
const isLoadingTemplate = ref(false);
const templates = ref(null);
const selectedField = ref(null);
const selectedContractId = ref(null);
const imageNaturalWidth = ref(0);
const imageNaturalHeight = ref(0);
const originalImageUrls = ref({
  background: null,
  composite: null,
});

const activeDrag = ref({
  isDragging: false,
  field: null,
  offsetX: 0,
  offsetY: 0,
  startX: 0,
  startY: 0,
});

function extractFilePathFromUrl(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    // Remove empty parts and bucket name, keep the file path
    const relevantParts = pathParts.filter((part) => part);
    if (relevantParts.length >= 3) {
      // Remove 'storage', 'v1', 'object', 'public', bucket_name
      return relevantParts.slice(5).join("/");
    }
  } catch (error) {
    console.error("Error extracting file path from URL:", error);
  }
  return null;
}

async function deleteImages(imageUrls) {
  if (!imageUrls) return;
  console.log("Image URLs to delete:", imageUrls);

  let imagePaths = [];

  for (const url of Object.values(imageUrls)) {
    const path = extractFilePathFromUrl(url);
    if (path) imagePaths.push(path);
  }

  console.log("Deleting images:", imagePaths);

  try {
    const { error } = await supabase.storage
      .from("template-images")
      .remove(imagePaths);

    if (error) {
      console.error("Error deleting images:", error);
    } else {
      console.log("Successfully deleted images:", imagePaths);
    }
  } catch (error) {
    console.error("Error in deleteImages:", error);
  }
}

async function fetchTemplateAndFields() {
  if (!selectedTemplateId.value) {
    console.error("No template ID provided");
    return;
  }

  isLoadingTemplate.value = true;

  try {
    const [templateResponse, fieldsResponse] = await Promise.all([
      supabase
        .from("contract_templates")
        .select("*")
        .eq("id", selectedTemplateId.value)
        .single(),
      supabase.from("contract_fields").select("*").order("id"),
    ]);

    if (templateResponse.error) {
      console.error("Error fetching template:", templateResponse.error);
      alert("Error loading template: " + templateResponse.error.message);
      return;
    }

    if (fieldsResponse.error) {
      console.error("Error fetching fields:", fieldsResponse.error);
    } else {
      availableFields.value = fieldsResponse.data || [];
    }

    // Load template data
    const templateData = templateResponse.data;
    templates.value = templateData;

    currentTemplateName.value = templates.value.name;
    selectedContractId.value = templateData.contract_id;

    // Store original URLs for cleanup
    originalImageUrls.value = {
      background: templateData.background_image_url,
      composite: templateData.composite_image_url,
    };

    // Load existing background image
    if (templateData.background_image_url) {
      previewImageUrl.value = templateData.background_image_url;

      // Get natural size
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageNaturalWidth.value = img.naturalWidth;
        imageNaturalHeight.value = img.naturalHeight;
      };
      img.src = templateData.background_image_url;
    }

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
      };
    });

    selectedField.value = null;
  } catch (error) {
    console.error("Error in fetchTemplateAndFields:", error);
    alert("Error loading template data: " + error.message);
  } finally {
    isLoadingTemplate.value = false;
  }
}

function addFieldToPreview(fieldToAdd) {
  if (!fieldToAdd) {
    console.warn("addFieldToPreview: fieldToAdd is null or undefined");
    return;
  }

  // Get the amount from the database, default to 1 if not specified
  const amount = fieldToAdd.amount || 1;

  // Generate group ID if this is a multi-field group
  const groupId = amount > 1 ? `group_${fieldToAdd.id}_${Date.now()}` : null;

  // Create multiple instances based on the amount
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
      label: fieldToAdd.label,
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
    if (!previewImageUrl.value || !previewContainer.value) {
      throw new Error("No image or container available");
    }

    // Load background image
    const tempImage = await loadImage(previewImageUrl.value);
    const originalWidth = tempImage.naturalWidth;
    const originalHeight = tempImage.naturalHeight;

    // Create canvas with original image dimensions
    const canvas = createCanvas(originalWidth, originalHeight);
    const ctx = canvas.getContext("2d");
    drawBackgroundImage(ctx, tempImage, originalWidth, originalHeight);

    // Get the image bounds for scaling calculations
    const imageBounds = getImageBounds();

    // Calculate responsive font size based on image dimensions and field size
    const baseFontSize = Math.min(originalWidth, originalHeight) * 0.02;

    // Render each field onto the canvas
    for (const field of placedFields.value) {
      // Calculate position on the original image
      const scaledX = (field.x - imageBounds.offsetX) * imageBounds.scaleX;
      const scaledY = (field.y - imageBounds.offsetY) * imageBounds.scaleY;
      const scaledWidth = field.width * imageBounds.scaleX;
      const scaledHeight = field.height * imageBounds.scaleY;

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

function getImageBounds() {
  if (!previewContainer.value || !previewImageUrl.value) {
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

  const naturalWidth = imageNaturalWidth.value;
  const naturalHeight = imageNaturalHeight.value;

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
  const displayedAspectRatio = containerRect.width / containerRect.height;

  let imageDisplayWidth,
    imageDisplayHeight,
    offsetX = 0,
    offsetY = 0;

  if (naturalAspectRatio > displayedAspectRatio) {
    imageDisplayWidth = containerRect.width;
    imageDisplayHeight = containerRect.width / naturalAspectRatio;
    offsetY = (containerRect.height - imageDisplayHeight) / 2;
  } else {
    imageDisplayHeight = containerRect.height;
    imageDisplayWidth = containerRect.height * naturalAspectRatio;
    offsetX = (containerRect.width - imageDisplayWidth) / 2;
  }

  return {
    offsetX,
    offsetY,
    width: imageDisplayWidth,
    height: imageDisplayHeight,
    scaleX: naturalWidth / imageDisplayWidth,
    scaleY: naturalHeight / imageDisplayHeight,
  };
}

async function saveImagesToStorage(templateName, compositeBlob) {
  const timestamp = Date.now();

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
    compositeImageUrl: publicUrlData2.publicUrl,
  };
}

function validateTemplateName() {
  const result = validateTemplateNameFormat(currentTemplateName.value);
  templateNameError.value = result.isValid ? "" : result.message;
  return result.isValid;
}

async function saveTemplate() {
  if (!validateTemplateName()) {
    return;
  }
  try {
    if (!previewImageUrl.value) {
      alert("Please upload a background image first");
      return;
    }

    if (placedFields.value.length === 0) {
      alert("Please add at least one field to the template");
      return;
    }

    const templateName = currentTemplateName.value;
    if (!templateName?.trim()) {
      alert("Please enter a template name");
      return;
    }

    let file;

    if (originalImageUrls.value.background) {
      const response = await fetch(originalImageUrls.value.background);
      if (!response.ok) {
        alert("Could not fetch the original background image.");
        return;
      }
      const blob = await response.blob();
      file = new File([blob], "background.png", { type: blob.type });
    }

    if (!file) {
      alert("Image is missing");
      return;
    }

    const originalImage = new Image();
    const imageData = await new Promise((resolve, reject) => {
      originalImage.onload = () =>
        resolve({
          naturalWidth: originalImage.naturalWidth,
          naturalHeight: originalImage.naturalHeight,
        });
      originalImage.onerror = reject;
      originalImage.src = previewImageUrl.value;
    });

    const compositeBlob = await generateCompositeImage();
    if (!compositeBlob) {
      alert("Failed to generate composite image");
      return;
    }

    const uploadResult = await saveImagesToStorage(templateName, compositeBlob);

    await deleteImages([originalImageUrls.value.composite]);

    const compositeImageUrl = uploadResult.compositeImageUrl;

    const normalizedFields = placedFields.value.map((field) => ({
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
      contract_id: selectedContractId.value,
      composite_image_url: compositeImageUrl,
      image_width: imageData.naturalWidth,
      image_height: imageData.naturalHeight,
      placed_fields_data: normalizedFields,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("contract_templates")
      .update(templateData)
      .eq("id", selectedTemplateId.value)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      alert("Error saving template: " + error.message);
      return;
    }

    isSaving.value = true;
    router.back();
  } catch (error) {
    console.error("Save error:", error);
    alert("Error saving template: " + error.message);
  }
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

  selectedField.value = field;

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

function updateFieldPosition() {
  if (selectedField.value && previewContainer.value) {
    nextTick(() => {
      const containerRect = previewContainer.value.getBoundingClientRect();
      const maxX = Math.max(
        0,
        containerRect.width - (selectedField.value.width || 150)
      );
      const maxY = Math.max(
        0,
        containerRect.height - (selectedField.value.height || 40)
      );

      selectedField.value.x = Math.max(
        0,
        Math.min(selectedField.value.x || 0, maxX)
      );
      selectedField.value.y = Math.max(
        0,
        Math.min(selectedField.value.y || 0, maxY)
      );
    });
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
      updateFieldPosition();
      break;
    case "ArrowLeft":
      event.preventDefault();
      selectedField.value.x = Math.max(0, (selectedField.value.x || 0) - step);
      break;
    case "ArrowRight":
      event.preventDefault();
      selectedField.value.x = (selectedField.value.x || 0) + step;
      updateFieldPosition();
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

onMounted(async () => {
  await fetchTemplateAndFields();
  document.addEventListener("keydown", handleKeyDown);
  window.addEventListener("beforeunload", handleBeforeUnload);
});

onUnmounted(() => {
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDrag);
  document.removeEventListener("touchmove", drag);
  document.removeEventListener("touchend", stopDrag);
  document.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("beforeunload", handleBeforeUnload);

  if (previewImageUrl.value && previewImageUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(previewImageUrl.value);
  }
});

watch(selectedTemplateId, (newId) => {
  if (newId) {
    fetchTemplateAndFields();
  }
});

watch(
  [currentTemplateName, placedFields],
  () => {
    hasChanges.value = true;
  },
  { deep: true }
);

function handleBeforeUnload(e) {
  if (hasChanges.value) {
    e.preventDefault();
    e.returnValue = "";
  }
}

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
