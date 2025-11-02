<template>
  <div>
    <div class="card card-primary shadow-sm">
      <div class="card-header bg-gradient-primary">
        <h3 class="card-title text-white">
          <i class="fas fa-file-alt mr-2"></i>All Templates
        </h3>
        <div class="card-tools">
          <button class="btn btn-light btn-sm px-4" @click="openCreate">
            <i class="fas fa-plus mr-2"></i>Add New Template
          </button>
        </div>
      </div>
      <div class="card-body p-3">
        <div class="table-responsive">
          <table class="table custom-table">
            <thead>
              <tr>
                <th style="width: 10px">#</th>
                <th>Template Name</th>
                <th>Contract Name</th>
                <th>Fields</th>
                <th class="text-center" style="width: 220px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(template, index) in templates" :key="template.id">
                <td class="text-center text-muted">{{ index + 1 }}</td>
                <td>
                  <span class="font-weight-medium">{{ template.name }}</span>
                </td>
                <td>{{ template.contracts.name }}</td>
                <td style="width: 650px">
                  <div class="d-flex flex-wrap gap-1">
                    <!-- Display grouped fields -->
                    <template
                      v-for="group in getGroupedFields(
                        template.placed_fields_data
                      )"
                      :key="group.key"
                    >
                      <!-- Single fields or default fields -->
                      <span
                        v-if="!group.isGroup"
                        class="badge mr-1"
                        :class="getFieldBadgeClass(group.field)"
                        :title="getFieldTooltip(group.field)"
                      >
                        {{ getFieldLabel(group.field) }}
                      </span>

                      <!-- Grouped fields -->
                      <span
                        v-else
                        class="badge badge-secondary mr-1"
                        :title="`Grouped field: ${group.label} (${group.count} characters)`"
                      >
                        {{ group.label }} ({{ group.count }})
                      </span>
                    </template>
                  </div>
                </td>
                <td class="text-center">
                  <div class="action-buttons">
                    <button
                      class="btn-icon text-info"
                      @click="openPreview(template)"
                      title="Preview Template"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button
                      class="btn-icon text-warning"
                      @click="openEdit(template.id)"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      class="btn-icon text-danger"
                      @click="
                        deleteTemplate(
                          template.id,
                          template.composite_image_url
                        )
                      "
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!templates || templates.length === 0">
                <td colspan="5" class="text-center">No templates found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Image Preview Modal -->
    <PreviewImageModal
      v-if="selectedTemplate && selectedTemplate.file_type !== 'pdf'"
      :template="selectedTemplate"
      :displayFields="displayFields"
      :previewImageUrl="previewImageUrl"
      modalId="previewModal"
      modalLabelId="previewModalLabel"
    />

    <!-- PDF Preview Modal -->
    <PreviewPdfModal
      v-if="selectedTemplate && selectedTemplate.file_type === 'pdf'"
      :template="selectedTemplate"
      :displayFields="displayFields"
      :pdfUrl="previewImageUrl"
      modalId="pdfPreviewModal"
      modalLabelId="pdfPreviewModalLabel"
    />
  </div>
</template>

<script setup>
definePageMeta({ layout: "admin" });

import PreviewImageModal from "~/components/preview/PreviewImageModal.vue";
import PreviewPdfModal from "~/components/preview/PreviewPdfModal.vue";

const supabase = useSupabaseClient();
const router = useRouter();

const templates = ref([]);
const contractFields = ref([]);
const selectedTemplate = ref(null);
const displayFields = ref([]);
const previewImageUrl = ref(null);

async function getTemplates() {
  try {
    // First fetch contract fields for mapping
    const { data: fieldsData } = await supabase
      .from("contract_fields")
      .select("id, name, label, type, icon, is_fillable");

    contractFields.value = fieldsData || [];

    // Then fetch templates (include file_type)
    const { data } = await supabase
      .from("contract_templates")
      .select(
        "id, name, contracts (id, name), placed_fields_data, background_image_url, composite_image_url, image_width, image_height, file_type"
      );

    templates.value = data;
  } catch (error) {
    console.error("Error fetching templates:", error);
  }
}

function openCreate() {
  router.push({ path: "/admin/contract/template/create" });
}

function openEdit(templateId) {
  router.push({
    path: "/admin/contract/template/edit",
    query: { id: templateId },
  });
}

function openPreview(template) {
  selectedTemplate.value = template;
  previewImageUrl.value = template.background_image_url || null;

  // Process fields for display
  const fieldsData = Array.isArray(template.placed_fields_data)
    ? template.placed_fields_data
    : [];

  displayFields.value = fieldsData.map((field) => {
    let mergedField = { ...field };

    // Handle default fields by checking field.id string patterns
    if (typeof field.id === "string") {
      if (field.id === "default-checkmark") {
        mergedField = {
          ...field,
          name: "Check Mark",
          label: "",
          type: "Icon",
          icon: "fas fa-check",
        };
      } else if (field.id === "default-signature") {
        mergedField = {
          ...field,
          name: "Signature Box",
          label: "",
          type: "Signature",
          icon: "fas fa-signature",
        };
      }
    } else if (typeof field.id === "number") {
      // Handle database fields
      const availableField = contractFields.value.find(
        (af) => af.id === field.id
      );
      if (availableField) mergedField = { ...availableField, ...field };
    }

    return {
      ...mergedField,
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

  // Show the appropriate modal based on file type
  const modalId =
    template.file_type === "pdf" ? "#pdfPreviewModal" : "#previewModal";
  $(modalId).modal("show");
}

async function deleteTemplate(templateId, compositeImageUrl) {
  if (!window.confirm("Are you sure you want to delete this template?")) {
    return;
  }

  const imagePath = [extractFilePathFromUrl(compositeImageUrl)];

  try {
    const { error } = await supabase
      .from("contract_templates")
      .delete()
      .eq("id", templateId);
    if (error) throw error;

    const { error: storageError } = await supabase.storage
      .from("contract")
      .remove(imagePath);
    if (storageError) throw storageError;

    await getTemplates();
  } catch (error) {
    console.error("Error deleting template:", error);
  }
}

// Helper function to group fields by groupId
function getGroupedFields(fieldsData) {
  if (!fieldsData || !Array.isArray(fieldsData)) return [];

  const groups = {};
  const singles = [];

  fieldsData.forEach((field) => {
    if (field.isGrouped && field.groupId) {
      if (!groups[field.groupId]) {
        groups[field.groupId] = {
          key: field.groupId,
          isGroup: true,
          groupId: field.groupId,
          label: getFieldLabel(field),
          count: field.groupSize || 1,
          fields: [],
        };
      }
      groups[field.groupId].fields.push(field);
    } else {
      singles.push({
        key: field.instanceId || `single_${field.id}`,
        isGroup: false,
        field: field,
      });
    }
  });

  return [...singles, ...Object.values(groups)];
}

// Helper function to get field information
function getFieldInfo(field) {
  // Handle default fields by checking field.id
  if (field.id === "default-checkmark") {
    return {
      label: "Check Mark",
      type: "Icon",
      icon: "fas fa-check",
      is_fillable: false,
    };
  }
  if (field.id === "default-signature") {
    return {
      label: "Signature Box",
      type: "Signature",
      icon: "fas fa-signature",
      is_fillable: false,
    };
  }

  // Find field in contract_fields
  const contractField = contractFields.value.find((f) => f.id === field.id);

  if (contractField) {
    return contractField;
  }

  // Fallback for unknown fields
  return {
    label: `Field ${field.id}`,
    type: "Unknown",
    is_fillable: true,
  };
}

// Helper function to get field label to display
function getFieldLabel(field) {
  const fieldInfo = getFieldInfo(field);
  return fieldInfo.label || fieldInfo.name || `Field ${field.id}`;
}

// Helper function to get appropriate badge class based on is_fillable
function getFieldBadgeClass(field) {
  const fieldInfo = getFieldInfo(field);
  // Convert string 'false'/'true' to boolean, then apply colors
  const isFillable =
    fieldInfo.is_fillable === true || fieldInfo.is_fillable === "true";
  return isFillable ? "badge-warning" : "badge-primary";
}

// Helper function to get tooltip text
function getFieldTooltip(field) {
  const fieldInfo = getFieldInfo(field);
  const isFillable =
    fieldInfo.is_fillable === true || fieldInfo.is_fillable === "true";
  const fillableText = isFillable ? "Fillable" : "Static";
  return `${fieldInfo.label || fieldInfo.name} (${fillableText})`;
}

function extractFilePathFromUrl(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    // Remove empty parts and bucket name, keep the file path
    const relevantParts = pathParts.filter((part) => part);
    if (relevantParts.length >= 3) {
      // Remove 'storage', 'v1', 'object', 'public', bucket_name
      return relevantParts.slice(5).join("/");
    }
  } catch (error) {
    console.error("Error extracting file path from URL:", error);
  }
  return null;
}

onMounted(async () => {
  await getTemplates();
});
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
  padding: 0.5rem;
  vertical-align: middle;
  background-color: #ffffff;
  border: none;
  border-top: 1px solid #f0f0f0;
  font-size: 0.95rem;
}

.custom-table tbody tr:hover td {
  background-color: #f8f9fa;
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

/* Badge Styles */
.gap-1 {
  gap: 0.25rem;
}

.badge {
  padding: 0.35rem 0.8rem;
  border-radius: 50rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.badge-warning {
  background-color: #fff3e0;
  color: #ef6c00;
}

.badge-primary {
  background-color: #e3f2fd;
  color: #1976d2;
}

.badge-secondary {
  background-color: #f5f5f5;
  color: #757575;
}

.d-flex.flex-wrap {
  align-items: center;
}

/* Font Weight Helper */
.font-weight-medium {
  font-weight: 500;
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
</style>
