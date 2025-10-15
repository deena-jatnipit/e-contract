<template>
  <div class="row">
    <div class="col-6">
      <button
        type="button"
        class="btn btn-outline-light btn-lg w-100 d-flex align-items-center justify-content-center"
        @click="handlePreview"
        :disabled="isLoading"
      >
        <i class="fas fa-eye me-1"></i>Preview
      </button>
    </div>
    <div class="col-6">
      <button
        type="submit"
        class="btn btn-success btn-lg w-100 d-flex align-items-center justify-content-center"
        :disabled="isLoading || isSubmitting"
      >
        <span
          v-if="isSubmitting"
          class="spinner-border spinner-border-sm me-2"
          role="status"
        ></span>
        <i v-else class="fas fa-check me-2"></i>
        {{ isSubmitting ? "Saving..." : "Complete Signing" }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["preview"]);

const handlePreview = () => {
  emit("preview");
};
</script>

<style scoped>
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:focus {
  box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.25);
}
</style>
