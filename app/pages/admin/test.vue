<template>
  <div>{{ responseMessage }}</div>
  <button @click="testApi">Test API</button>
</template>

<script setup>
const responseMessage = ref("");

async function testApi() {
  const response = await $fetch("/api/line/test", {
    method: "POST",
    body: {
      userId: "U0b6ef66e72182ad3a91d83ba40270ff6",
      message: "test",
    },
  });
  responseMessage.value = response.message;
}
</script>

<style></style>
