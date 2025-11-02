<template>
  <div class="login-page">
    <div class="login-box">
      <div class="card card-outline card-primary">
        <div class="card-header text-center">
          <a href="#" class="h1"><b>E-Contract</b> ADMIN</a>
        </div>
        <div class="card-body">
          <p class="login-box-msg">Sign in to start your session</p>

          <form @submit.prevent="handleLogin">
            <div class="input-group mb-3">
              <input
                type="email"
                class="form-control"
                placeholder="Email"
                v-model="email"
              />
              <div class="input-group-append">
                <div class="input-group-text">
                  <span class="fas fa-envelope"></span>
                </div>
              </div>
            </div>
            <div class="input-group mb-3">
              <input
                type="password"
                class="form-control"
                placeholder="Password"
                v-model="password"
              />
              <div class="input-group-append">
                <div class="input-group-text">
                  <span class="fas fa-lock"></span>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-12">
                <button
                  type="submit"
                  class="btn btn-primary btn-block"
                  :disabled="loading"
                >
                  {{ loading ? "Signing In..." : "Sign In" }}
                </button>
              </div>
            </div>
          </form>

          <p v-if="errorMessage" class="text-danger mt-3 mb-0">
            {{ errorMessage }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const router = useRouter();

const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref(null);

async function handleLogin() {
  loading.value = true;
  errorMessage.value = null;
  try {
    const { data: loginData, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) throw error;
    console.log("Login successful:", loginData);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", loginData.user.id)
      .single();

    if (profileError) throw profileError;
    console.log("User profile:", profile);

    if (profile && profile.role === "admin") {
      router.push("/admin/document");
    } else if (profile && profile.role === "staff") {
      router.push("/staff");
    }
  } catch (error) {
    if (error.message.includes("Invalid login credentials")) {
      errorMessage.value = "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง";
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage.value = "กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ";
    } else if (error.message.includes("network")) {
      errorMessage.value =
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
    } else {
      errorMessage.value = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่ภายหลัง";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f4f6f9;
}
</style>
