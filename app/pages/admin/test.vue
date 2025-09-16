<template>
  <div>{{ responseMessage }}</div>
  <button @click="testSendLineMessage">Test Send Line Message</button>
  <button @click="testSendTelegramMessage">Test Send Telegram Message</button>
</template>

<script setup>
const responseMessage = ref("");

async function testSendLineMessage() {
  try {
    const response = await $fetch("/api/line/test", {
      method: "POST",
      body: {
        userId: "U0b6ef66e72182ad3a91d83ba40270ff6",
        message: "test",
      },
    });

    responseMessage.value = response.message;
  } catch (error) {
    console.error("Error sending Line message:", error);
  }
}

async function testSendTelegramMessage() {
  try {
    const response = await $fetch("/api/telegram/send-message", {
      method: "POST",
      body: {
        message: "test",
      },
    });

    responseMessage.value = response.message;
  } catch (error) {
    console.error("Error sending Telegram message:", error);
  }
}
</script>
