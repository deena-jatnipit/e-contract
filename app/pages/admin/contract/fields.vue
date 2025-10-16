<template>
  <div>
    <div class="card card-primary shadow-sm">
      <div class="card-header bg-gradient-primary">
        <h3 class="card-title text-white">
          <i class="fas fa-list-alt mr-2"></i>All Fields
        </h3>
        <div class="card-tools">
          <button
            class="btn btn-light btn-sm px-4"
            data-toggle="modal"
            data-target="#addFieldModal"
          >
            <i class="fas fa-plus mr-2"></i> Add New Field
          </button>
        </div>
      </div>
      <div class="card-body p-3">
        <div class="table-responsive">
          <table class="table custom-table">
            <thead>
              <tr>
                <th class="text-center" style="width: 50px">#</th>
                <th>Field Name</th>
                <th>Field Label</th>
                <th class="text-center" style="width: 200px">Field Type</th>
                <th class="text-center" style="width: 100px">User Input</th>
                <th class="text-center" style="width: 150px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(field, index) in fields" :key="field.id">
                <td class="text-center text-muted">{{ index + 1 }}</td>
                <td>
                  <span class="font-weight-medium">{{ field.name }}</span>
                </td>
                <td>{{ field.label || "-" }}</td>
                <td class="text-center">
                  <span
                    class="type-badge"
                    :class="
                      'type-' + field.type.toLowerCase().replace(' ', '-')
                    "
                  >
                    <i class="fas" :class="getTypeIcon(field.type)"></i>
                    {{ field.type }}
                  </span>
                </td>
                <td class="text-center">
                  <span
                    class="status-badge"
                    :class="
                      field.is_fillable ? 'status-active' : 'status-inactive'
                    "
                  >
                    {{ field.is_fillable ? "Yes" : "No" }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="action-buttons">
                    <button
                      class="btn btn-icon"
                      @click="openEditModal(field)"
                      title="Edit"
                    >
                      <i class="fas fa-edit text-warning"></i>
                    </button>
                    <button
                      class="btn btn-icon text-danger"
                      @click="deleteField(field.id)"
                      title="Delete"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!fields || fields.length === 0">
                <td colspan="6" class="text-center py-4">
                  <div class="empty-state">
                    <i class="fas fa-list-alt fa-2x text-muted mb-2"></i>
                    <p class="text-muted">No fields found.</p>
                  </div>
                </td>
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
              <i class="fas fa-edit text-primary mr-2"></i>
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
            <div class="modal-body p-4">
              <div class="row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label class="font-weight-semibold">
                      <i class="fas fa-tag text-primary mr-1"></i>Field Name
                    </label>
                    <input
                      type="text"
                      class="form-control form-control-lg"
                      id="fieldName"
                      v-model="currentField.name"
                      placeholder="Enter field name"
                      required
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label class="font-weight-semibold">
                      <i class="fas fa-cube text-primary mr-1"></i>Field Type
                    </label>
                    <select
                      class="form-control form-control-lg"
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

// Helper function to get icon for field type
function getTypeIcon(type) {
  switch (type) {
    case "Text":
      return "fa-font";
    case "Credit number":
      return "fa-credit-card";
    case "Signature":
      return "fa-signature";
    case "Icon":
      return "fa-icons";
    default:
      return "fa-cube";
  }
}

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
/* Card Enhancement */
.card {
  border: none;
  border-radius: 10px;
  overflow: hidden;
}

.card-body {
  background-color: #ffffff;
}

/* Form Control Enhancement */
.form-control-lg {
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
}

.form-control-lg:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.15);
}

/* Button Enhancement */
.btn-lg {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 0.4rem 1.2rem;
  font-size: 0.95rem;
}

.btn-lg:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.25);
}

/* Table Enhancements */
.custom-table {
  margin-bottom: 0;
  border-spacing: 0 0.5rem !important;
  border-collapse: separate !important;
}

.custom-table th {
  background-color: #f8f9fa;
  border: none;
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
  padding: 1rem;
}

.custom-table td {
  padding: 1rem;
  vertical-align: middle;
  background-color: #ffffff;
  border: none;
  border-top: 1px solid #f0f0f0;
  font-size: 0.95rem;
}

.custom-table tbody tr:hover td {
  background-color: #f8f9fa;
}

/* Type Badge */
.type-badge {
  padding: 0.35rem 0.8rem;
  border-radius: 50rem;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.type-text {
  background-color: #e3f2fd;
  color: #1976d2;
}

.type-credit-number {
  background-color: #fff3e0;
  color: #ef6c00;
}

.type-signature {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.type-icon {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

/* Status Badge */
.status-badge {
  padding: 0.35rem 0.8rem;
  border-radius: 50rem;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-inactive {
  background-color: #f5f5f5;
  color: #757575;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  background-color: #ffffff;
  color: #495057;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background-color: #f8f9fa;
  border-color: #c1c9d0;
  transform: translateY(-1px);
}

.btn-icon:active {
  transform: translateY(0);
}

/* Input Group */
.input-group-text {
  min-width: 60px;
  justify-content: center;
  background-color: #f8f9fa;
  border-color: #dee2e6;
}

.input-group-text i {
  font-size: 1.1em;
  color: #495057;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: #6c757d;
}

.empty-state i {
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
}

/* Font Weight Helper */
.font-weight-medium {
  font-weight: 500;
}

/* Modal Enhancements */
.modal-content {
  border: none;
  border-radius: 10px;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.modal-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.modal-footer {
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
}
</style>
