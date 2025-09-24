<template>
  <div class="container-fluid p-0">
    <!-- Main Content -->
    <div
      class="min-vh-100 d-flex align-items-center justify-content-center bg-light"
    >
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-8 col-lg-6">
            <div class="card border-0 shadow-sm">
              <!-- Header -->
              <div
                class="bg-success text-white p-3 mb-0 d-flex justify-content-between align-items-center"
              >
                <div>
                  <h1 class="h5 mb-1">สัญญา 1</h1>
                  <small class="opacity-75">Contract Terms & Conditions</small>
                </div>
              </div>

              <div class="card-body p-4">
                <!-- Contract Content -->
                <div
                  ref="contractBox"
                  class="contract-content border rounded p-3 mb-4"
                  @scroll="handleScroll"
                >
                  <p
                    v-for="n in contractParagraphs"
                    :key="n"
                    class="mb-3 text-justify"
                  >
                    {{ n }}. Lorem ipsum dolor sit amet, consectetur adipiscing
                    elit. Sed do eiusmod tempor incididunt ut labore et dolore
                    magna aliqua. Ut enim ad minim veniam, quis nostrud
                    exercitation ullamco laboris nisi ut aliquip ex ea commodo
                    consequat.
                  </p>
                </div>

                <!-- Checkbox Agreement -->
                <div class="form-check mb-4">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="agreeCheckbox"
                    v-model="isChecked"
                    :disabled="!hasScrolledToBottom"
                  />
                  <label class="form-check-label" for="agreeCheckbox">
                    <span :class="{ 'text-muted': !hasScrolledToBottom }">
                      ฉันได้อ่านและยอมรับเงื่อนไขในสัญญา
                    </span>
                    <span class="text-danger">*</span>
                  </label>
                </div>

                <!-- Action Buttons -->
                <div class="row">
                  <div class="col-6">
                    <button
                      type="button"
                      class="btn btn-outline-secondary btn-lg w-100 d-flex align-items-center justify-content-center"
                      @click="rejectContract"
                    >
                      <i class="fas fa-times me-2"></i>
                      ไม่ยอมรับ
                    </button>
                  </div>
                  <div class="col-6">
                    <button
                      type="button"
                      class="btn btn-success btn-lg w-100 d-flex align-items-center justify-content-center"
                      :disabled="!isChecked || loading"
                      @click="confirmContract"
                    >
                      <span
                        v-if="loading"
                        class="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      <i v-else class="fas fa-check me-2"></i>
                      {{ loading ? "กำลังดำเนินการ..." : "ยอมรับ" }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const router = useRouter();
const route = useRoute();
const supabase = useSupabaseClient();

const isChecked = ref(false);
const hasScrolledToBottom = ref(false);
const contractBox = ref(null);
const loading = ref(false);

const contractParagraphs = Array.from({ length: 20 }, (_, i) => i + 1);

const handleScroll = () => {
  const el = contractBox.value;
  if (!el) return;

  const bottomReached =
    Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
  if (bottomReached) {
    hasScrolledToBottom.value = true;
  }
};

function rejectContract() {
  router.back();
}

async function confirmContract() {
  loading.value = true;
  const message = "ยืนยันสัญญา 1";

  try {
    const smsResponse = await sendSms(message);

    if (smsResponse) {
      const supabaseResponse = await updateDocumentStatus();

      if (supabaseResponse) {
        router.push({
          path: "/user/sms/contract2",
          query: { ...route.query },
        });
      }
    }
  } catch (error) {
    console.error("Error confirming contract:", error);
  } finally {
    loading.value = false;
  }
}

async function sendSms(message) {
  try {
    const response = await $fetch("/api/sms/send-message", {
      method: "POST",
      body: {
        msisdn: route.query.msisdn,
        message: message,
      },
    });

    if (response && response.error) {
      console.error("Error confirming contract:", response.error);
      return;
    }

    return response;
  } catch (error) {
    console.error("Error confirming contract:", error);
  }
}

async function updateDocumentStatus() {
  try {
    const { data, error } = await supabase
      .from("documents")
      .update({
        status: "contract1 accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", route.query.documentId)
      .eq("token", route.query.token)
      .select()

    if (error) {
      throw error;
    } else {
      return data;
    }
  } catch (error) {
    console.error("Error saving document:", error);
    return null;
  }
}

onMounted(() => {
  const el = contractBox.value;
  if (el && el.scrollHeight <= el.clientHeight) {
    hasScrolledToBottom.value = true;
  }
});
</script>

<style scoped>
.contract-content {
  height: 60vh;
  overflow-y: auto;
  background-color: #ffffff;
  border-color: #dee2e6 !important;
}

.contract-content::-webkit-scrollbar {
  width: 8px;
}

.contract-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.contract-content::-webkit-scrollbar-thumb {
  background: #198754;
  border-radius: 4px;
}

.contract-content::-webkit-scrollbar-thumb:hover {
  background: #157347;
}

.form-check-input:checked {
  background-color: #198754;
  border-color: #198754;
}

.form-check-input:focus {
  border-color: #198754;
  box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.25);
}

/* Mobile optimizations - matching SMS OTP */
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

  .btn-lg {
    padding: 1rem;
    font-size: 1.1rem;
  }

  .contract-content {
    height: 50vh;
  }
}

/* Success theme colors - matching SMS OTP */
.bg-success {
  background-color: #198754 !important;
}

.btn-success {
  background-color: #198754;
  border-color: #198754;
}

.btn-success:hover:not(:disabled) {
  background-color: #157347;
  border-color: #146c43;
}

.btn-success:disabled {
  opacity: 0.6;
}

.text-success {
  color: #198754 !important;
}
</style>
