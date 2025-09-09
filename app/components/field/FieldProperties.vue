<template>
  <div class="card card-secondary">
    <div class="card-header">
      <h3 class="card-title small">Props</h3>
    </div>
    <div class="card-body p-2">
      <h6
        class="mb-2 small text-truncate text-bold"
        :title="selectedField.name"
      >
        {{ selectedField.name }}
        <span v-if="selectedField.instanceNumber > 1" class="text-muted">
          #{{ selectedField.instanceNumber }}
        </span>
      </h6>

      <div class="form-group mb-2">
        <label class="small mb-1">X</label>
        <input
          type="number"
          class="form-control form-control-sm"
          v-model.number="localField.x"
          @input="onPropertyChange"
          min="0"
        />
      </div>

      <div class="form-group mb-2">
        <label class="small mb-1">Y</label>
        <input
          type="number"
          class="form-control form-control-sm"
          v-model.number="localField.y"
          @input="onPropertyChange"
          min="0"
        />
      </div>

      <div class="form-group mb-2">
        <label class="small mb-1">Width</label>
        <input
          type="number"
          class="form-control form-control-sm"
          v-model.number="localField.width"
          @input="onPropertyChange"
          min="10"
        />
      </div>

      <div class="form-group mb-2">
        <label class="small mb-1">Height</label>
        <input
          type="number"
          class="form-control form-control-sm"
          v-model.number="localField.height"
          @input="onPropertyChange"
          min="10"
        />
      </div>

      <button
        class="btn btn-danger btn-sm w-100 mt-1"
        @click="removeField"
        title="Remove Field"
      >
        <i class="fas fa-trash"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  selectedField: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["field-updated", "field-removed"]);

const localField = ref({});

watch(
  () => props.selectedField,
  (newField) => {
    if (newField) {
      localField.value = { ...newField };
    } else {
      localField.value = {};
    }
  },
  { immediate: true, deep: true }
);

function onPropertyChange() {
  if (!localField.value || !props.selectedField) return;

  emit("field-updated", {
    instanceId: props.selectedField.instanceId,
    updates: {
      x: localField.value.x,
      y: localField.value.y,
      width: localField.value.width,
      height: localField.value.height,
    },
  });
}

function removeField() {
  if (!props.selectedField) return;

  emit("field-removed", props.selectedField.instanceId);
}
</script>

<style scoped>
@media (max-width: 768px) {
  .form-control-sm {
    font-size: 0.875rem;
  }
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.card-secondary .card-header {
  background-color: #6c757d;
  border-color: #6c757d;
}
</style>
