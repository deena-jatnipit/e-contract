<!-- pages/auth/accept-invitation.vue -->
<template>
  <div
    class="min-vh-100 d-flex align-items-center justify-content-center bg-light"
  >
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-primary text-white text-center">
              <h4 class="mb-0">Complete Your Account Setup</h4>
            </div>

            <div class="card-body p-4">
              <!-- Loading State -->
              <div v-if="loading" class="text-center">
                <div
                  class="spinner-border text-primary mb-3"
                  role="status"
                ></div>
                <p>Processing invitation...</p>
              </div>

              <!-- Error State -->
              <div v-else-if="error" class="alert alert-danger">
                <h5>Invalid or Expired Invitation</h5>
                <p>{{ error }}</p>
                <NuxtLink to="/auth/login" class="btn btn-primary">
                  Go to Login
                </NuxtLink>
              </div>

              <!-- Success State -->
              <div v-else-if="success" class="alert alert-success text-center">
                <h5>Account Setup Complete!</h5>
                <p>
                  Your password has been set successfully. You can now log in to
                  your account.
                </p>
                <NuxtLink to="/auth/login" class="btn btn-success">
                  Continue to Login
                </NuxtLink>
              </div>

              <!-- Password Setup Form -->
              <div v-else>
                <div class="mb-4 text-center">
                  <h5>Welcome{{ userEmail ? `, ${userEmail}` : "" }}!</h5>
                  <p class="text-muted">
                    Please set your password to complete account setup.
                  </p>
                </div>

                <form @submit.prevent="handleSetPassword">
                  <div class="form-group mb-3">
                    <label for="password" class="form-label"
                      >New Password</label
                    >
                    <input
                      type="password"
                      class="form-control form-control-lg"
                      id="password"
                      v-model="password"
                      placeholder="Enter your password"
                      minlength="6"
                      required
                    />
                    <div class="form-text">
                      Password must be at least 6 characters long.
                    </div>
                  </div>

                  <div class="form-group mb-4">
                    <label for="confirmPassword" class="form-label"
                      >Confirm Password</label
                    >
                    <input
                      type="password"
                      class="form-control form-control-lg"
                      id="confirmPassword"
                      v-model="confirmPassword"
                      placeholder="Confirm your password"
                      required
                    />
                    <div
                      v-if="confirmPassword && password !== confirmPassword"
                      class="text-danger small mt-1"
                    >
                      Passwords do not match
                    </div>
                  </div>

                  <div v-if="errorMessage" class="alert alert-danger">
                    {{ errorMessage }}
                  </div>

                  <button
                    type="submit"
                    class="btn btn-primary btn-lg w-100"
                    :disabled="
                      isSubmitting ||
                      password !== confirmPassword ||
                      password.length < 6
                    "
                  >
                    {{
                      isSubmitting
                        ? "Setting Password..."
                        : "Set Password & Complete Setup"
                    }}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const route = useRoute();
const router = useRouter();

// Reactive state
const loading = ref(true);
const error = ref(null);
const success = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref(null);
const userEmail = ref("");
const password = ref("");
const confirmPassword = ref("");

// Parse URL hash parameters
function parseHashParams() {
  const hash = window.location.hash.substring(1); // Remove the # symbol
  const params = new URLSearchParams(hash);
  return {
    access_token: params.get("access_token"),
    refresh_token: params.get("refresh_token"),
    expires_in: params.get("expires_in"),
    token_type: params.get("token_type"),
    type: params.get("type"),
  };
}

// Check invitation validity and get user info
async function verifyInvitation() {
  try {
    // First, try to parse hash parameters
    const hashParams = parseHashParams();

    // Check if we have the required parameters
    if (!hashParams.access_token || hashParams.type !== "invite") {
      // Fallback to query parameters for backward compatibility
      const token = route.query.token;
      const type = route.query.type;

      if (!token || type !== "invite") {
        throw new Error(
          "Invalid invitation link. Please check the link from your email."
        );
      }

      // Handle legacy token verification
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "invite",
      });

      if (verifyError) {
        throw new Error(verifyError.message);
      }

      if (data.user) {
        userEmail.value = data.user.email;
      }
    } else {
      // Handle the hash-based invitation (modern Supabase approach)
      // Set the session using the tokens from the hash
      const { data: sessionData, error: sessionError } =
        await supabase.auth.setSession({
          access_token: hashParams.access_token,
          refresh_token: hashParams.refresh_token,
        });

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      if (sessionData.user) {
        userEmail.value = sessionData.user.email;

        // Check if user already has a password set
        // If they do, redirect them to login or dashboard
        if (sessionData.user.user_metadata?.password_set) {
          await router.push("/dashboard");
          return;
        }
      } else {
        throw new Error("Invalid or expired invitation");
      }
    }
  } catch (err) {
    console.error("Invitation verification error:", err);
    if (err.message?.includes("expired")) {
      error.value =
        "ลิงก์คำเชิญหมดอายุแล้ว กรุณาติดต่อผู้ดูแลระบบเพื่อขอลิงก์ใหม่";
    } else if (err.message?.includes("invalid")) {
      error.value =
        "ลิงก์คำเชิญไม่ถูกต้อง กรุณาตรวจสอบลิงก์ในอีเมลของคุณอีกครั้ง";
    } else if (err.message?.includes("network")) {
      error.value =
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
    } else {
      error.value = "เกิดข้อผิดพลาดในการตรวจสอบคำเชิญ กรุณาลองใหม่ภายหลัง";
    }
  } finally {
    loading.value = false;
  }
}

// Handle password setup
async function handleSetPassword() {
  if (password.value !== confirmPassword.value) {
    errorMessage.value = "รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง";
    return;
  }

  if (password.value.length < 6) {
    errorMessage.value = "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;

  try {
    // Update the user's password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password.value,
      data: {
        password_set: true, // Mark that password has been set
      },
    });

    if (updateError) {
      throw updateError;
    }

    success.value = true;

    // Optional: Auto-redirect after a few seconds
    setTimeout(() => {
      router.push("/auth/login");
    }, 3000);
  } catch (err) {
    console.error("Password setup error:", err);
    errorMessage.value = err.message?.includes("network")
      ? "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต"
      : "เกิดข้อผิดพลาดในการตั้งรหัสผ่าน กรุณาลองใหม่อีกครั้ง";
  } finally {
    isSubmitting.value = false;
  }
}

// Handle browser back/forward navigation
function handlePopState() {
  // Re-verify invitation if user navigates back
  if (!success.value && !error.value) {
    verifyInvitation();
  }
}

definePageMeta({
  layout: false,
  middleware: [],
});

onMounted(() => {
  // Add event listener for browser navigation
  window.addEventListener("popstate", handlePopState);

  // Start verification process
  verifyInvitation();
});

onUnmounted(() => {
  window.removeEventListener("popstate", handlePopState);
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}

.card {
  max-width: 100%;
}

.form-control-lg {
  font-size: 1.1rem;
  padding: 0.75rem 1rem;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .card {
    margin: 1rem;
  }
}
</style>
