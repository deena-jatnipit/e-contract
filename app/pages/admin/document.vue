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
                  {{
                    document.provider === "line"
                      ? getCustomerDisplayName(document.send_to)
                      : document.send_to
                  }}
                </td>
                <td>{{ document.provider }}</td>
                <td>{{ document.status }}</td>
                <td class="text-center">
                  <button
                    class="btn btn-primary btn-sm"
                    @click="downloadDocument(document.document_url)"
                  >
                    <i class="fas fa-download"></i>
                  </button>
                  <!-- <button
                    class="btn btn-warning btn-sm ml-2"
                    @click="changeStatus(document.id)"
                  >
                    <i class="fas fa-edit"></i>
                  </button> -->
                  <button
                    class="btn btn-danger btn-sm ml-2"
                    @click="deleteDocument(document.id)"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="!documents || documents.length === 0">
                <td colspan="8" class="text-center">No documents found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

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
            <div v-if="provider === 'sms'" class="form-group">
              <label for="phoneNumber">Phone Number</label>
              <input
                type="tel"
                class="form-control"
                id="phoneNumber"
                v-model="msisdn"
                required
              />
            </div>
            <div v-if="provider === 'line'" class="form-group">
              <label for="selectCustomer">Select Customer</label>
              <select
                id="selectCustomer"
                class="form-control"
                v-model="selectedUserId"
                required
              >
                <option :value="null" hidden>Select a user</option>
                <option
                  v-for="user in customers"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.display_name }}
                </option>
              </select>
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
            <button type="submit" class="btn btn-primary" :disabled="loading">
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
const LIFF_BASE_URL = useRuntimeConfig().public.liffBaseUrl;

const selectedTemplateId = ref(null);
const selectedUserId = ref("");
const msisdn = ref("");
const templates = ref([]);
const documents = ref([]);
const customers = ref([]);
const loading = ref(false);
const provider = ref("line");

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
        "id, contract_templates(name), send_to, provider, token, status, document_url"
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

async function saveDocument(send_to, token) {
  try {
    const { data, error } = await supabase
      .from("documents")
      .insert([
        {
          template_id: selectedTemplateId.value,
          send_to: send_to,
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
  msisdn.value = "";
  selectedUserId.value = "";
}

async function sendSms(identity, documentId, token) {
  try {
    const message = `กรุณากดลิ้งเพื่อเซ็นลายเซ็น ${PROJECT_BASE_URL}/user/sms/otp?identity=${identity}&documentId=${documentId}&token=${token}`;

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

async function sendLine(identity, documentId, token) {
  try {
    const message = `กรุณากดลิ้งเพื่อเซ็นลายเซ็น ${LIFF_BASE_URL}/user/email/otp?identity=${identity}&documentId=${documentId}&token=${token}`;

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
  // Validation
  if (!selectedTemplateId.value) {
    alert("Please select a template.");
    return;
  }

  if (!provider.value) {
    alert("Please select a provider.");
    return;
  }

  if (provider.value === "sms" && !msisdn.value) {
    alert("Please enter a phone number.");
    return;
  }

  if (provider.value === "line" && !selectedUserId.value) {
    alert("Please select a user.");
    return;
  }

  let documentResult = null;

  try {
    loading.value = true;
    const token = generateSecureToken();

    if (provider.value === "sms") {
      documentResult = await saveDocument(msisdn.value, token);

      if (!documentResult) {
        throw new Error("Failed to save document");
      }

      const smsResult = await sendSms(msisdn.value, documentResult.id, token);

      if (smsResult?.error) {
        throw new Error(smsResult.error);
      }
    }

    if (provider.value === "line") {
      documentResult = await saveDocument(selectedUserId.value, token);

      if (!documentResult) {
        throw new Error("Failed to save document");
      }

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
    loading.value = false;
    $("#sendLinkModal").modal("hide");
    resetForm();
    await fetchDocuments();
  }
}

function getCustomerDisplayName(userId) {
  const customer = customers.value.find((customer) => customer.id === userId);
  return customer ? customer.display_name : userId;
}

onMounted(async () => {
  await fetchDocuments();
  await fetchTemplates();
  await fetchCustomers();
});
</script>

<style></style>
