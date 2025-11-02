<template>
  <div class="template-layout">
    <!-- Header -->
    <div class="header">
      <button @click="$router.back()" class="btn-back">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h1 class="title">{{ pageTitle }}</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const pageTitle = computed(() => route.meta.pageTitle || "Page");
</script>

<style scoped>
.template-layout {
  min-height: 100vh;
  background-color: #f8f9fa;
}

/* Header Styling */
.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #007bff;
  border-bottom: none;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.btn-back {
  width: 36px;
  height: 36px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #ffffff;
  border-radius: 6px;
  cursor: pointer;
  color: #ffffff;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.btn-back:hover {
  background: #ffffff;
  border-color: #ffffff;
  color: #007bff;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.25);
}

.btn-back:active {
  transform: translateY(0);
  box-shadow: none;
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: -0.025em;
}

/* Content Area */
.content {
  padding: 0 1.5rem 2rem;
  max-width: 100%;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header {
    padding: 0.75rem 1rem;
  }

  .title {
    font-size: 1.25rem;
  }

  .btn-back {
    width: 32px;
    height: 32px;
  }

  .content {
    padding: 0 1rem 1.5rem;
  }
}
</style>
