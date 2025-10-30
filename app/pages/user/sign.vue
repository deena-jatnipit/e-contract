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

    <!-- Error State -->
    <SigningErrorDisplay
      v-else-if="
        !documentData ||
        errorMessage ||
        !token ||
        documentData.status === 'signed'
      "
      :token="token"
      :error-message="errorMessage"
    />

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
        <!-- Form Fields Component -->
        <SigningFormFields
          :grouped-fillable-fields="groupedFillableFields"
          :form-fields="formFields"
          @grouped-field-input="handleGroupedFieldInput"
        />

        <!-- Signature Pad Component -->
        <SigningSignaturePad
          ref="signaturePadRef"
          :signature-field="signatureField"
          @signature-update="handleSignatureUpdate"
          @signature-clear="handleSignatureClear"
        />

        <!-- Action Buttons Component -->
        <SigningActionButtons
          :is-loading="loading"
          :is-submitting="submitting"
          @preview="openPreviewModal"
        />
      </form>

      <!-- Image Preview Modal -->
      <PreviewImageModal
        v-if="template && template.file_type !== 'pdf'"
        :template="template"
        :displayFields="previewDisplayFields"
        :previewImageUrl="template?.background_image_url"
        modalId="templatePreviewModal"
        modalLabelId="templatePreviewModalLabel"
        :isSigningMode="true"
        :fieldValues="formFields"
        :signatureImageUrl="signaturePreview"
      />

      <!-- PDF Preview Modal -->
      <PreviewPdfModal
        v-if="template && template.file_type === 'pdf'"
        :template="template"
        :displayFields="previewDisplayFields"
        :pdfUrl="template?.background_image_url"
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

// State
const loading = ref(true);
const submitting = ref(false);
const documentData = ref(null);
const template = ref(null);
const fields = ref([]);
const fillableFields = ref([]);
const signatureField = ref(null);
const formFields = reactive({});
const errorMessage = ref("");

// Component refs
const signaturePadRef = ref(null);
const signaturePreview = ref(null);

// Default fields for template processing
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

// Computed properties
const groupedFillableFields = computed(() => {
  const groupsMap = {};
  const singles = [];

  fillableFields.value.forEach((f) => {
    if (f.isGrouped && f.groupId) {
      if (!groupsMap[f.groupId]) {
        groupsMap[f.groupId] = {
          groupId: f.groupId,
          label: f.label || f.name || "",
          fields: [],
        };
      }
      groupsMap[f.groupId].fields.push(f);
    } else {
      singles.push(f);
    }
  });

  const groups = Object.values(groupsMap).map((g) => {
    g.fields.sort((a, b) => (a.groupPosition || 0) - (b.groupPosition || 0));
    g.groupSize = g.fields.length;
    return g;
  });

  return { groups, singleFields: singles };
});

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
      pageNumber: field.pageNumber || 1,
    };
  });
});

// Methods from useDocumentSigning
const fetchDocument = async (documentId, token) => {
  if (!documentId || !token) {
    errorMessage.value = "Document ID and token are required";
    return false;
  }

  try {
    const { data, error } = await supabase
      .from("documents")
      .select(
        "id, template_id, customer_profile_id(customer_id, phone_number), provider, token, status, document_url"
      )
      .eq("id", documentId)
      .single();

    if (error || !data) {
      errorMessage.value =
        error?.code === "PGRST116"
          ? "Document not found. Please check the URL and try again."
          : "Failed to load document. Please try again.";
      return false;
    }

    if (data.token !== token) {
      errorMessage.value = "Invalid token. Access denied.";
      return false;
    }

    documentData.value = data;
    return true;
  } catch (error) {
    errorMessage.value = "An unexpected error occurred. Please try again.";
    return false;
  }
};

const fetchTemplate = async (templateId) => {
  if (!templateId) {
    errorMessage.value = "No template ID available";
    return false;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const [templateRes, fieldsRes] = await Promise.all([
      supabase
        .from("contract_templates")
        .select("*")
        .eq("id", templateId)
        .single(),
      supabase.from("contract_fields").select("*"),
    ]);

    if (templateRes.error) {
      errorMessage.value =
        templateRes.error.code === "PGRST116"
          ? "Template not found. Please check the URL and try again."
          : "Failed to load template. Please try again.";
      template.value = null;
      return false;
    }

    fields.value = fieldsRes.data || [];
    template.value = templateRes.data;

    // Process fillable fields
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

    // Initialize form fields
    fillableFields.value.forEach((f) => {
      formFields[f.instanceId] = "";
    });

    return true;
  } catch (err) {
    errorMessage.value = "An unexpected error occurred. Please try again.";
    template.value = null;
    return false;
  } finally {
    loading.value = false;
  }
};

const validateForm = () => {
  // Validate single fields
  for (const f of groupedFillableFields.value.singleFields) {
    if (!formFields[f.instanceId]?.trim()) {
      return {
        valid: false,
        message: `Please fill in: ${f.label || f.name}`,
      };
    }
  }

  // Validate grouped fields
  for (const g of groupedFillableFields.value.groups) {
    const value = getGroupedFieldValue(g.groupId);
    if (!value || value.length !== g.groupSize) {
      return {
        valid: false,
        message: `Please fill in all ${g.groupSize} characters for: ${g.label || g.name}`,
      };
    }
  }

  return { valid: true };
};

const getGroupedFieldValue = (groupId) => {
  const group = groupedFillableFields.value.groups.find(
    (g) => g.groupId === groupId
  );
  return group
    ? group.fields.map((f) => formFields[f.instanceId] || "").join("")
    : "";
};

const handleGroupedFieldInput = (groupId, inputValue) => {
  const group = groupedFillableFields.value.groups.find(
    (g) => g.groupId === groupId
  );
  if (!group) return;

  group.fields.forEach((field) => {
    formFields[field.instanceId] = "";
  });

  inputValue.split("").forEach((char, i) => {
    if (group.fields[i]) {
      formFields[group.fields[i].instanceId] = char || "";
    }
  });
};

// Import canvas and PDF operations composables
const {
  createCanvas,
  loadImage,
  drawBackgroundImage,
  renderTextWithTruncation,
  renderSignature,
  canvasToBlob,
  isFieldInBounds,
} = useCanvasOperations();

const { generateCompositePdf: generatePdfComposite, sanitizeInput } =
  usePdfSigning();

// Generate composite image (for image templates)
const generateCompositeImage = async (
  template,
  formFields,
  groupedFillableFields,
  signatureField,
  signaturePreview
) => {
  try {
    // Load background image
    const bgImg = await loadImage(template.composite_image_url);

    // Create canvas with background image dimensions
    const canvas = createCanvas(bgImg.naturalWidth, bgImg.naturalHeight);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    drawBackgroundImage(ctx, bgImg, bgImg.naturalWidth, bgImg.naturalHeight);

    const displayWidth = 800;
    const naturalWidth = bgImg.naturalWidth;
    const scaleRatio = naturalWidth / displayWidth;

    // Collect all fields
    const allFields = [
      ...groupedFillableFields.singleFields,
      ...groupedFillableFields.groups.flatMap((g) => g.fields || []),
    ];

    // Render text fields
    allFields.forEach((field) => {
      const value = sanitizeInput(formFields[field.instanceId] || "");
      if (!value.trim()) return;

      const fieldActualX = Number(field.x) * scaleRatio;
      const fieldActualY = Number(field.y) * scaleRatio;
      const fieldActualW = Number(field.width) * scaleRatio;
      const fieldActualH = Number(field.height) * scaleRatio;

      if (
        !isFieldInBounds(
          fieldActualX,
          fieldActualY,
          fieldActualW,
          fieldActualH,
          canvas.width,
          canvas.height
        )
      ) {
        return;
      }

      const baseFontSize = Math.max(12, Math.min(24, fieldActualH * 0.4));
      renderTextWithTruncation(
        ctx,
        value,
        fieldActualX,
        fieldActualY,
        fieldActualW,
        fieldActualH,
        baseFontSize
      );
    });

    // Render signature
    if (signatureField && signaturePreview) {
      await renderSignature(ctx, signatureField, signaturePreview, scaleRatio);
    }

    return await canvasToBlob(canvas, "image/png", 0.95);
  } catch (error) {
    console.error("Error generating composite image:", error);
    throw new Error("Failed to generate document image");
  }
};

// Methods from useNotifications
const sendSms = async (msisdn) => {
  try {
    const message =
      "เสร็จสิ้นการเซ็นลายเซ็น เอกสารของคุณถูกบันทึกเรียบร้อยแล้ว";

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
    return true;
  } catch (error) {
    console.error("Failed to send SMS:", error);
    throw error;
  }
};

const sendLine = async (userId, documentUrl = null, isPdf = false) => {
  try {
    const textMessage =
      "เสร็จสิ้นการเซ็นลายเซ็น เอกสารของคุณถูกบันทึกเรียบร้อยแล้ว";

    const messages = [
      {
        type: "text",
        text: textMessage,
      },
    ];

    if (documentUrl) {
      if (isPdf) {
        // For PDF files, send URL as text message
        messages.push({
          type: "text",
          text: `ดาวน์โหลดเอกสาร PDF ของคุณได้ที่: ${documentUrl}`,
        });
      } else {
        // For images, send as image attachment
        messages.push({
          type: "image",
          originalContentUrl: documentUrl,
          previewImageUrl: documentUrl,
        });
      }
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
    return true;
  } catch (error) {
    console.error("Failed to send Line message:", error);
    throw error;
  }
};

const sendTelegram = async (documentId) => {
  try {
    const message = `เอกสาร ${documentId} ได้รับการเซ็นลายเซ็นเรียบร้อยแล้ว`;

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
    return true;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    throw error;
  }
};

const sendNotification = async (documentData, documentId, documentUrl) => {
  const notifications = [];

  try {
    if (documentData.provider === "line") {
      notifications.push(
        sendLine(documentData.customer_profile_id.customer_id, documentUrl)
      );
    }

    if (documentData.provider === "sms") {
      notifications.push(
        sendSms(documentData.customer_profile_id.phone_number)
      );
    }

    notifications.push(sendTelegram(documentId));

    await Promise.allSettled(notifications);
  } catch (error) {
    console.error("Error sending notifications:", error);
    // Don't throw error to prevent blocking the main flow
  }
};

// Event handlers
const handleSignatureUpdate = (signature) => {
  signaturePreview.value = signature;
};

const handleSignatureClear = () => {
  signaturePreview.value = null;
};

const openPreviewModal = () => {
  if (signaturePadRef.value?.updateSignaturePreview) {
    signaturePadRef.value.updateSignaturePreview();
  }

  // Use proper modal handling instead of jQuery
  const modal = document.getElementById("templatePreviewModal");
  if (modal) {
    const bootstrap = window.bootstrap;
    if (bootstrap) {
      const modalInstance = new bootstrap.Modal(modal);
      modalInstance.show();
    }
  }
};

const handleSubmit = async () => {
  // Validate signature
  if (signatureField.value && signaturePadRef.value?.isSignatureEmpty()) {
    alert("Please provide your signature before submitting.");
    return;
  }

  // Validate form fields
  const validation = validateForm();
  if (!validation.valid) {
    alert(validation.message);
    return;
  }

  submitting.value = true;

  try {
    let compositeBlob;
    let fileExtension;

    // Generate composite based on file type
    if (template.value.file_type === "pdf") {
      console.log("[sign.vue] Generating PDF composite");
      compositeBlob = await generatePdfComposite(
        template.value,
        formFields,
        groupedFillableFields.value,
        signatureField.value,
        signaturePreview.value
      );
      fileExtension = "pdf";
    } else {
      console.log("[sign.vue] Generating image composite");
      compositeBlob = await generateCompositeImage(
        template.value,
        formFields,
        groupedFillableFields.value,
        signatureField.value,
        signaturePreview.value
      );
      fileExtension = "png";
    }

    if (!compositeBlob) {
      throw new Error("Failed to generate composite document");
    }

    // Upload to storage
    const fileName = `${template.value.name.replace(/[^a-zA-Z0-9]/g, "_")}_signed_${Date.now()}.${fileExtension}`;
    const filePath = `signed/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("contract")
      .upload(filePath, compositeBlob, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error("Upload failed: " + uploadError.message);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("contract")
      .getPublicUrl(filePath);

    // Update document status
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

    if (error) {
      throw new Error("Database error: " + error.message);
    }

    // Send notifications
    await sendNotification(documentData.value, data.id, data.document_url);

    // Redirect to success page
    router.push("/user/sign-success");
  } catch (error) {
    console.error("Error signing document:", error);
    alert("Error signing document: " + error.message);
  } finally {
    submitting.value = false;
  }
};

// Lifecycle
onMounted(async () => {
  if (!documentId || !token) {
    errorMessage.value = "Document ID and token are required in the URL";
    loading.value = false;
    return;
  }

  if (!(await fetchDocument(documentId, token))) {
    loading.value = false;
    return;
  }

  if (!(await fetchTemplate(documentData.value.template_id))) {
    loading.value = false;
    return;
  }
});

// Watch for signature preview changes
watch(signaturePreview, (newValue) => {
  if (newValue) {
    nextTick(() => {
      const modal = document.getElementById("templatePreviewModal");
      if (modal && modal.classList.contains("show")) {
        // Trigger modal update if needed
        const event = new Event("update");
        modal.dispatchEvent(event);
      }
    });
  }
});
</script>

<style scoped>
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

/* Loading spinner */
.spinner-border {
  width: 3rem;
  height: 3rem;
}
</style>
