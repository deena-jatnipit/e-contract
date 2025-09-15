<template>
  <div class="container-fluid">
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Document Status</h3>
        <div class="card-tools">
          <button
            class="btn btn-success btn-sm"
            data-toggle="modal"
            data-target="#sendLinkModal"
          >
            <i class="fas fa-arrow-right"></i> Send Document Link
          </button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-bordered table-striped">
            <thead>
              <tr>
                <th style="width: 10px">#</th>
                <th>Template Name</th>
                <th>Send to</th>
                <th>Provider</th>
                <th>Status</th>
                <th class="text-center" style="width: 180px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(document, index) in documents" :key="document.id">
                <td>{{ index + 1 }}.</td>
                <td>{{ document.contract_templates.name }}</td>
                <td>
                  {{ document.customer_profile_id.customers?.display_name }}
                </td>
                <td>{{ document.provider }}</td>
                <td>{{ document.status }}</td>
                <td class="text-center">
                  <button
                    class="btn btn-info btn-sm"
                    @click="previewDocument(document.document_url)"
                    data-toggle="modal"
                    data-target="#previewModal"
                    :disabled="!document.document_url"
                  >
                    <i class="fas fa-eye"></i>
                  </button>
                  <button
                    class="btn btn-primary btn-sm ml-1"
                    @click="downloadDocument(document.document_url)"
                  >
                    <i class="fas fa-download"></i>
                  </button>
                  <button
                    class="btn btn-danger btn-sm ml-1"
                    @click="handleDeleteDocument(document.id)"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="!documents || documents.length === 0">
                <td colspan="6" class="text-center">No documents found.</td>
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
                      {{ getCustomerDisplayNameFromProfile(profile) }}
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
const supabase = useSupabaseClient();
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

// Get customer display name from profile by looking up in customers table
function getCustomerDisplayNameFromProfile(profile) {
  const customer = customers.value.find((c) => c.id === profile.customer_id);
  const customerName = customer
    ? customer.display_name
    : `Customer ID: ${profile.customer_id}`;

  let displayParts = [customerName];

  if (profile.full_name && profile.full_name !== customerName) {
    displayParts.push(profile.full_name);
  }

  if (profile.car_registration_number) {
    displayParts.push(profile.car_registration_number);
  }

  if (profile.phone_number) {
    displayParts.push(profile.phone_number);
  }

  return displayParts.join(" | ");
}

async function fetchTemplates() {
  try {
    const { data, error } = await supabase
      .from("contract_templates")
      .select("*");

    if (error) {
      throw error;
    } else {
      templates.value = data || [];
    }
  } catch (error) {
    console.error("Error fetching templates:", error);
  }
}

async function fetchDocuments() {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select(
        "id, contract_templates(name), customer_profile_id(customer_id, customers(display_name)), provider, token, status, document_url"
      );

    if (error) {
      throw error;
    } else {
      documents.value = data || [];
    }
  } catch (error) {
    console.error("Error fetching documents:", error);
  }
}

async function fetchCustomers() {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("id, display_name");

    if (error) {
      throw error;
    } else {
      customers.value = data || [];
    }
  } catch (error) {
    console.error("Error fetching customers:", error);
  }
}

async function fetchCustomerProfiles() {
  try {
    const { data, error } = await supabase
      .from("customer_profiles")
      .select("*");

    if (error) {
      throw error;
    } else {
      customerProfiles.value = data || [];
    }
  } catch (error) {
    console.error("Error fetching customer profiles:", error);
  }
}

async function savePhoneNumber(phoneNumber) {
  try {
    const { data, error } = await supabase
      .from("customer_profiles")
      .update({
        phone_number: phoneNumber,
      })
      .eq("id", selectedCustomerProfile.value.id)
      .select()
      .single();

    if (error) {
      throw error;
    } else {
      return data;
    }
  } catch (error) {
    console.error("Error saving phone number:", error);
    return null;
  }
}

async function saveDocument(token) {
  try {
    const { data, error } = await supabase
      .from("documents")
      .insert([
        {
          template_id: selectedTemplateId.value,
          customer_profile_id: selectedCustomerProfile.value.id,
          provider: provider.value,
          status: "sent",
          token: token,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    } else {
      return data;
    }
  } catch (error) {
    console.error("Error saving document:", error);
    return null;
  }
}

async function deleteDocument(documentId) {
  try {
    const { data, error } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (error) {
      throw error;
    } else {
      await fetchDocuments();
    }
  } catch (error) {
    console.error("Error deleting document:", error);
  }
}

async function downloadDocument(documentUrl) {
  try {
    let blob;

    const response = await fetch(documentUrl);
    if (!response.ok) throw new Error("Network response was not ok");
    blob = await response.blob();

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const fileName = documentUrl.split("/").pop().split("?")[0];
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading document:", error);
    alert("Failed to download document. Please try again.");
  }
}

function generateSecureToken(length = 32) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      token += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  return token;
}

function resetForm() {
  selectedTemplateId.value = null;
  phoneNumber.value = "";
  fullName.value = "";
  carRegistrationNumber.value = "";
  selectedUserId.value = null;
  selectedCustomerProfile.value = null;
}

async function sendSms(identity, documentId, token) {
  try {
    const message = `กรุณาคลิกลิ้งเพื่อเซ็นลายเซ็น ${PROJECT_BASE_URL}/user/sms/otp?identity=${identity}&documentId=${documentId}&token=${token}`;

    const response = await $fetch("/api/sms/send-message", {
      method: "POST",
      body: {
        msisdn: identity,
        message,
      },
    });

    if (response?.error) {
      throw new Error(response.error);
    }

    console.log("SMS sent successfully:", response);
    return response;
  } catch (error) {
    throw error;
  }
}

async function sendLine(documentId, token) {
  try {
    const message = `กรุณาคลิกลิ้งเพื่อเซ็นลายเซ็น ${PROJECT_BASE_URL}/user/line/otp?documentId=${documentId}&token=${token}`;

    const response = await $fetch("/api/line/send-message", {
      method: "POST",
      body: {
        userId: selectedUserId.value,
        message: message,
      },
    });

    if (response?.error) {
      throw new Error(response.error);
    }

    console.log("Line message sent successfully:", response);
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
      documentResult = await saveDocument(cleanedPhoneNumber, token);

      if (!documentResult) {
        throw new Error("Failed to save document");
      }

      const smsResult = await sendSms(
        cleanedPhoneNumber,
        documentResult.id,
        token
      );

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
}

.document-preview-container img {
  width: 100%;
  height: auto;
  display: block;
  pointer-events: none;
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
