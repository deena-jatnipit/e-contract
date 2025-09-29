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
        redirectTo: `${config.public.projectBaseUrl}/auth/accept-invitation`,
      },
    });

    if (response.success) {
      successMessage.value = `ส่งคำเชิญไปยัง ${email.value} เรียบร้อยแล้ว! ผู้ใช้จะได้รับอีเมลพร้อมคำแนะนำในการตั้งค่าบัญชี`;

      // Clear form
      fullName.value = "";
      email.value = "";
      role.value = "staff";
    }
  } catch (error) {
    console.error("Invitation error:", error);
    if (error.data?.message?.includes("already exists")) {
      errorMessage.value = "อีเมลนี้ถูกใช้งานในระบบแล้ว กรุณาใช้อีเมลอื่น";
    } else if (error.data?.message?.includes("invalid email")) {
      errorMessage.value = "รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
    } else if (error.message?.includes("network")) {
      errorMessage.value =
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
    } else {
      errorMessage.value = "เกิดข้อผิดพลาดในการส่งคำเชิญ กรุณาลองใหม่ภายหลัง";
    }
  } finally {
    loading.value = false;
  }
}
</script>
