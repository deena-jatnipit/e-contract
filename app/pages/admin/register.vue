<template>
  <div class="card card-primary">
    <div class="card-header">
      <h3 class="card-title">Register New User</h3>
    </div>
    <form @submit.prevent="handleRegister">
      <div class="card-body">
        <div class="form-group">
          <label for="fullName">Full Name</label>
          <input
            type="text"
            class="form-control"
            id="fullName"
            placeholder="Enter full name"
            v-model="fullName"
          />
        </div>
        <div class="form-group">
          <label for="email">Email address</label>
          <input
            type="email"
            class="form-control"
            id="email"
            placeholder="Enter email"
            v-model="email"
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            class="form-control"
            id="password"
            placeholder="Password"
            v-model="password"
          />
        </div>
        <p v-if="successMessage" class="text-success mt-3">
          {{ successMessage }}
        </p>
        <p v-if="errorMessage" class="text-danger mt-3">{{ errorMessage }}</p>
      </div>
      <div class="card-footer">
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? "Registering..." : "Submit" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();

const fullName = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref(null);
const successMessage = ref(null);

async function handleRegister() {
  loading.value = true;
  errorMessage.value = null;
  successMessage.value = null;
  try {
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          fullname: fullName.value,
        },
      },
    });
    if (error) throw error;
    successMessage.value = "User registered successfully!";
    fullName.value = "";
    email.value = "";
    password.value = "";
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}
</script>
