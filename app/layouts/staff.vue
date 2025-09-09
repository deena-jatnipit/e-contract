<template>
  <div class="wrapper">
    <LayoutNavBar />
    <LayoutSidebarStaff />
    <div class="content-wrapper">
      <main class="content">
        <div class="container-fluid pt-3">
          <slot />
        </div>
      </main>
    </div>
    <LayoutFooter />
  </div>
</template>

<style>
.content-wrapper {
  min-height: calc(100vh - 3.5rem - 1px);
}
</style>
