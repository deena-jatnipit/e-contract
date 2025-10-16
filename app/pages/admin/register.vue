<template>
  <div class="card card-primary shadow-sm">
    <div class="card-header bg-gradient-primary">
      <h3 class="card-title text-white">
        <i class="fas fa-user-plus mr-2"></i>Register New User
      </h3>
    </div>
    <form @submit.prevent="handleInviteUser">
      <div class="card-body p-3">
        <!-- Full Name with Icon -->
        <div class="form-group mb-3">
          <label class="font-weight-semibold">
            <i class="fas fa-user text-primary mr-1"></i>Full Name
          </label>
          <input
            type="text"
            class="form-control form-control-lg"
            placeholder="Enter full name"
            v-model="fullName"
            required
          />
        </div>

        <!-- Role with Icon -->
        <div class="form-group">
          <label class="font-weight-semibold">
            <i class="fas fa-user-tag text-primary mr-1"></i>Role
          </label>
          <select class="form-control form-control-lg" v-model="role" required>
            <option value="admin">👤 Admin</option>
            <option value="staff">👥 Staff</option>
          </select>
        </div>

        <!-- Email with Icon -->
        <div class="form-group">
          <label class="font-weight-semibold">
            <i class="fas fa-envelope text-primary mr-1"></i>Email Address
          </label>
          <input
            type="email"
            class="form-control form-control-lg"
            placeholder="Enter email"
            v-model="email"
            required
          />
        </div>

        <!-- Info Alert with Better Design -->
        <div class="alert alert-info border-left-info" style="color: #17a2b8">
          <i class="fas fa-info-circle mr-2"></i>
          <strong>Note:</strong> An invitation email will be sent to the user.
        </div>

        <!-- Success/Error Messages with Icons -->
        <div
          v-if="successMessage"
          class="alert alert-success border-left-success"
        >
          <i class="fas fa-check-circle mr-2"></i>{{ successMessage }}
        </div>
        <div v-if="errorMessage" class="alert alert-danger border-left-danger">
          <i class="fas fa-exclamation-circle mr-2"></i>{{ errorMessage }}
        </div>
      </div>

      <div class="card-footer bg-light text-right">
        <button
          type="submit"
          class="btn btn-primary btn-lg px-4"
          :disabled="loading"
        >
          <i class="fas fa-paper-plane mr-2"></i>
          {{ loading ? "Sending Invitation..." : "Send Invitation" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();

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
        // redirectTo: `http://localhost:3000/auth/accept-invitation`,
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
  padding: 0.5rem 0.75rem;
  height: auto;
  font-size: 0.95rem;
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
  padding: 0.4rem 1.2rem;
  font-size: 0.95rem;
}

.btn-lg:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.25);
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
</style>
