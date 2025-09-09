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
          <div
            id="preview-container"
            ref="previewContainer"
            class="template-preview-area"
          >
            <img v-if="previewImageUrl" :src="previewImageUrl" />

            <!-- render fields overlay -->
            <div
              v-for="field in displayFields"
              :key="field.instanceId"
              class="placed-field-preview"
              :class="{ 'signing-mode': isSigningMode }"
              :style="{
                left: field.x + 'px',
                top: field.y + 'px',
                width: field.width + 'px',
                height: field.height + 'px',
              }"
            >
              <div
                class="field-content-preview"
                :class="{ 'signing-mode': isSigningMode }"
              >
                <!-- Show filled value if available, otherwise show field info -->
                <template v-if="isSignatureField(field) && signatureImageUrl">
                  <img
                    :src="signatureImageUrl"
                    class="signature-preview-img"
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
  previewImageUrl: String,
  modalId: {
    type: String,
    default: "previewModal",
  },
  modalLabelId: {
    type: String,
    default: "previewModalLabel",
  },
  // New props for handling input field values
  fieldValues: {
    type: Object,
    default: () => ({}),
  },
  signatureImageUrl: {
    type: String,
    default: null,
  },
  // New prop to determine if we're in signing mode
  isSigningMode: {
    type: Boolean,
    default: false,
  },
});

const previewContainer = ref(null);

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

.placed-field-preview {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.3);
  border: 1px solid #ddd;
  pointer-events: none;
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
  font-size: 0.75rem;
}

.field-value-preview {
  font-weight: bold;
  font-size: 0.75rem;
  color: #000;
  text-align: center;
  word-break: break-word;
  max-width: 100%;
}

.signature-preview-img {
  width: 100%;
  height: 100%;
  object-fit: fill; /* This will stretch to exact container size */
  pointer-events: none;
  display: block;
}

@media (max-width: 820px) {
  #preview-container {
    width: 100% !important;
    margin: 0 !important;
  }

  #preview-container img {
    width: 100% !important;
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
