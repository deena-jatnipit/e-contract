<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
useHead({
  link: [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback",
    },
    {
      rel: "stylesheet",
      href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css",
    },
    {
      rel: "stylesheet",
      href: "https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/css/adminlte.min.css",
    },
  ],
  script: [
    {
      src: "https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js",
      body: true,
      defer: false,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js",
      body: true,
      defer: true,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/js/adminlte.min.js",
      body: true,
      defer: true,
    },
  ],
  bodyAttrs: {
    class: "sidebar-mini layout-fixed",
  },
});
</script>
