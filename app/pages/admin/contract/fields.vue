<template>
  <div>
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">All Fields</h3>
        <div class="card-tools">
          <button
            class="btn btn-primary btn-sm"
            data-toggle="modal"
            data-target="#addFieldModal"
          >
            <i class="fas fa-plus"></i> Add New Field
          </button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-bordered table-striped">
            <thead>
              <tr>
                <th style="width: 10px">#</th>
                <th>Field Name</th>
                <th>Field Label</th>
                <th style="width: 150px">Field Type</th>
                <th class="text-center" style="width: 100px">User Input</th>
                <th class="text-center" style="width: 180px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(field, index) in fields" :key="field.id">
                <td>{{ index + 1 }}.</td>
                <td>{{ field.name }}</td>
                <td>{{ field.label }}</td>
                <td>
                  <span class="badge bg-info">{{ field.type }}</span>
                </td>
                <td class="text-center">
                  <span
                    class="badge"
                    :class="field.is_fillable ? 'bg-success' : 'bg-danger'"
                  >
                    {{ field.is_fillable ? "Yes" : "No" }}
                  </span>
                </td>
                <td class="text-center">
                  <button
                    class="btn btn-warning btn-sm"
                    @click="openEditModal(field)"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="btn btn-danger btn-sm ml-2"
                    @click="deleteField(field.id)"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="!fields || fields.length === 0">
                <td colspan="8" class="text-center">No fields found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      class="modal fade"
      id="addFieldModal"
      tabindex="-1"
      role="dialog"
      aria-labelledby="addFieldModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="addFieldModalLabel">
              {{ isEditing ? "Edit Field" : "Add New Field" }}
            </h5>
            <button
              type="button"
              class="close"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <form @submit.prevent="saveField">
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="fieldName">Field Name</label>
                    <input
                      type="text"
                      class="form-control"
                      id="fieldName"
                      v-model="currentField.name"
                      required
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="fieldType">Field Type</label>
                    <select
                      class="form-control"
                      id="fieldType"
                      v-model="currentField.type"
                      required
                    >
                      <option>Text</option>
                      <option>Credit number</option>
                      <option>Signature</option>
                      <option>Icon</option>
                    </select>
                  </div>
                </div>
              </div>

              <div
                v-if="
                  currentField.type !== 'Icon' &&
                  currentField.type !== 'Signature' &&
                  !currentField.is_fillable
                "
                class="form-group"
              >
                <label for="fieldLabel">
                  Field Label
                  <span class="text-danger">*</span>
                </label>
                <input
                  type="text"
                  class="form-control"
                  id="fieldLabel"
                  v-model="currentField.label"
                  required
                />
              </div>

              <div v-if="currentField.type === 'Icon'" class="form-group">
                <label for="fieldIcon">Select Icon</label>
                <div class="input-group">
                  <select
                    class="form-control"
                    id="fieldIcon"
                    v-model="currentField.icon"
                    required
                  >
                    <option value="" hidden>Select an icon</option>
                    <option
                      v-for="icon in availableIcons"
                      :key="icon.class"
                      :value="icon.class"
                    >
                      {{ icon.name }}
                    </option>
                  </select>
                  <div v-if="currentField.icon" class="input-group-append">
                    <span class="input-group-text">
                      <i :class="currentField.icon"></i>
                    </span>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="fieldWidth">Default Width (px)</label>
                    <input
                      type="number"
                      class="form-control"
                      id="fieldWidth"
                      v-model.number="currentField.default_width"
                      min="10"
                      max="1000"
                      required
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="fieldHeight">Default Height (px)</label>
                    <input
                      type="number"
                      class="form-control"
                      id="fieldHeight"
                      v-model.number="currentField.default_height"
                      min="10"
                      max="500"
                      required
                    />
                  </div>
                </div>
              </div>

              <!-- Only show User Input checkbox for Text type -->
              <div
                v-if="
                  currentField.type === 'Text' ||
                  currentField.type === 'Credit number'
                "
                class="form-group"
              >
                <div class="form-check">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    id="fieldIsFillable"
                    v-model="currentField.is_fillable"
                    @change="onFillableChange"
                  />
                  <label class="form-check-label" for="fieldIsFillable">
                    User Input?
                  </label>
                </div>
                <small class="form-text text-muted">
                  Check if this field should be filled by users. Uncheck if it
                  displays static content.
                </small>
              </div>

              <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-dismiss="modal"
                @click="resetForm"
              >
                Close
              </button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? "Saving..." : "Save Field" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const fields = ref([]);
const loading = ref(false);
const errorMessage = ref(null);
const isEditing = ref(false);

const availableIcons = ref([
  { name: "Signature", class: "fas fa-signature" },
  { name: "Check Mark", class: "fas fa-check" },
  { name: "Stamp", class: "fas fa-stamp" },
  { name: "Certificate", class: "fas fa-certificate" },
  { name: "File", class: "fas fa-file-alt" },
  { name: "User", class: "fas fa-user" },
  { name: "Calendar", class: "fas fa-calendar" },
  { name: "Clock", class: "fas fa-clock" },
  { name: "Building", class: "fas fa-building" },
  { name: "Company", class: "fas fa-landmark" },
  { name: "Phone", class: "fas fa-phone" },
  { name: "Email", class: "fas fa-envelope" },
  { name: "Location", class: "fas fa-map-marker-alt" },
  { name: "Document", class: "fas fa-file-contract" },
  { name: "Money", class: "fas fa-money-bill" },
]);

const currentField = ref({
  id: null,
  name: "",
  label: "",
  type: "Text",
  icon: "",
  default_width: 150,
  default_height: 40,
  is_fillable: false,
});

async function getFields() {
  try {
    const { data, error } = await supabase
      .from("contract_fields")
      .select(
        "id, name, label, type, icon, default_width, default_height, is_fillable"
      )
      .order("name");

    if (error) throw error;
    fields.value = data;
  } catch (error) {
    console.error("Error fetching fields:", error);
  }
}

function openEditModal(field) {
  isEditing.value = true;
  currentField.value = {
    ...field,
    // Ensure numeric values for form inputs
    default_width: field.default_width || 150,
    default_height: field.default_height || 40,
    icon: field.icon || "",
  };
  $("#addFieldModal").modal("show");
}

function resetForm() {
  isEditing.value = false;
  currentField.value = {
    id: null,
    name: "",
    label: "",
    type: "Text",
    icon: "",
    default_width: 150,
    default_height: 40,
    is_fillable: false,
  };
  errorMessage.value = null;
}

function onFillableChange() {
  if (currentField.value.is_fillable) {
    currentField.value.label = ""; // Clear the label when is_fillable is checked
  }
}

async function saveField() {
  loading.value = true;
  errorMessage.value = null;

  if (
    !currentField.value.is_fillable &&
    currentField.value.type !== "Signature" &&
    currentField.value.type !== "Icon" &&
    !currentField.value.label.trim()
  ) {
    errorMessage.value = "Label is required for non-fillable fields";
    loading.value = false;
    return;
  }

  // Validate dimensions
  if (
    currentField.value.default_width < 10 ||
    currentField.value.default_width > 1000
  ) {
    errorMessage.value = "Width must be between 10 and 1000 pixels";
    loading.value = false;
    return;
  }

  if (
    currentField.value.default_height < 10 ||
    currentField.value.default_height > 500
  ) {
    errorMessage.value = "Height must be between 10 and 500 pixels";
    loading.value = false;
    return;
  }

  try {
    let error;
    const fieldData = {
      name: currentField.value.name,
      label:
        currentField.value.type === "Signature" ||
        currentField.value.type === "Icon"
          ? ""
          : currentField.value.label,
      type: currentField.value.type,
      icon: currentField.value.icon || null,
      default_width: currentField.value.default_width,
      default_height: currentField.value.default_height,
      is_fillable: currentField.value.is_fillable,
    };

    if (isEditing.value) {
      ({ error } = await supabase
        .from("contract_fields")
        .update(fieldData)
        .eq("id", currentField.value.id));
    } else {
      ({ error } = await supabase.from("contract_fields").insert([fieldData]));
    }

    if (error) throw error;

    const modalElement = $("#addFieldModal");
    modalElement.modal("hide");

    modalElement.one("hidden.bs.modal", function () {
      $(".modal-backdrop").remove();
      $("body").removeClass("modal-open").css("padding-right", "");
      resetForm();
    });

    await getFields();
  } catch (err) {
    console.error("Error saving field:", err);
    errorMessage.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function deleteField(fieldId) {
  if (!window.confirm("Are you sure you want to delete this field?")) {
    return;
  }
  try {
    const { error } = await supabase
      .from("contract_fields")
      .delete()
      .eq("id", fieldId);
    if (error) throw error;
    await getFields();
  } catch (error) {
    console.error("Error deleting field:", error);
  }
}

onMounted(async () => {
  await getFields();

  await nextTick();

  $("#addFieldModal").on("hide.bs.modal", function () {
    resetForm();
  });
});

watch(
  () => currentField.value.type,
  (newType) => {
    if (newType === "Signature" || newType === "Icon") {
      currentField.value.label = "";
    }

    // Reset is_fillable when changing away from Text type
    if (newType !== "Text") {
      currentField.value.is_fillable = false;
    }
  }
);
</script>

<style scoped>
.input-group-text {
  min-width: 60px;
  justify-content: center;
}

.input-group-text i {
  font-size: 1.1em;
}

select.form-control {
  height: calc(2.25rem + 2px);
}
</style>
