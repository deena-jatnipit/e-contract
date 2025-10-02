<template>
  <div class="card card-primary">
    <div class="card-header">
      <h3 class="card-title">Available Fields</h3>
    </div>
    <div class="card-body" style="max-height: 300px; overflow-y: auto">
      <ul class="list-group list-group-flush">
        <li
          v-for="field in availableFields"
          :key="field.id"
          class="list-group-item d-flex justify-content-between align-items-center px-0 py-2"
        >
          <span v-if="field.label && field.label.trim()" class="small">
            <i :class="field.icon || 'fas fa-edit'" class="me-1"></i>
            {{ field.label }}
          </span>
          <span v-else class="small">
            <i :class="field.icon || 'fas fa-edit'" class="me-1"></i>
            {{ field.name }}
          </span>
          <button class="btn btn-sm btn-success" @click="addField(field)">
            Add
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(["field-added"]);

const supabase = useSupabaseClient();
const availableFields = ref([]);

async function fetchFields() {
  try {
    const { data, error } = await supabase
      .from("contract_fields")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching fields:", error);
    } else {
      availableFields.value = data || [];
    }
  } catch (err) {
    console.error("Error fetching fields:", err);
  }
}

function addField(field) {
  emit("field-added", field);
}

onMounted(async () => {
  await fetchFields();
});
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.card-primary .card-header {
  background-color: #007bff;
  border-color: #007bff;
}
</style>
