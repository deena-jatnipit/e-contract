<template>
  <div class="container-fluid">
    <div class="card card-primary shadow-sm">
      <div class="card-header bg-gradient-primary">
        <h3 class="card-title text-white">
          <i class="fas fa-file-alt mr-2"></i>Document Status
        </h3>
        <div class="card-tools">
          <button
            class="btn btn-light btn-sm px-4"
            data-toggle="modal"
            data-target="#sendLinkModal"
          >
            <i class="fas fa-paper-plane mr-2"></i> Send Document Link
          </button>
        </div>
      </div>
      <div class="card-body p-3">
        <div class="table-responsive">
          <table class="table custom-table">
            <thead>
              <tr>
                <th class="text-center" style="width: 50px">#</th>
                <th>Template Name</th>
                <th>Send to</th>
                <th class="text-center" style="width: 100px">Provider</th>
                <th class="text-center" style="width: 250px">Status</th>
                <th class="text-center" style="width: 150px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(document, index) in documents" :key="document.id">
                <td class="text-center text-muted">{{ index + 1 }}</td>
                <td>
                  <span class="font-weight-medium">{{
                    document.contract_templates.name
                  }}</span>
                </td>
                <td>
                  <div class="d-flex align-items-center">
                    <i class="fas fa-user-circle text-muted mr-2"></i>
                    <span>{{
                      document.customer_profile_id.customers.display_name
                    }}</span>
                  </div>
                </td>
                <td class="text-center">
                  <span
                    class="provider-badge"
                    :class="'provider-' + document.provider"
                  >
                    <i
                      :class="
                        document.provider === 'line'
                          ? 'fab fa-line'
                          : 'fas fa-comment-dots'
                      "
                    ></i>
                    {{ document.provider }}
                  </span>
                </td>
                <td class="text-center">
                  <span
                    class="status-badge"
                    :class="'status-' + document.status"
                  >
                    {{ document.status }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="action-buttons">
                    <button
                      class="btn btn-icon"
                      @click="previewDocument(document.document_url)"
                      data-toggle="modal"
                      data-target="#previewModal"
                      :disabled="!document.document_url"
                      title="Preview"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button
                      class="btn btn-icon"
                      @click="downloadDocument(document.document_url)"
                      title="Download"
                    >
                      <i class="fas fa-download"></i>
                    </button>
                    <button
                      class="btn btn-icon text-danger"
                      @click="handleDeleteDocument(document.id)"
                      title="Delete"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!documents || documents.length === 0">
                <td colspan="6" class="text-center py-4">
                  <div class="empty-state">
                    <i class="fas fa-file-alt fa-2x text-muted mb-2"></i>
                    <p class="text-muted">No documents found.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Document Preview Modal -->
  <div
    class="modal fade"
    id="previewModal"
    tabindex="-1"
    role="dialog"
    aria-labelledby="previewModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-xl" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h4 class="modal-title" id="previewModalLabel">Document Preview</h4>
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
          <div class="document-preview-container">
            <img
              v-if="previewImageUrl"
              :src="previewImageUrl"
              alt="Document Preview"
            />
            <div v-else class="text-center p-4">
              <i class="fas fa-spinner fa-spin fa-2x"></i>
              <p class="mt-2">Loading preview...</p>
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

  <!-- Send Link Modal -->
  <div
    class="modal fade"
    id="sendLinkModal"
    tabindex="-1"
    role="dialog"
    aria-labelledby="sendLinkModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="sendLinkModalLabel">Send Link to User</h5>
          <button
            type="button"
            class="close"
            data-dismiss="modal"
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="modal-body">
            <div class="form-group">
              <label for="templateSelect">Select Template</label>
              <select
                id="templateSelect"
                class="form-control"
                v-model="selectedTemplateId"
                required
              >
                <option :value="null" hidden>Select a template</option>
                <option
                  v-for="template in templates"
                  :key="template.id"
                  :value="template.id"
                >
                  {{ template.name }}
                </option>
              </select>
            </div>

            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="fullName">Full name</label>
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control"
                      id="fullName"
                      v-model="fullName"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="carRegistrationNumber"
                    >Car Registration Number</label
                  >
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control"
                      id="carRegistrationNumber"
                      v-model="carRegistrationNumber"
                      placeholder="Enter car registration number"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="providerSelect">Select Provider</label>
              <select
                id="providerSelect"
                class="form-control"
                v-model="provider"
                required
              >
                <option value="line">Line</option>
                <option value="sms">SMS</option>
              </select>
            </div>

            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="customerLine">Select Customer Line</label>
                  <select
                    id="customerLine"
                    class="form-control"
                    v-model="selectedCustomerProfile"
                    required
                  >
                    <option :value="null" hidden>Select a customer</option>
                    <option
                      v-for="profile in filteredCustomerProfiles"
                      :key="profile.id"
                      :value="profile"
                    >
                      {{
                        getCustomerDisplayNameFromProfile(
                          profile,
                          customers.value
                        )
                      }}
                    </option>
                    <option
                      v-if="
                        filteredCustomerProfiles.length === 0 &&
                        (fullName || carRegistrationNumber)
                      "
                      :value="null"
                      disabled
                    >
                      No customers found matching the criteria
                    </option>
                  </select>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="phoneNumber">Phone Number</label>
                  <div class="input-group">
                    <input
                      type="tel"
                      class="form-control"
                      id="phoneNumber"
                      v-model="phoneNumber"
                      placeholder="Enter phone number"
                      maxlength="10"
                      required
                      @input="handlePhoneInput"
                    />
                  </div>
                  <div
                    v-if="!isPhoneValid && phoneNumber"
                    class="text-danger small mt-1"
                  >
                    Please enter a valid 10-digit phone number starting with 0
                  </div>
                </div>
              </div>
            </div>
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
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="loading || !isPhoneValid"
            >
              {{ loading ? "Sending..." : "Send Link" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
const PROJECT_BASE_URL = useRuntimeConfig().public.projectBaseUrl;

const selectedTemplateId = ref(null);
const selectedUserId = ref(null);
const phoneNumber = ref("");
const fullName = ref("");
const carRegistrationNumber = ref("");
const templates = ref([]);
const documents = ref([]);
const customers = ref([]);
const customerProfiles = ref([]);
const loading = ref(false);
const provider = ref("line");
const previewImageUrl = ref(null);
const selectedCustomerProfile = ref(null);

// Computed property to validate phone number
const isPhoneValid = computed(() => {
  const cleaned = phoneNumber.value.replace(/\D/g, "");
  return cleaned.length === 10 && cleaned.startsWith("0");
});

// Computed property to filter customer profiles based on fullName and carRegistrationNumber
const filteredCustomerProfiles = computed(() => {
  if (!fullName.value.trim() && !carRegistrationNumber.value.trim()) {
    return customerProfiles.value;
  }

  return customerProfiles.value.filter((profile) => {
    let matchesName = true;
    let matchesCar = true;

    if (fullName.value.trim()) {
      matchesName =
        profile.full_name &&
        profile.full_name
          .toLowerCase()
          .includes(fullName.value.toLowerCase().trim());
    }

    if (carRegistrationNumber.value.trim()) {
      matchesCar =
        profile.car_registration_number &&
        profile.car_registration_number
          .toLowerCase()
          .includes(carRegistrationNumber.value.toLowerCase().trim());
    }

    return matchesName && matchesCar;
  });
});

// Handle document preview
function previewDocument(documentUrl) {
  previewImageUrl.value = documentUrl;
}

// Handle phone input to allow only digits
function handlePhoneInput(event) {
  const value = event.target.value.replace(/\D/g, "");
  phoneNumber.value = value;
}

const {
  generateSecureToken,
  getCustomerDisplayNameFromProfile,
  fetchTemplates: fetchTemplatesApi,
  fetchDocuments: fetchDocumentsApi,
  fetchCustomers: fetchCustomersApi,
  fetchCustomerProfiles: fetchCustomerProfilesApi,
  savePhoneNumber: savePhoneNumberApi,
  saveDocument: saveDocumentApi,
  deleteDocument: deleteDocumentApi,
  downloadDocument: downloadDocumentApi,
} = useDocument();

function resetForm() {
  selectedTemplateId.value = null;
  phoneNumber.value = "";
  fullName.value = "";
  carRegistrationNumber.value = "";
  selectedUserId.value = null;
  selectedCustomerProfile.value = null;
}

async function fetchTemplates() {
  try {
    templates.value = await fetchTemplatesApi();
  } catch (error) {
    console.error("Error fetching templates:", error);
  }
}

async function fetchDocuments() {
  try {
    documents.value = await fetchDocumentsApi();
  } catch (error) {
    console.error("Error fetching documents:", error);
  }
}

async function fetchCustomers() {
  try {
    customers.value = await fetchCustomersApi();
  } catch (error) {
    console.error("Error fetching customers:", error);
  }
}

async function fetchCustomerProfiles() {
  try {
    customerProfiles.value = await fetchCustomerProfilesApi();
  } catch (error) {
    console.error("Error fetching customer profiles:", error);
  }
}

async function savePhoneNumber(phoneNumber) {
  return await savePhoneNumberApi(
    selectedCustomerProfile.value.id,
    phoneNumber
  );
}

async function saveDocument(token) {
  return await saveDocumentApi(
    selectedTemplateId.value,
    selectedCustomerProfile.value.id,
    provider.value,
    token
  );
}

async function deleteDocument(documentId) {
  const success = await deleteDocumentApi(documentId);
  if (success) {
    await fetchDocuments();
  }
}

async function downloadDocument(documentUrl) {
  const success = await downloadDocumentApi(documentUrl);
  if (!success) {
    alert("Failed to download document. Please try again.");
  }
}

async function sendSms(documentId, token) {
  try {
    const message = `กรุณาคลิกลิ้งเพื่อเซ็นลายเซ็น ${projectBaseUrl}/user/sms/otp?documentId=${documentId}&token=${token}`;

    const response = await $fetch("/api/sms/send-message", {
      method: "POST",
      body: {
        msisdn: phoneNumber,
        message,
      },
    });

    if (response?.error) throw new Error(response.error);
    return response;
  } catch (error) {
    throw error;
  }
}

async function sendLine(documentId, token) {
  try {
    const message = `กรุณาคลิกลิ้งเพื่อเซ็นลายเซ็น ${projectBaseUrl}/user/line/otp?documentId=${documentId}&token=${token}`;

    const response = await $fetch("/api/line/send-message", {
      method: "POST",
      body: {
        userId: userId,
        message: message,
      },
    });

    if (response?.error) throw new Error(response.error);
    return response;
  } catch (error) {
    throw error;
  }
}

async function handleSubmit() {
  if (!selectedTemplateId.value) {
    alert("Please select a template.");
    return;
  }

  if (!selectedCustomerProfile.value) {
    alert("Please select a customer.");
    return;
  }

  if (!provider.value) {
    alert("Please select a provider.");
    return;
  }

  if (!phoneNumber.value || !isPhoneValid.value) {
    alert("Please enter a valid 10-digit phone number starting with 0.");
    return;
  }

  let documentResult = null;
  const cleanedPhoneNumber = phoneNumber.value.replace(/\D/g, "");

  try {
    loading.value = true;
    const token = generateSecureToken();

    if (provider.value === "sms") {
      documentResult = await saveDocument(token);

      if (!documentResult) {
        throw new Error("Failed to save document");
      }

      const smsResult = await sendSms(documentResult.id, token);

      if (smsResult?.error) {
        throw new Error(smsResult.error);
      }
    }

    if (provider.value === "line") {
      documentResult = await saveDocument(token);

      if (!documentResult) {
        throw new Error("Failed to save document");
      }

      const customerResult = await savePhoneNumber(cleanedPhoneNumber);

      if (!customerResult) {
        throw new Error("Failed to save phone number");
      }

      // Send Line message using phone number as identity
      const lineResult = await sendLine(documentResult.id, token);

      if (lineResult?.error) {
        throw new Error(lineResult.error);
      }
    }
  } catch (error) {
    console.error("Error in handleSubmit:", error);

    if (documentResult?.id) {
      await deleteDocument(documentResult.id);
    }

    if (error.response?.status === 400) {
      alert("Invalid request. Please check your input.");
    } else if (error.response?.status === 500) {
      alert("Server error. Please try again later.");
    } else {
      alert(`An error occurred: ${error.message || "Please try again."}`);
    }
  } finally {
    const modalElement = $("#sendLinkModal");
    modalElement.modal("hide");

    modalElement.one("hidden.bs.modal", function () {
      $(".modal-backdrop").remove();
      $("body").removeClass("modal-open").css("padding-right", "");
      resetForm();
      fetchDocuments();
    });

    loading.value = false;
  }
}

async function handleDeleteDocument(documentId) {
  if (!window.confirm("Are you sure you want to delete this document?")) {
    return;
  }

  await deleteDocument(documentId);
}

watch(selectedCustomerProfile, (newProfile) => {
  if (newProfile) {
    selectedUserId.value = newProfile.customer_id;

    if (newProfile.phone_number) {
      phoneNumber.value = newProfile.phone_number;
    }

    if (
      !fullName.value.trim() ||
      fullName.value.trim() !== newProfile.full_name?.trim()
    ) {
      if (newProfile.full_name) {
        fullName.value = newProfile.full_name;
      }
    }

    if (
      !carRegistrationNumber.value.trim() ||
      carRegistrationNumber.value.trim() !==
        newProfile.car_registration_number?.trim()
    ) {
      if (newProfile.car_registration_number) {
        carRegistrationNumber.value = newProfile.car_registration_number;
      }
    }
  } else {
    selectedUserId.value = null;
    phoneNumber.value = "";
  }
});

watch([fullName, carRegistrationNumber], () => {
  if (selectedCustomerProfile.value) {
    const isStillValid = filteredCustomerProfiles.value.some(
      (profile) => profile.id === selectedCustomerProfile.value.id
    );

    if (!isStillValid) {
      selectedCustomerProfile.value = null;
      selectedUserId.value = null;
      phoneNumber.value = "";
    }
  }
});

onMounted(async () => {
  await fetchDocuments();
  await fetchTemplates();
  await fetchCustomers();
  await fetchCustomerProfiles();
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

/* Alert Enhancements */
.alert {
  border-radius: 8px;
  border: none;
  border-left: 4px solid;
}

.border-left-info {
  border-left-color: #17a2b8;
  background-color: #d1ecf1;
}

.border-left-success {
  border-left-color: #28a745;
  background-color: #d4edda;
}

.border-left-danger {
  border-left-color: #dc3545;
  background-color: #f8d7da;
}

/* Form Control Enhancement */
.form-control-lg {
  border-radius: 6px;
  padding: 0.75rem 1rem;
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
}

.btn-lg:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-lg:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Label Enhancement */
label.font-weight-semibold {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

/* Document Preview Container */
.document-preview-container {
  position: relative;
  border: 1px dashed #6c757d;
  background-color: #f8f9fa;
  background-image:
    linear-gradient(45deg, #eee 25%, transparent 25%),
    linear-gradient(-45deg, #eee 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #eee 75%),
    linear-gradient(-45deg, transparent 75%, #eee 75%);
  background-size: 20px 20px;
  min-height: 400px;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
}

.document-preview-container img {
  width: 100%;
  height: auto;
  display: block;
  pointer-events: none;
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

/* Status Badge */
.status-badge {
  padding: 0.35rem 0.8rem;
  border-radius: 50rem;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-sent {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-pending {
  background-color: #fff3e0;
  color: #ef6c00;
}

.status-completed {
  background-color: #e3f2fd;
  color: #1976d2;
}

/* Provider Badge */
.provider-badge {
  padding: 0.35rem 0.8rem;
  border-radius: 50rem;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.provider-line {
  background-color: #e9fae9;
  color: #06c755;
}

.provider-sms {
  background-color: #e8eaf6;
  color: #3949ab;
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

@media (max-width: 820px) {
  .document-preview-container {
    width: 100% !important;
    margin: 0 !important;
  }

  .document-preview-container img {
    width: 100% !important;
  }
}
</style>
