<template>
  <div class="container-fluid p-0">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="d-flex justify-content-center align-items-center"
      style="min-height: 100vh"
    >
      <div class="spinner-border text-success" role="status"></div>
    </div>

    <!-- Template Not Found -->
    <div
      v-else-if="
        !documentData ||
        errorMessage ||
        !token ||
        documentData.status === 'signed'
      "
      class="min-vh-100 d-flex align-items-center justify-content-center bg-light"
    >
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-5">
            <div class="card border-0 shadow-sm">
              <div class="card-body text-center p-5">
                <!-- Error Icon -->
                <div class="mb-4">
                  <div
                    class="error-icon-wrapper d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 p-3"
                  >
                    <i class="fas fa-exclamation-triangle text-danger fs-1"></i>
                  </div>
                </div>

                <!-- Error Title -->
                <h3 class="fw-bold text-dark mb-3">
                  {{ !token ? "Access Token Missing" : "Document Not Found" }}
                </h3>

                <!-- Error Message -->
                <p class="text-muted mb-4 lh-base">
                  {{
                    errorMessage ||
                    (!token
                      ? "The requested token could not be found. Please check your URL and try again."
                      : "The requested document could not be found or have been signed.")
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="pb-5">
      <!-- Header -->
      <div
        class="bg-success text-white p-3 mb-3 d-flex justify-content-between align-items-center"
      >
        <div>
          <h1 class="h5 mb-1">{{ template.name }}</h1>
          <small class="opacity-75">Digital Contract Signing</small>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="px-3">
        <!-- Input Form (only show if there are fillable fields) -->
        <div
          v-if="
            groupedFillableFields.singleFields.length > 0 ||
            groupedFillableFields.groups.length > 0
          "
          class="card mb-4"
        >
          <div class="card-header bg-light">
            <h2 class="h6 mb-0">
              <i class="fas fa-edit me-2"></i>Fill Required Information
            </h2>
          </div>
          <div class="card-body">
            <!-- Single Fields -->
            <div
              v-for="field in groupedFillableFields.singleFields"
              :key="field.instanceId"
              class="mb-3"
            >
              <label :for="field.instanceId" class="form-label">
                {{ field.label || field.name }}
                <span class="text-danger">*</span>
              </label>
              <input
                :id="field.instanceId"
                v-model="formFields[field.instanceId]"
                type="text"
                class="form-control form-control-lg"
                :placeholder="`Enter ${field.label || field.name}`"
                required
              />
            </div>

            <!-- Grouped Fields -->
            <div
              v-for="group in groupedFillableFields.groups"
              :key="group.groupId"
              class="mb-3"
            >
              <label :for="'group_' + group.groupId" class="form-label">
                {{ group.label || group.name }}
                <span class="text-danger">*</span>
                <small class="text-muted ms-1"
                  >({{ group.groupSize }} characters)</small
                >
              </label>
              <input
                :id="'group_' + group.groupId"
                :value="getGroupedFieldValue(group.groupId)"
                @input="
                  handleGroupedFieldInput(group.groupId, $event.target.value)
                "
                type="text"
                class="form-control form-control-lg"
                :placeholder="`Enter ${group.groupSize} characters for ${group.label || group.name}`"
                :maxlength="group.groupSize"
                required
              />
            </div>
          </div>
        </div>

        <!-- Signature Pad -->
        <div v-if="signatureField" class="card mb-4">
          <div class="card-header bg-light">
            <h2 class="h6 mb-0">
              <i class="fas fa-signature me-2"></i>Your Signature
            </h2>
          </div>
          <div class="card-body">
            <p class="text-muted small mb-3">Please sign in the box below:</p>

            <div
              ref="signaturePadContainer"
              class="border border-2 border-success rounded position-relative bg-white"
              style="height: 200px; width: 100%"
            >
              <canvas
                ref="signaturePad"
                class="w-100 h-100"
                style="touch-action: none"
              ></canvas>
            </div>

            <div class="d-flex gap-2 mt-3">
              <button
                type="button"
                @click="clearSignature"
                class="btn btn-outline-secondary flex-fill"
              >
                <i class="fas fa-eraser me-1"></i>Clear
              </button>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-6">
            <button
              type="button"
              class="btn btn-outline-light btn-lg w-100 d-flex align-items-center justify-content-center"
              @click="openPreviewModal"
            >
              <i class="fas fa-eye me-1"></i>Preview
            </button>
          </div>
          <div class="col-6">
            <button
              type="submit"
              class="btn btn-success btn-lg w-100 d-flex align-items-center justify-content-center"
            >
              <span
                v-if="submitting"
                class="spinner-border spinner-border-sm me-2"
                role="status"
              ></span>
              <i v-else class="fas fa-check me-2"></i>
              {{ submitting ? "Saving..." : "Complete Signing" }}
            </button>
          </div>
        </div>
      </form>

      <!-- Image Preview Modal -->
      <ImagePreviewModal
        :template="template"
        :displayFields="previewDisplayFields"
        :previewImageUrl="template?.background_image_url"
        modalId="templatePreviewModal"
        modalLabelId="templatePreviewModalLabel"
        :isSigningMode="true"
        :fieldValues="formFields"
        :signatureImageUrl="signaturePreview"
      />
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const route = useRoute();
const router = useRouter();

const documentId = route.query.documentId;
const token = route.query.token;
const templateId = ref(null);
const loading = ref(true);
const submitting = ref(false);
const documentData = ref(null);
const template = ref(null);
const fields = ref([]);
const fillableFields = ref([]);
const signatureField = ref(null);
const formFields = reactive({});
const signaturePad = ref(null);
const signaturePadContainer = ref(null);
const signaturePreview = ref(null);
const errorMessage = ref("");

let signaturePadInstance = null;
let SignaturePadClass = null;

const defaultFields = [
  {
    id: "default-checkmark",
    name: "Check Mark",
    type: "Icon",
    icon: "fas fa-check",
  },
  {
    id: "default-signature",
    name: "Signature Box",
    type: "Signature",
    icon: "fas fa-signature",
  },
];

// Group fields for easier rendering
const groupedFillableFields = computed(() => {
  const groups = {};
  const singles = [];
  fillableFields.value.forEach((f) => {
    if (f.isGrouped && f.groupId) {
      if (!groups[f.groupId]) groups[f.groupId] = { ...f, fields: [] };
      groups[f.groupId].fields.push(f);
    } else {
      singles.push(f);
    }
  });
  Object.values(groups).forEach((g) =>
    g.fields.sort((a, b) => (a.groupPosition || 0) - (b.groupPosition || 0))
  );
  return { groups: Object.values(groups), singleFields: singles };
});

// Merge placed fields with definitions for preview
const previewDisplayFields = computed(() => {
  const placed = Array.isArray(template.value?.placed_fields_data)
    ? template.value.placed_fields_data
    : [];
  return placed.map((field) => {
    let merged = { ...field };
    if (typeof field.id === "string" && field.id.startsWith("default-")) {
      const def = defaultFields.find((df) => df.id === field.id);
      if (def) merged = { ...def, ...field, label: "" };
    } else if (typeof field.id === "number") {
      const dbField = fields.value.find((f) => f.id === field.id);
      if (dbField) merged = { ...dbField, ...field };
    }
    return {
      ...merged,
      instanceId:
        field.instanceId ||
        `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: Number(field.x) || 50,
      y: Number(field.y) || 50,
      width: Number(field.width) || 150,
      height: Number(field.height) || 40,
    };
  });
});

function openPreviewModal() {
  $("#templatePreviewModal").modal("show");
}

async function fetchTemplate() {
  if (!templateId.value) {
    errorMessage.value = "No template ID available";
    loading.value = false;
    return;
  }
  loading.value = true;
  errorMessage.value = "";
  try {
    const [templateRes, fieldsRes] = await Promise.all([
      supabase
        .from("contract_templates")
        .select("*")
        .eq("id", templateId.value)
        .single(),
      supabase.from("contract_fields").select("*"),
    ]);
    if (templateRes.error) {
      errorMessage.value =
        templateRes.error.code === "PGRST116"
          ? "Template not found. Please check the URL and try again."
          : `Failed to load template: ${templateRes.error.message}`;
      template.value = null;
      return;
    }
    fields.value = fieldsRes.data || [];
    template.value = templateRes.data;
    const placed = Array.isArray(template.value.placed_fields_data)
      ? template.value.placed_fields_data
      : [];
    fillableFields.value = placed
      .map((f) => ({
        ...f,
        instanceId:
          f.instanceId ||
          `field_${f.id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }))
      .filter((f) => {
        if (f.type === "Icon" || f.id === "default-checkmark") return false;
        if (f.type === "Signature" || f.id === "default-signature")
          return false;
        if (typeof f.id === "number") {
          const def = fields.value.find((df) => df.id === f.id);
          if (!def || def.is_fillable === false) return false;
          Object.assign(f, {
            name: def.name,
            type: def.type,
            label: def.label || def.name,
          });
        }
        if (!f.label && !f.name) f.label = `Field ${f.id}`;
        else if (!f.label) f.label = f.name;
        return true;
      });
    signatureField.value = placed.find(
      (f) => f.type === "Signature" || f.id === "default-signature"
    );
    fillableFields.value.forEach((f) => {
      formFields[f.instanceId] = "";
    });
  } catch (err) {
    errorMessage.value = err.message.includes("Failed to fetch")
      ? "Network error. Please check your connection and try again."
      : err.message.includes("JSON")
        ? "Data format error. Please contact support."
        : `Unexpected error: ${err.message}`;
    template.value = null;
  } finally {
    loading.value = false;
  }
}

async function fetchDocument() {
  if (!documentId || !token) {
    errorMessage.value = "Document ID and token are required";
    return false;
  }
  try {
    const { data, error } = await supabase
      .from("documents")
      .select(
        "id, template_id, customer_profile_id(customer_id), provider, token, status, document_url"
      )
      .eq("id", documentId)
      .single();
    if (error || !data) {
      errorMessage.value =
        error?.code === "PGRST116"
          ? "Document not found. Please check the URL and try again."
          : `Failed to load document: ${error?.message || "Unknown error"}`;
      return false;
    }
    if (data.token !== token) {
      errorMessage.value = "Invalid token. Access denied.";
      return false;
    }
    documentData.value = data;
    templateId.value = data.template_id;
    return true;
  } catch (error) {
    errorMessage.value = `Unexpected error: ${error.message}`;
    return false;
  }
}

async function setupSignaturePad() {
  const canvas = signaturePad.value,
    container = signaturePadContainer.value;
  if (!canvas || !container) return;
  if (!SignaturePadClass) {
    try {
      SignaturePadClass =
        window.SignaturePad || (await import("signature_pad")).default;
    } catch (error) {
      return;
    }
  }
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  signaturePadInstance = new SignaturePadClass(canvas, {
    penColor: "rgb(0, 98, 255)",
    maxWidth: 1.5,
  });
  signaturePadInstance.addEventListener("endStroke", () => {
    if (!signaturePadInstance.isEmpty()) updateSignaturePreview();
  });
}

function clearSignature() {
  if (signaturePadInstance) {
    signaturePadInstance.clear();
    signaturePreview.value = null;
  }
}

function updateSignaturePreview() {
  if (signaturePadInstance && !signaturePadInstance.isEmpty()) {
    const cropped = cropSignature(signaturePad.value);
    signaturePreview.value = cropped
      ? cropped.toDataURL("image/png")
      : signaturePadInstance.toDataURL("image/png");
  }
}

async function generateCompositeImage() {
  try {
    // Use the composite image as the base
    const bgImg = new window.Image();
    bgImg.crossOrigin = "anonymous";
    await new Promise((res, rej) => {
      bgImg.onload = res;
      bgImg.onerror = rej;
      bgImg.src = template.value.composite_image_url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = bgImg.naturalWidth;
    canvas.height = bgImg.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bgImg, 0, 0);

    const displayWidth = 800;
    const actualWidth = bgImg.naturalWidth; // Actual image width (750px)

    // Calculate scaling factor to convert from display coordinates to actual image coordinates
    const scaleRatio = actualWidth / displayWidth;

    // Process all fillable fields
    const allFields = [
      ...groupedFillableFields.value.singleFields,
      ...groupedFillableFields.value.groups.flatMap((g) => g.fields),
    ];

    allFields.forEach((field) => {
      const value = formFields[field.instanceId] || "";
      if (value.trim()) {
        // Scale coordinates from 800px display to actual image size
        const actualX = field.x * scaleRatio;
        const actualY = field.y * scaleRatio;
        const actualWidth = field.width * scaleRatio;
        const actualHeight = field.height * scaleRatio;

        // Skip if field is outside canvas bounds
        if (
          actualX < 0 ||
          actualY < 0 ||
          actualX > bgImg.naturalWidth ||
          actualY > bgImg.naturalHeight
        ) {
          return;
        }

        ctx.save();

        // Scale font size proportionally to match the coordinate scaling
        const baseFontSize = Math.max(12, Math.min(24, actualHeight * 0.4));
        ctx.font = `${baseFontSize}px Arial, sans-serif`;
        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Draw text centered in the scaled field
        const centerX = actualX + actualWidth / 2;
        const centerY = actualY + actualHeight / 2;

        // Handle text that's too long for the scaled field
        const maxWidth = actualWidth * 0.9;
        let displayText = value;

        while (
          ctx.measureText(displayText).width > maxWidth &&
          displayText.length > 1
        ) {
          displayText = displayText.slice(0, -1);
        }

        if (displayText !== value && displayText.length > 3) {
          displayText = displayText.slice(0, -3) + "...";
        }

        ctx.fillText(displayText, centerX, centerY);
        ctx.restore();
      }
    });

    // Handle signature field
    if (signatureField.value && signaturePreview.value) {
      const sigImg = new window.Image();
      sigImg.crossOrigin = "anonymous";
      await new Promise((res, rej) => {
        sigImg.onload = res;
        sigImg.onerror = rej;
        sigImg.src = signaturePreview.value;
      });

      // Scale signature field coordinates
      const actualSigX = signatureField.value.x * scaleRatio;
      const actualSigY = signatureField.value.y * scaleRatio;
      const actualSigWidth = signatureField.value.width * scaleRatio;
      const actualSigHeight = signatureField.value.height * scaleRatio;

      // Calculate signature scaling to fit within the scaled field
      const sigScale = Math.min(
        actualSigWidth / sigImg.width,
        actualSigHeight / sigImg.height,
        1
      );

      // Center signature within the scaled field
      const sigDrawX =
        actualSigX + (actualSigWidth - sigImg.width * sigScale) / 2;
      const sigDrawY =
        actualSigY + (actualSigHeight - sigImg.height * sigScale) / 2;

      ctx.drawImage(
        sigImg,
        sigDrawX,
        sigDrawY,
        sigImg.width * sigScale,
        sigImg.height * sigScale
      );
    }

    return new Promise((res) => canvas.toBlob(res, "image/png", 0.95));
  } catch (error) {
    console.error("Error generating composite image:", error);
    throw error;
  }
}

async function handleSubmit() {
  if (
    signatureField.value &&
    (!signaturePadInstance || signaturePadInstance.isEmpty())
  ) {
    alert("Please provide your signature before submitting.");
    return;
  }
  for (const f of groupedFillableFields.value.singleFields)
    if (!formFields[f.instanceId]?.trim()) {
      alert(`Please fill in: ${f.label || f.name}`);
      return;
    }
  for (const g of groupedFillableFields.value.groups)
    if (
      !getGroupedFieldValue(g.groupId) ||
      getGroupedFieldValue(g.groupId).length !== g.groupSize
    ) {
      alert(
        `Please fill in all ${g.groupSize} characters for: ${g.label || g.name}`
      );
      return;
    }

  submitting.value = true;
  try {
    const compositeBlob = await generateCompositeImage();
    if (!compositeBlob) throw new Error("Failed to generate composite image");
    const fileName = `${template.value.name.replace(/[^a-zA-Z0-9]/g, "_")}_signed_${Date.now()}.png`;
    const filePath = `signed/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("template-images")
      .upload(filePath, compositeBlob, { cacheControl: "3600", upsert: false });

    if (uploadError) throw new Error("Upload failed: " + uploadError.message);

    const { data: publicUrlData } = supabase.storage
      .from("template-images")
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from("documents")
      .update({
        status: "signed",
        document_url: publicUrlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("token", token)
      .select()
      .single();

    if (error) throw new Error("Database error: " + error.message);

    await sendNotification(data.id, data.document_url);

    router.push("/user/sign-success");
  } catch (error) {
    alert("Error signing document: " + error.message);
  } finally {
    submitting.value = false;
  }
}

function handleGroupedFieldInput(groupId, inputValue) {
  const group = groupedFillableFields.value.groups.find(
    (g) => g.groupId === groupId
  );
  if (!group) return;
  inputValue.split("").forEach((char, i) => {
    formFields[group.fields[i]?.instanceId] = char || "";
  });
}

function getGroupedFieldValue(groupId) {
  const group = groupedFillableFields.value.groups.find(
    (g) => g.groupId === groupId
  );
  return group
    ? group.fields.map((f) => formFields[f.instanceId] || "").join("")
    : "";
}

function cropSignature(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true }),
    data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let minX = canvas.width,
    minY = canvas.height,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < canvas.height; y++)
    for (let x = 0; x < canvas.width; x++)
      if (data[(y * canvas.width + x) * 4 + 3] > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
  if (minX >= canvas.width || minY >= canvas.height) return null;
  const pad = 10;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(canvas.width, maxX + pad);
  maxY = Math.min(canvas.height, maxY + pad);
  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = maxX - minX;
  croppedCanvas.height = maxY - minY;
  croppedCanvas
    .getContext("2d")
    .drawImage(
      canvas,
      minX,
      minY,
      croppedCanvas.width,
      croppedCanvas.height,
      0,
      0,
      croppedCanvas.width,
      croppedCanvas.height
    );
  return croppedCanvas;
}

async function sendSms(msisdn) {
  try {
    const message = `เสร็จสิ้นการเซ็นลายเซ็น เอกสารของคุณถูกบันทึกเรียบร้อยแล้ว`;

    const response = await $fetch("/api/sms/send-message", {
      method: "POST",
      body: {
        msisdn,
        message,
      },
    });

    if (response?.error) {
      throw new Error(response.error);
    }

    console.log("SMS sent successfully");
  } catch (error) {
    throw error;
  }
}

async function sendLine(userId, documentUrl = null) {
  try {
    const textMessage = `เสร็จสิ้นการเซ็นลายเซ็น เอกสารของคุณถูกบันทึกเรียบร้อยแล้ว`;

    const messages = [
      {
        type: "text",
        text: textMessage,
      },
    ];

    if (documentUrl) {
      messages.push({
        type: "image",
        originalContentUrl: documentUrl,
        previewImageUrl: documentUrl,
      });
    }

    const response = await $fetch("/api/line/send-message", {
      method: "POST",
      body: {
        userId: userId,
        messages: messages,
      },
    });

    if (response?.error) {
      throw new Error(response.error);
    }

    console.log("Line message sent successfully");
  } catch (error) {
    throw error;
  }
}

async function sendTelegram(documentId = null) {
  try {
    const message = `เอกสาร ${documentId || documentId.value} ได้รับการเซ็นลายเซ็นเรียบร้อยแล้ว`;

    const response = await $fetch("/api/telegram/send-message", {
      method: "POST",
      body: {
        message,
      },
    });

    if (response?.error) {
      throw new Error(response.error);
    }

    console.log("Telegram message sent successfully");
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    throw error;
  }
}

async function sendNotification(documentId, documentUrl) {
  try {
    if (documentData.value.provider === "line") {
      await sendLine(
        documentData.value.customer_profile_id.customer_id,
        documentUrl
      );
    }

    if (documentData.value.provider === "sms") {
      await sendSms(documentData.value.customer_profile_id.phone_number);
    }

    await sendTelegram(documentId);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

onMounted(async () => {
  if (!documentId || !token) {
    errorMessage.value = "Document ID and token are required in the URL";
    loading.value = false;
    return;
  }
  if (!(await fetchDocument())) {
    loading.value = false;
    return;
  }
  await fetchTemplate();
  await nextTick();
  if (signatureField.value) await setupSignaturePad();
});

onMounted(() => {
  const handleResize = () => {
    if (
      signaturePadInstance &&
      signaturePadContainer.value &&
      signaturePad.value
    ) {
      const rect = signaturePadContainer.value.getBoundingClientRect();
      signaturePad.value.width = rect.width;
      signaturePad.value.height = rect.height;
      signaturePadInstance.clear();
      signaturePreview.value = null;
    }
  };
  window.addEventListener("resize", handleResize);
  onUnmounted(() => window.removeEventListener("resize", handleResize));
});
</script>
<style scoped>
#signaturePadContainer canvas {
  cursor: crosshair;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .container-fluid {
    padding: 0;
  }

  .card {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .card:first-child {
    border-top: none;
  }

  .form-control-lg {
    font-size: 1.1rem;
    padding: 0.75rem;
  }

  .btn-lg {
    padding: 1rem;
    font-size: 1.1rem;
  }
}

/* Signature pad styling */
.border-success {
  border-color: #198754 !important;
}

/* Field overlay styling */
.bg-opacity-75 {
  background-color: rgba(255, 255, 255, 0.75) !important;
}
</style>
