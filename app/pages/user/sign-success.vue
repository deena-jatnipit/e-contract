<template>
  <div
    class="min-vh-100 d-flex align-items-center justify-content-center bg-light"
  >
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card border-0 shadow-sm">
            <div class="card-body text-center p-5">
              <!-- Success Icon -->
              <div class="mb-4">
                <div
                  class="success-icon-wrapper d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 p-3"
                >
                  <i class="fas fa-check-circle text-success fs-1"></i>
                </div>
              </div>

              <!-- Success Title -->
              <h3 class="fw-bold text-dark mb-3">
                Document Signed Successfully!
              </h3>

              <!-- Success Message -->
              <p class="text-muted mb-4 lh-base">
                Your document has been signed and saved successfully. You can
                now close this page.
              </p>

              <!-- Countdown -->
              <p class="text-muted small mb-4">
                This page will close automatically in {{ countdown }} seconds
              </p>

              <!-- Close Button -->
              <button
                class="btn btn-success btn-lg px-4 py-2 rounded-pill"
                @click="closePage"
              >
                <i class="fas fa-times me-2"></i>
                Close Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const countdown = ref(5);

const closePage = () => {
  window.close();
  setTimeout(() => {
    window.location.href = "about:blank";
  }, 100);
};

onMounted(() => {
  const timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer);
      closePage();
    }
  }, 1000);

  // Clean up timer on unmount
  onUnmounted(() => {
    clearInterval(timer);
  });
});
</script>

<style scoped>
.success-icon-wrapper {
  width: 80px;
  height: 80px;
}

.error-icon-wrapper {
  width: 80px;
  height: 80px;
}
</style>
