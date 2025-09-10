<template>
  <div>
    <button @click="handleClick">Click me</button>
  </div>
</template>

<script setup>
const { init, getIdToken, isLoggedIn, error: liffError } = useLiff();

async function handleClick() {
  try {
    await init();

    if (isLoggedIn()) {
      const idToken = await getIdToken();
      console.log("ID Token:", idToken);
    } else {
      console.log("User is not logged in.");
    }
  } catch (error) {
    console.error("Error during LIFF operation:", error);
  }
}
</script>

<style></style>
