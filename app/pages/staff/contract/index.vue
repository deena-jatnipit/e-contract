<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">All Contracts</h3>
      <div class="card-tools">
        <button class="btn btn-primary btn-sm">Add New Contract</button>
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
              <td>
                {{ formatDateTime(contract.created_at) }}
              </td>
            </tr>

            <tr v-if="!contracts || contracts.length === 0">
              <td colspan="5" class="text-center">No contracts found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card-footer clearfix"></div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();

const contracts = ref([]);

function formatDateTime(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getContracts() {
  try {
    const { data, error } = await supabase.from("contracts").select("*");

    if (error) throw error;

    contracts.value = data;
  } catch (error) {
    console.error("Error fetching contracts:", error);
  }
}

onMounted(async () => {
  await getContracts();
});
</script>

<style scoped>
.table th,
.table td {
  vertical-align: middle !important;
}
</style>
