<template>
  <div>
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Customer Profiles</h3>
        <div class="card-tools">
          <button
            class="btn btn-primary btn-sm"
            data-toggle="modal"
            data-target="#customerProfileModal"
          >
            <i class="fas fa-plus"></i> Add New Customer Profile
          </button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-bordered table-striped">
            <thead>
              <tr>
                <th style="width: 10px">#</th>
                <th>Customer</th>
                <th>Full Name</th>
                <th>Car Registration</th>
                <th>Phone Number</th>
                <th class="text-center" style="width: 180px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(profile, index) in customerProfiles"
                :key="profile.id"
              >
                <td>{{ index + 1 }}.</td>
                <td>{{ profile.customer_id.display_name }}</td>
                <td>{{ profile.full_name }}</td>
                <td>{{ profile.car_registration_number }}</td>
                <td>{{ profile.phone_number }}</td>
                <td class="text-center">
                  <button
                    class="btn btn-warning btn-sm"
                    @click="openEditModal(profile)"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="btn btn-danger btn-sm ml-2"
                    @click="deleteProfile(profile.id)"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="!customerProfiles || customerProfiles.length === 0">
                <td colspan="6" class="text-center">
                  No customer profiles found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Customer Profile Modal -->
    <div
      class="modal fade"
      id="customerProfileModal"
      tabindex="-1"
      role="dialog"
      aria-labelledby="customerProfileModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="customerProfileModalLabel">
              {{
                isEditing ? "Edit Customer Profile" : "Add New Customer Profile"
              }}
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
          <form @submit.prevent="saveProfile">
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="customerSelect">Line Name</label>
                    <select
                      id="customerSelect"
                      class="form-control"
                      ref="customerSelectRef"
                      required
                    >
                      <option
                        v-for="customer in customers"
                        :key="customer.id"
                        :value="customer.id"
                      >
                        {{ customer.display_name || customer.id }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="fullName">Full Name</label>
                    <input
                      type="text"
                      class="form-control"
                      id="fullName"
                      v-model="currentProfile.full_name"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="carRegistrationNumber"
                      >Car Registration Number</label
                    >
                    <input
                      type="text"
                      class="form-control"
                      id="carRegistrationNumber"
                      v-model="currentProfile.car_registration_number"
                      placeholder="Enter car registration number"
                      required
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="phoneNumber">Phone Number</label>
                    <input
                      type="tel"
                      class="form-control"
                      id="phoneNumber"
                      v-model="currentProfile.phone_number"
                      placeholder="Enter phone number"
                      maxlength="10"
                      required
                      @input="handlePhoneInput"
                    />
                    <div
                      v-if="!isPhoneValid && currentProfile.phone_number"
                      class="text-danger small mt-1"
                    >
                      Please enter a valid 10-digit phone number starting with 0
                    </div>
                  </div>
                </div>
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
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="loading || !isPhoneValid"
              >
                {{ loading ? "Saving..." : "Save Profile" }}
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
const customerProfiles = ref([]);
const customers = ref([]);
const loading = ref(false);
const errorMessage = ref(null);
const isEditing = ref(false);
const customerSelectRef = ref(null);

const currentProfile = ref({
  id: null,
  customer_id: null,
  full_name: "",
  car_registration_number: "",
  phone_number: "",
});

// Computed property to validate phone number
const isPhoneValid = computed(() => {
  if (!currentProfile.value.phone_number) return true; // Allow empty for validation
  const cleaned = currentProfile.value.phone_number.replace(/\D/g, "");
  return cleaned.length === 10 && cleaned.startsWith("0");
});

// Handle phone input to allow only digits
function handlePhoneInput(event) {
  const value = event.target.value.replace(/\D/g, "");
  currentProfile.value.phone_number = value;
}

async function getCustomerProfiles() {
  try {
    const { data, error } = await supabase
      .from("customer_profiles")
      .select(
        "id, customer_id(id, display_name), full_name, car_registration_number, phone_number, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    customerProfiles.value = data || [];
  } catch (error) {
    console.error("Error fetching customer profiles:", error);
  }
}

async function getCustomers() {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("id, display_name")
      .order("display_name", { ascending: true });

    if (error) throw error;
    customers.value = data || [];
  } catch (error) {
    console.error("Error fetching customers:", error);
  }
}

function openEditModal(profile) {
  isEditing.value = true;
  currentProfile.value = {
    id: profile.id,
    customer_id: profile.customer_id.id,
    full_name: profile.full_name,
    car_registration_number: profile.car_registration_number,
    phone_number: profile.phone_number,
  };

  nextTick(() => {
    $("#customerProfileModal").modal("show");
  });
}

function resetForm() {
  isEditing.value = false;
  currentProfile.value = {
    id: null,
    customer_id: null,
    full_name: "",
    car_registration_number: "",
    phone_number: "",
  };
  errorMessage.value = null;

  if (
    process.client &&
    window.$ &&
    $("#customerSelect").hasClass("select2-hidden-accessible")
  ) {
    $("#customerSelect").val(null).trigger("change");
  }
}

async function saveProfile() {
  loading.value = true;
  errorMessage.value = null;

  // Validation
  if (!currentProfile.value.customer_id) {
    errorMessage.value = "Please select a customer";
    loading.value = false;
    return;
  }

  if (!currentProfile.value.full_name.trim()) {
    errorMessage.value = "Please enter a full name";
    loading.value = false;
    return;
  }

  if (!currentProfile.value.car_registration_number.trim()) {
    errorMessage.value = "Please enter a car registration number";
    loading.value = false;
    return;
  }

  if (!currentProfile.value.phone_number || !isPhoneValid.value) {
    errorMessage.value =
      "Please enter a valid 10-digit phone number starting with 0";
    loading.value = false;
    return;
  }

  try {
    let error;
    const profileData = {
      customer_id: currentProfile.value.customer_id,
      full_name: currentProfile.value.full_name.trim(),
      car_registration_number:
        currentProfile.value.car_registration_number.trim(),
      phone_number: currentProfile.value.phone_number.replace(/\D/g, ""),
    };

    if (isEditing.value) {
      ({ error } = await supabase
        .from("customer_profiles")
        .update(profileData)
        .eq("id", currentProfile.value.id));
    } else {
      ({ error } = await supabase
        .from("customer_profiles")
        .insert([profileData]));
    }

    if (error) throw error;

    const modalElement = $("#customerProfileModal");
    modalElement.modal("hide");

    modalElement.one("hidden.bs.modal", function () {
      $(".modal-backdrop").remove();
      $("body").removeClass("modal-open").css("padding-right", "");
      resetForm();
    });

    await getCustomerProfiles();
  } catch (err) {
    console.error("Error saving customer profile:", err);

    if (err.code === "23505") {
      errorMessage.value =
        "This customer already has a profile. Each customer can only have one profile.";
    } else if (err.code === "23503") {
      errorMessage.value =
        "Selected customer does not exist. Please refresh the page and try again.";
    } else {
      errorMessage.value =
        err.message || "An error occurred while saving the profile";
    }
  } finally {
    loading.value = false;
  }
}

async function deleteProfile(profileId) {
  if (
    !window.confirm("Are you sure you want to delete this customer profile?")
  ) {
    return;
  }

  try {
    const { error } = await supabase
      .from("customer_profiles")
      .delete()
      .eq("id", profileId);

    if (error) throw error;
    await getCustomerProfiles();
  } catch (error) {
    console.error("Error deleting customer profile:", error);
  }
}

function initializeSelect2() {
  if (!process.client || !window.$ || !window.$.fn.select2) {
    console.warn("jQuery or Select2 not available");
    return;
  }

  nextTick(() => {
    const $select = $("#customerSelect");

    if ($select.hasClass("select2-hidden-accessible")) {
      $select.select2("destroy");
    }

    $select.select2({
      placeholder: "Search and select customer...",
      allowClear: true,
      width: "100%",
      dropdownParent: $("#customerProfileModal"),
      theme: "bootstrap4",
    });

    $select.on("change", function () {
      currentProfile.value.customer_id = this.value || null;
    });

    if (currentProfile.value.customer_id) {
      $select.val(currentProfile.value.customer_id).trigger("change");
    }
  });
}

onMounted(async () => {
  await getCustomers();
  await getCustomerProfiles();

  if (process.client) {
    // Wait for jQuery and Select2 to be available
    const waitForSelect2 = () => {
      if (window.$ && window.$.fn.select2) {
        $("#customerProfileModal")
          .on("hide.bs.modal", function () {
            resetForm();
          })
          .on("shown.bs.modal", function () {
            setTimeout(() => {
              initializeSelect2();
            }, 100);
          });
      } else {
        setTimeout(waitForSelect2, 50);
      }
    };

    waitForSelect2();
  }
});

watch(customers, () => {
  if (
    process.client &&
    window.$ &&
    window.$.fn.select2 &&
    $("#customerProfileModal").hasClass("show")
  ) {
    nextTick(() => {
      initializeSelect2();
    });
  }
});

onBeforeUnmount(() => {
  if (process.client && window.$ && window.$.fn.select2) {
    const $select = $("#customerSelect");
    if ($select.hasClass("select2-hidden-accessible")) {
      $select.select2("destroy");
    }
    $("#customerProfileModal").off();
  }
});
</script>

<style scoped>
/* Optional: Custom Select2 styling to match Bootstrap better */
.select2-container--bootstrap4 .select2-selection--single {
  height: calc(1.5em + 0.75rem + 2px) !important;
}

.select2-container--bootstrap4
  .select2-selection--single
  .select2-selection__rendered {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
}

.select2-container--bootstrap4
  .select2-selection--single
  .select2-selection__arrow {
  height: calc(1.5em + 0.75rem) !important;
}

/* Ensure Select2 dropdown appears above modal */
.select2-container--open {
  z-index: 1060 !important;
}

.select2-dropdown {
  z-index: 1060 !important;
}
</style>
