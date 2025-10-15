<template>
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
        <button
          type="button"
          @click="updateSignaturePreview"
          class="btn btn-outline-primary flex-fill"
        >
          <i class="fas fa-check me-1"></i>Confirm
        </button>
      </div>

      <div v-if="signatureError" class="text-danger small mt-2">
        {{ signatureError }}
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  signatureField: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["signatureUpdate", "signatureClear"]);

// Signature pad state
const signaturePad = ref(null);
const signaturePadContainer = ref(null);
const signaturePreview = ref(null);
const signatureError = ref("");

let signaturePadInstance = null;
let SignaturePadClass = null;

// Signature pad methods
const setupSignaturePad = async () => {
  const canvas = signaturePad.value;
  const container = signaturePadContainer.value;

  if (!canvas || !container) return false;

  try {
    if (!SignaturePadClass) {
      SignaturePadClass =
        window.SignaturePad || (await import("signature_pad")).default;
    }

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    signaturePadInstance = new SignaturePadClass(canvas, {
      penColor: "rgb(0, 98, 255)",
      maxWidth: 1.5,
      onEnd: () => {
        if (!signaturePadInstance.isEmpty()) {
          updateSignaturePreview();
        }
      },
    });

    return true;
  } catch (error) {
    console.error("Failed to setup signature pad:", error);
    return false;
  }
};

const clearSignature = () => {
  if (signaturePadInstance) {
    signaturePadInstance.clear();
    signaturePreview.value = null;
  }
  signatureError.value = "";
  emit("signatureClear");
};

const updateSignaturePreview = () => {
  if (signaturePadInstance && !signaturePadInstance.isEmpty()) {
    const cropped = cropSignature(signaturePad.value);
    signaturePreview.value = cropped
      ? cropped.toDataURL("image/png")
      : signaturePadInstance.toDataURL("image/png");
  }
  signatureError.value = "";
  emit("signatureUpdate", signaturePreview.value);
};

const isSignatureEmpty = () => {
  return !signaturePadInstance || signaturePadInstance.isEmpty();
};

const cropSignature = (canvas) => {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (data[(y * canvas.width + x) * 4 + 3] > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX >= canvas.width || minY >= canvas.height) return null;

  const pad = 100;
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
};

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

const validateSignature = () => {
  if (isSignatureEmpty()) {
    signatureError.value = "Please provide your signature";
    return false;
  }
  signatureError.value = "";
  return true;
};

// Expose validation method to parent
defineExpose({
  validateSignature,
  isSignatureEmpty,
  updateSignaturePreview,
});

onMounted(async () => {
  if (props.signatureField) {
    await nextTick();
    const success = await setupSignaturePad();
    if (!success) {
      signatureError.value = "Failed to initialize signature pad";
    }
  }

  // Add resize listener
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

// Watch for signature changes
watch(signaturePreview, (newValue) => {
  if (newValue) {
    emit("signatureUpdate", newValue);
  }
});
</script>

<style scoped>
#signaturePadContainer canvas {
  cursor: crosshair;
}

.border-success {
  border-color: #198754 !important;
}

.btn:focus {
  box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.25);
}
</style>
