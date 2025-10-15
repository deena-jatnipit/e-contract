<template>
  <div
    class="min-vh-100 d-flex align-items-center justify-content-center bg-light"
  >
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card border-0 shadow-sm">
            <div class="card-body text-center p-5">
              <!-- Error Icon -->
              <div class="mb-4">
                <div
                  class="error-icon-wrapper d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 p-3"
                >
                  <i class="fas fa-exclamation-triangle text-danger fs-1"></i>
                </div>
              </div>

              <!-- Error Title -->
              <h3 class="fw-bold text-dark mb-3">
                {{ !token ? "Access Token Missing" : "Document Not Found" }}
              </h3>

              <!-- Error Message -->
              <p class="text-muted mb-4 lh-base">
                {{ errorMessage || getDefaultErrorMessage() }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  token: {
    type: String,
    default: null,
  },
  errorMessage: {
    type: String,
    default: "",
  },
});

const getDefaultErrorMessage = () => {
  return "The requested document could not be found or has already been signed.";
};
</script>

<style scoped>
.error-icon-wrapper {
  width: 80px;
  height: 80px;
}
</style>
