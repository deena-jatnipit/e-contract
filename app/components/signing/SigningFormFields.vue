<template>
  <div v-if="hasFillableFields" class="card mb-4">
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
          :maxlength="getMaxLength(field)"
          required
          @input="validateField(field)"
        />
        <div
          v-if="fieldErrors[field.instanceId]"
          class="text-danger small mt-1"
        >
          {{ fieldErrors[field.instanceId] }}
        </div>
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
          @input="handleGroupedFieldInput(group.groupId, $event.target.value)"
          type="text"
          class="form-control form-control-lg"
          :placeholder="`Enter ${group.groupSize} characters for ${group.label || group.name}`"
          :maxlength="group.groupSize"
          required
        />
        <div v-if="groupErrors[group.groupId]" class="text-danger small mt-1">
          {{ groupErrors[group.groupId] }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  groupedFillableFields: {
    type: Object,
    required: true,
  },
  formFields: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:formFields", "groupedFieldInput"]);

const fieldErrors = ref({});
const groupErrors = ref({});

const hasFillableFields = computed(() => {
  return (
    props.groupedFillableFields.singleFields.length > 0 ||
    props.groupedFillableFields.groups.length > 0
  );
});

const getMaxLength = (field) => {
  // Set reasonable max length based on field type
  if (field.type === "text") return 255;
  if (field.type === "number") return 20;
  return 100;
};

const validateField = (field) => {
  const value = props.formFields[field.instanceId] || "";

  // Clear previous error
  delete fieldErrors.value[field.instanceId];

  // Basic validation
  if (!value.trim()) {
    fieldErrors.value[field.instanceId] = "This field is required";
    return false;
  }

  // Type-specific validation
  if (field.type === "number" && isNaN(value)) {
    fieldErrors.value[field.instanceId] = "Please enter a valid number";
    return false;
  }

  // Length validation
  const maxLength = getMaxLength(field);
  if (value.length > maxLength) {
    fieldErrors.value[field.instanceId] =
      `Maximum ${maxLength} characters allowed`;
    return false;
  }

  return true;
};

const handleGroupedFieldInput = (groupId, inputValue) => {
  // Clear previous error
  delete groupErrors.value[groupId];

  // Validate length
  if (
    inputValue.length >
    props.groupedFillableFields.groups.find((g) => g.groupId === groupId)
      ?.groupSize
  ) {
    groupErrors.value[groupId] = "Too many characters";
    return;
  }

  emit("groupedFieldInput", groupId, inputValue);
};

const getGroupedFieldValue = (groupId) => {
  const group = props.groupedFillableFields.groups.find(
    (g) => g.groupId === groupId
  );
  return group
    ? group.fields.map((f) => props.formFields[f.instanceId] || "").join("")
    : "";
};

// Watch for form field changes to clear errors
watch(
  () => props.formFields,
  () => {
    // Clear errors when user starts typing
    fieldErrors.value = {};
    groupErrors.value = {};
  },
  { deep: true }
);
</script>

<style scoped>
.form-control:focus {
  border-color: #198754;
  box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.25);
}
</style>
