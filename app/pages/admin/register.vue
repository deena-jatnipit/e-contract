<template>
  <div class="card card-primary">
    <div class="card-header">
      <h3 class="card-title">Register</h3>
    </div>
    <form @submit.prevent="handleInviteUser">
      <div class="card-body">
        <div class="form-group">
          <label for="fullName">Full Name</label>
          <input
            type="text"
            class="form-control"
            id="fullName"
            placeholder="Enter full name"
            v-model="fullName"
            required
          />
        </div>
        <div class="form-group">
          <label for="role">Role</label>
          <select class="form-control" id="role" v-model="role" required>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        <div class="form-group">
          <label for="email">Email address</label>
          <input
            type="email"
            class="form-control"
            id="email"
            placeholder="Enter email"
            v-model="email"
            required
          />
        </div>

        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          An invitation email will be sent to the user.
        </div>

        <p v-if="successMessage" class="text-success mt-3">
          {{ successMessage }}
        </p>
        <p v-if="errorMessage" class="text-danger mt-3">{{ errorMessage }}</p>
      </div>
      <div class="card-footer">
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? "Sending Invitation..." : "Send Invitation" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
const supabase = useSupabaseClient();

const fullName = ref("");
const role = ref("staff");
const email = ref("");
const loading = ref(false);
const errorMessage = ref(null);
const successMessage = ref(null);

async function handleInviteUser() {
  loading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const response = await $fetch("/api/auth/invite-user", {
      method: "POST",
      body: {
        email: email.value,
        userData: {
          fullname: fullName.value,
          role: role.value,
        },
        // redirectTo: `${config.public.projectBaseUrl}/auth/accept-invitation`,
        redirectTo: `http://localhost:3000/auth/accept-invitation`,
      },
    });

    if (response.success) {
      successMessage.value = `Invitation sent successfully to ${email.value}! The user will receive an email with instructions to set up their account.`;

      // Clear form
      fullName.value = "";
      email.value = "";
      role.value = "staff";
    }
  } catch (error) {
    console.error("Invitation error:", error);
    errorMessage.value = error.data?.message || "Failed to send invitation";
  } finally {
    loading.value = false;
  }
}
</script>
