<template>
  <div>
    <button @click="handleClick">Click me</button>
  </div>
</template>

<script setup>
const {
  init,
  getIDToken,
  getPermissionList,
  requestPermission,
  isLoggedIn,
  error: liffError,
} = useLiff();

async function handleClick() {
  try {
    await init();

    if (isLoggedIn()) {
      const idToken = await getIDToken();
      getPermissionList();
      requestPermission();
      getPermissionList();
    } else {
      console.log("User is not logged in.");
    }
  } catch (error) {
    console.error("Error during LIFF operation:", error);
  }
}
</script>

<style></style>
