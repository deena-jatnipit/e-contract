<template>
  <div>
    <div class="card card-primary shadow-sm">
      <div class="card-header bg-gradient-primary">
        <h3 class="card-title text-white">
          <i class="fas fa-file-contract mr-2"></i>All Contracts
        </h3>
        <div class="card-tools">
          <button
            class="btn btn-light btn-sm px-4"
            data-toggle="modal"
            data-target="#addContractModal"
          >
            <i class="fas fa-plus mr-2"></i> Add New Contract
          </button>
        </div>
      </div>
      <div class="card-body p-3">
        <div class="table-responsive">
          <table class="table custom-table">
            <thead>
              <tr>
                <th class="text-center" style="width: 50px">#</th>
                <th>Name</th>
                <th>Company Name</th>
                <th class="text-center" style="width: 100px">Status</th>
                <th>Created At</th>
                <th class="text-center" style="width: 150px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(contract, index) in contracts" :key="contract.id">
                <td class="text-center text-muted">{{ index + 1 }}</td>
                <td>
                  <span class="font-weight-medium">{{ contract.name }}</span>
                </td>
                <td>
                  <div class="d-flex align-items-center">
                    <i class="fas fa-building text-muted mr-2"></i>
                    <span>{{ contract.company_name }}</span>
                  </div>
                </td>
                <td class="text-center">
                  <span
                    class="status-badge"
                    :class="
                      contract.is_active ? 'status-active' : 'status-inactive'
                    "
                  >
                    {{ contract.is_active ? "Active" : "Inactive" }}
                  </span>
                </td>
                <td>
                  <div class="d-flex align-items-center">
                    <i class="far fa-clock text-muted mr-2"></i>
                    <span>{{ formatDateTime(contract.created_at) }}</span>
                  </div>
                </td>
                <td class="text-center">
                  <div class="action-buttons">
                    <button
                      class="btn btn-icon"
                      :class="
                        contract.is_active ? 'text-warning' : 'text-success'
                      "
                      @click="toggleContractStatus(contract)"
                      :title="contract.is_active ? 'Deactivate' : 'Activate'"
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
                      class="btn btn-icon text-danger"
                      @click="deleteContract(contract.id)"
                      title="Delete"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!contracts || contracts.length === 0">
                <td colspan="6" class="text-center py-4">
                  <div class="empty-state">
                    <i class="fas fa-file-contract fa-2x text-muted mb-2"></i>
                    <p class="text-muted">No contracts found.</p>
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
              <i class="fas fa-plus-circle text-primary mr-2"></i>Add New
              Contract
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
            <div class="modal-body p-4">
              <div class="form-group">
                <label class="font-weight-semibold">
                  <i class="fas fa-file-signature text-primary mr-1"></i
                  >Contract Name
                </label>
                <input
                  type="text"
                  class="form-control form-control-lg"
                  id="contractName"
                  v-model="newContract.name"
                  placeholder="Enter contract name"
                  required
                />
              </div>
              <div class="form-group">
                <label class="font-weight-semibold">
                  <i class="fas fa-building text-primary mr-1"></i>Company Name
                </label>
                <input
                  type="text"
                  class="form-control form-control-lg"
                  id="companyName"
                  v-model="newContract.company_name"
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div class="form-group">
                <label class="font-weight-semibold d-flex align-items-center">
                  Status
                  <div class="custom-control custom-switch ml-2">
                    <input
                      type="checkbox"
                      class="custom-control-input"
                      id="isActive"
                      v-model="newContract.is_active"
                    />
                    <label class="custom-control-label" for="isActive">
                      {{ newContract.is_active ? "Active" : "Inactive" }}
                    </label>
                  </div>
                </label>
              </div>
              <div
                v-if="errorMessage"
                class="alert alert-danger border-left-danger"
              >
                <i class="fas fa-exclamation-circle mr-2"></i>{{ errorMessage }}
              </div>
            </div>
            <div class="modal-footer bg-light">
              <button
                type="button"
                class="btn btn-light btn-lg"
                data-dismiss="modal"
              >
                <i class="fas fa-times mr-2"></i>Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary btn-lg"
                :disabled="loading"
              >
                <i class="fas fa-save mr-2"></i>
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
    if (error.message.includes("duplicate")) {
      errorMessage.value = "มีสัญญานี้อยู่ในระบบแล้ว กรุณาใช้ชื่อสัญญาอื่น";
    } else if (error.message.includes("not found")) {
      errorMessage.value = "ไม่พบข้อมูลที่ต้องการ กรุณาลองใหม่อีกครั้ง";
    } else if (error.message.includes("network")) {
      errorMessage.value =
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
    } else {
      errorMessage.value = "เกิดข้อผิดพลาดในการเพิ่มสัญญา กรุณาลองใหม่ภายหลัง";
    }
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
    if (error.message.includes("network")) {
      alert(
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต"
      );
    } else {
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะสัญญา กรุณาลองใหม่อีกครั้ง");
    }
  }
}

async function deleteContract(contractId) {
  if (
    !window.confirm(
      "คุณแน่ใจหรือไม่ว่าต้องการลบสัญญานี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
    )
  ) {
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
    if (error.message.includes("foreign key")) {
      alert("ไม่สามารถลบสัญญานี้ได้ เนื่องจากมีการใช้งานอยู่ในส่วนอื่นของระบบ");
    } else if (error.message.includes("network")) {
      alert(
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต"
      );
    } else {
      alert("เกิดข้อผิดพลาดในการลบสัญญา กรุณาลองใหม่อีกครั้ง");
    }
  }
}

onMounted(async () => {
  await getContracts();

  $("#addContractModal").on("hide.bs.modal", function () {
    resetForm();
  });
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

/* Form Control Enhancement */
.form-control {
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
}

.form-control:focus {
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
