<template>
  <div class="container-fluid p-0">
    <!-- Loading State -->
    <div
      v-if="state.loading"
      class="d-flex justify-content-center align-items-center"
      style="min-height: 100vh"
    >
      <div class="spinner-border text-success" role="status"></div>
    </div>

    <!-- Main Content -->
    <div
      v-else
      class="min-vh-100 d-flex align-items-center justify-content-center bg-light"
    >
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-5">
            <div class="card border-0 shadow-sm">
              <!-- Header -->
              <div
                class="bg-success text-white p-3 mb-0 d-flex justify-content-between align-items-center"
              >
                <div>
                  <h1 class="h5 mb-1">กรอกรหัส OTP</h1>
                  <small class="opacity-75">SMS Verification</small>
                </div>
              </div>

              <div class="card-body p-4">
                <!-- Error Message -->
                <div
                  v-if="state.error"
                  class="alert alert-danger d-flex align-items-center mb-4"
                  role="alert"
                >
                  <i class="fas fa-exclamation-triangle me-2"></i>
                  <div>{{ state.error }}</div>
                </div>

                <!-- Send OTP Section -->
                <div v-if="!state.otpSent" class="text-center">
                  <div class="phone-display mb-4">
                    <i class="fas fa-mobile-alt text-success me-2"></i>
                    <span class="fw-semibold">{{
                      formatPhoneNumber(state.msisdn)
                    }}</span>
                  </div>
                  <p class="text-muted mb-4">
                    กรุณากรอกรหัส 6 หลักที่ส่งไปยังโทรศัพท์ของคุณ
                  </p>
                  <button
                    type="button"
                    class="btn btn-success btn-lg w-100 d-flex align-items-center justify-content-center"
                    :disabled="state.loading"
                    @click="handleSendOtp"
                  >
                    <span
                      v-if="state.loading"
                      class="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    <i v-else class="fas fa-paper-plane me-2"></i>
                    {{ state.loading ? "กำลังส่ง..." : "ส่งรหัส OTP" }}
                  </button>
                </div>

                <!-- OTP Input Section -->
                <template v-else>
                  <div class="text-center mb-4">
                    <p class="text-muted mb-3">
                      กรุณากรอกรหัส 6 หลักที่ส่งไปยัง<br />
                      <strong>{{ state.msisdn }}</strong>
                    </p>
                  </div>

                  <form @submit.prevent="handleVerifyOtp" class="mb-4">
                    <!-- OTP Input -->
                    <div class="d-flex justify-content-center gap-2 mb-4">
                      <input
                        v-for="(digit, index) in otpDigits"
                        :key="index"
                        :ref="(el) => (otpInputs[index] = el)"
                        v-model="otpDigits[index]"
                        type="text"
                        class="form-control form-control-lg text-center otp-input"
                        maxlength="1"
                        inputmode="numeric"
                        :disabled="state.loading"
                        @input="handleOtpInput(index, $event)"
                        @keydown="handleOtpKeydown(index, $event)"
                        @paste="handleOtpPaste"
                      />
                    </div>

                    <!-- Submit Button -->
                    <div class="mb-4">
                      <button
                        type="submit"
                        class="btn btn-success btn-lg w-100 d-flex align-items-center justify-content-center"
                        :disabled="!isOtpValid || state.loading"
                      >
                        <span
                          v-if="state.loading"
                          class="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        <i v-else class="fas fa-check me-2"></i>
                        {{ state.loading ? "กำลังยืนยัน..." : "ยืนยันรหัส" }}
                      </button>
                    </div>
                  </form>

                  <!-- Resend Section -->
                  <div class="text-center">
                    <div
                      v-if="state.resendCountdown > 0"
                      class="text-muted small"
                    >
                      <i class="fas fa-clock me-1"></i>
                      ขอส่งรหัสใหม่ได้ใน {{ state.resendCountdown }} วินาที
                    </div>
                    <div v-else>
                      <button
                        type="button"
                        class="btn btn-outline-secondary btn-sm"
                        :disabled="state.loading"
                        @click="handleResendOtp"
                      >
                        <i class="fas fa-redo me-1"></i>
                        ส่งรหัสอีกครั้ง
                      </button>
                    </div>
                  </div>
                </template>
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
const router = useRouter();
const route = useRoute();

const state = reactive({
  documentId: route.query.documentId || "",
  msisdn: "",
  userId: "",
  otpSent: false,
  resendCountdown: 0,
  error: "",
  token: "",
  loading: false,
});

const documentData = ref(null);

function formatPhoneNumber(msisdn) {
  if (!msisdn) return "";
  const cleaned = msisdn.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return msisdn;
}

const otpDigits = reactive(["", "", "", "", "", ""]);
const otpInputs = ref([]);

let resendTimer = null;

const isOtpValid = computed(() => {
  return otpDigits.every((digit) => digit !== "" && /^\d$/.test(digit));
});

async function fetchDocumentById() {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select(
        "id, customer_profile_id(customer_id, phone_number), provider, token, status"
      )
      .eq("id", state.documentId)
      .single();

    if (error) {
      throw error;
    }

    documentData.value = data;
    state.msisdn = data.customer_profile_id.phone_number;
    state.userId = data.customer_profile_id.customer_id;
  } catch (error) {
    console.error("Error fetching documents:", error);
    state.error = "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง";
  }
}

function getOtpValue() {
  return otpDigits.join("");
}

function clearError() {
  state.error = "";
}

function resetOtpInput() {
  otpDigits.forEach((_, index) => {
    otpDigits[index] = "";
  });
  clearError();
  nextTick(() => {
    if (otpInputs.value[0]) {
      otpInputs.value[0].focus();
    }
  });
}

function handleOtpInput(index, event) {
  const value = event.target.value;

  if (!/^\d*$/.test(value)) {
    event.target.value = otpDigits[index];
    return;
  }

  otpDigits[index] = value;

  if (value && index < 5) {
    nextTick(() => {
      if (otpInputs.value[index + 1]) {
        otpInputs.value[index + 1].focus();
      }
    });
  }

  clearError();
}

function handleOtpKeydown(index, event) {
  if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
    nextTick(() => {
      if (otpInputs.value[index - 1]) {
        otpInputs.value[index - 1].focus();
      }
    });
  }

  if (event.key === "ArrowLeft" && index > 0) {
    event.preventDefault();
    otpInputs.value[index - 1].focus();
  }

  if (event.key === "ArrowRight" && index < 5) {
    event.preventDefault();
    otpInputs.value[index + 1].focus();
  }
}

function handleOtpPaste(event) {
  event.preventDefault();
  const pastedData = event.clipboardData.getData("text").replace(/\D/g, "");

  if (pastedData.length === 6) {
    pastedData.split("").forEach((digit, index) => {
      if (index < 6) {
        otpDigits[index] = digit;
      }
    });
    nextTick(() => {
      if (otpInputs.value[5]) {
        otpInputs.value[5].focus();
      }
    });
    clearError();
  }
}

function startResendCountdown() {
  state.resendCountdown = 60;
  clearInterval(resendTimer);

  resendTimer = setInterval(() => {
    if (state.resendCountdown > 0) {
      state.resendCountdown--;
    } else {
      clearInterval(resendTimer);
      resendTimer = null;
    }
  }, 1000);
}

async function sendOtpRequest() {
  if (!state.msisdn) {
    throw new Error("หมายเลขโทรศัพท์ไม่ถูกต้อง");
  }

  const cleanedMsisdn = state.msisdn.replace(/\D/g, "");
  if (cleanedMsisdn.length !== 10 || !cleanedMsisdn.startsWith("0")) {
    throw new Error("กรุณากรอกหมายเลขโทรศัพท์ 10 หลัก ขึ้นต้นด้วย 0");
  }

  const response = await $fetch("/api/sms/send-otp", {
    method: "POST",
    body: { msisdn: cleanedMsisdn },
  });

  if (response?.error) {
    throw new Error(response.error);
  }

  // Handle both response structures
  const token = response?.data?.token || response?.token;

  if (!token) {
    throw new Error("ไม่ได้รับ token จากเซิร์ฟเวอร์");
  }

  return { ...response, token };
}

async function verifyOtpRequest(pin) {
  if (!pin || !state.token) {
    console.error("Missing data - Pin:", !!pin, "Token:", !!state.token);
    throw new Error("ข้อมูลไม่ครบถ้วน - กรุณาลองใหม่อีกครั้ง");
  }

  const response = await $fetch("/api/sms/verify-otp", {
    method: "POST",
    body: {
      pin: pin.toString(),
      token: state.token.toString().trim(),
    },
  });

  if (response?.error) {
    throw new Error(
      response.error || "รหัส OTP ไม่ถูกต้อง หรือหมดอายุ กรุณาลองใหม่อีกครั้ง"
    );
  }

  return response;
}

async function handleSendOtp() {
  state.loading = true;
  clearError();

  try {
    const response = await sendOtpRequest();
    state.token = response.token;
    state.otpSent = true;
    resetOtpInput();
    startResendCountdown();
  } catch (error) {
    console.error("Error sending OTP:", error);
    state.error = error.message || "เกิดข้อผิดพลาดในการส่งรหัส OTP";
  } finally {
    state.loading = false;
  }
}

async function handleResendOtp() {
  state.loading = true;
  clearError();

  try {
    const response = await sendOtpRequest();
    state.token = response.token;
    resetOtpInput();
    startResendCountdown();
  } catch (error) {
    console.error("Error resending OTP:", error);
    state.error = error.message || "เกิดข้อผิดพลาดในการส่งรหัส OTP ใหม่";
  } finally {
    state.loading = false;
  }
}

async function handleVerifyOtp() {
  const cleanPin = getOtpValue();

  if (!cleanPin || cleanPin.length !== 6) {
    state.error = "กรุณากรอกรหัส OTP 6 หลักให้ครบถ้วน";
    return;
  }

  if (!state.token) {
    state.error = "ไม่พบ token กรุณาขอรหัส OTP ใหม่";
    console.error("Token is missing:", state.token);
    return;
  }

  state.loading = true;
  clearError();

  try {
    const response = await verifyOtpRequest(cleanPin);

    await router.push({
      path: "/user/line/contract1",
      query: { userId: state.userId, ...route.query },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    state.error = error.message || "เกิดข้อผิดพลาดในการยืนยันรหัส OTP";
    resetOtpInput();
  } finally {
    state.loading = false;
  }
}

onMounted(async () => {
  state.loading = true;
  await fetchDocumentById();
  state.loading = false;
});

onBeforeUnmount(() => {
  if (resendTimer) {
    clearInterval(resendTimer);
    resendTimer = null;
  }
});
</script>

<style scoped>
@media (max-width: 768px) {
  .container-fluid {
    padding: 0;
  }

  .card {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .card:first-child {
    border-top: none;
  }

  .form-control-lg {
    font-size: 1.1rem;
    padding: 0.75rem;
  }

  .btn-lg {
    padding: 1rem;
    font-size: 1.1rem;
  }

  .otp-input {
    width: 40px !important;
    height: 40px !important;
    font-size: 1.25rem !important;
  }
}

.otp-input {
  width: 50px;
  height: 50px;
  font-size: 1.4rem;
  font-weight: bold;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  transition: all 0.15s ease-in-out;
}

.otp-input:focus {
  border-color: #198754;
  box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.25);
}

.otp-input:disabled {
  background-color: #f8f9fa;
  opacity: 0.6;
}

.phone-display {
  padding: 0.75rem 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
}

.bg-success {
  background-color: #198754 !important;
}

.btn-success {
  background-color: #198754;
  border-color: #198754;
}

.btn-success:hover {
  background-color: #157347;
  border-color: #146c43;
}

.text-success {
  color: #198754 !important;
}

.border-success {
  border-color: #198754 !important;
}
</style>
