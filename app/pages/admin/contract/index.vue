<template>
  <div>
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">All Contracts</h3>
        <div class="card-tools">
          <button
            class="btn btn-primary btn-sm"
            data-toggle="modal"
            data-target="#addContractModal"
          >
            <i class="fas fa-plus"></i> Add New Contract
          </button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-bordered table-striped">
            <thead>
              <tr>
                <th style="width: 10px">#</th>
                <th>Name</th>
                <th>Company Name</th>
                <th class="text-center">Status</th>
                <th>Created At</th>
                <th class="text-center" style="width: 180px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(contract, index) in contracts" :key="contract.id">
                <td>{{ index + 1 }}.</td>
                <td>{{ contract.name }}</td>
                <td>{{ contract.company_name }}</td>
                <td class="text-center">
                  <span v-if="contract.is_active" class="badge bg-success"
                    >Active</span
                  >
                  <span v-else class="badge bg-secondary">Inactive</span>
                </td>
                <td>{{ formatDateTime(contract.created_at) }}</td>
                <td class="text-center">
                  <button
                    class="btn btn-sm"
                    :class="contract.is_active ? 'btn-warning' : 'btn-success'"
                    @click="toggleContractStatus(contract)"
                  >
                    <i
                      :class="
                        contract.is_active
                          ? 'fas fa-times-circle'
                          : 'fas fa-check-circle'
                      "
                    ></i>
                  </button>
                  <button
                    class="btn btn-danger btn-sm ml-2"
                    @click="deleteContract(contract.id)"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="!contracts || contracts.length === 0">
                <td colspan="6" class="text-center">No contracts found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      class="modal fade"
      id="addContractModal"
      tabindex="-1"
      role="dialog"
      aria-labelledby="addContractModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="addContractModalLabel">
              Add New Contract
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
          <form @submit.prevent="addContract">
            <div class="modal-body">
              <div class="form-group">
                <label for="contractName">Contract Name</label>
                <input
                  type="text"
                  class="form-control"
                  id="contractName"
                  v-model="newContract.name"
                  required
                />
              </div>
              <div class="form-group">
                <label for="companyName">Company Name</label>
                <input
                  type="text"
                  class="form-control"
                  id="companyName"
                  v-model="newContract.company_name"
                  required
                />
              </div>
              <div class="form-group form-check">
                <input
                  type="checkbox"
                  class="form-check-input"
                  id="isActive"
                  v-model="newContract.is_active"
                />
                <label class="form-check-label" for="isActive">Is Active</label>
              </div>
              <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-dismiss="modal"
              >
                Close
              </button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? "Saving..." : "Save Contract" }}
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
const contracts = ref([]);
const loading = ref(false);
const errorMessage = ref(null);

const newContract = ref({
  name: "",
  company_name: "",
  is_active: true,
});

function formatDateTime(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

async function getContracts() {
  try {
    const { data, error } = await supabase
      .from("contracts")
      .select("id, name, company_name, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    contracts.value = data;
  } catch (error) {
    console.error("Error fetching contracts:", error);
  }
}

async function addContract() {
  loading.value = true;
  errorMessage.value = null;
  try {
    const { error } = await supabase.from("contracts").insert([
      {
        name: newContract.value.name,
        company_name: newContract.value.company_name,
        is_active: newContract.value.is_active,
      },
    ]);
    if (error) throw error;

    const modalElement = $("#addContractModal");
    modalElement.modal("hide");

    modalElement.one("hidden.bs.modal", function () {
      $(".modal-backdrop").remove();
      $("body").removeClass("modal-open").css("padding-right", "");
      resetForm();
    });

    await getContracts();
  } catch (error) {
    console.error("Error adding contract:", error);
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  newContract.value = { name: "", company_name: "", is_active: true };
  errorMessage.value = null;
}

async function toggleContractStatus(contract) {
  try {
    const newStatus = !contract.is_active;
    const { error } = await supabase
      .from("contracts")
      .update({ is_active: newStatus })
      .eq("id", contract.id);

    if (error) throw error;

    await getContracts();
  } catch (error) {
    console.error("Error updating status:", error);
  }
}

async function deleteContract(contractId) {
  if (!window.confirm("Are you sure you want to delete this contract?")) {
    return;
  }

  try {
    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", contractId);

    if (error) throw error;

    await getContracts();
  } catch (error) {
    console.error("Error deleting contract:", error);
  }
}

onMounted(() => {
  getContracts();

  $("#addContractModal").on("hide.bs.modal", function () {
    resetForm();
  });
});
</script>
