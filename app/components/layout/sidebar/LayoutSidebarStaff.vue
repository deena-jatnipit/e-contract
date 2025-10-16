<template>
  <aside class="main-sidebar sidebar-dark-primary elevation-4">
    <NuxtLink to="/staff" class="brand-link">
      <span class="brand-text font-weight-light">E-Contract Staff Panel</span>
    </NuxtLink>

    <div class="sidebar">
      <div class="user-panel mt-3 pb-3 mb-3 d-flex">
        <div class="image"></div>
        <div class="info">
          <a href="#" class="d-block">User</a>
        </div>
      </div>

      <nav class="mt-2">
        <ul
          class="nav nav-pills nav-sidebar flex-column"
          data-widget="treeview"
          role="menu"
          data-accordion="false"
        >
          <li class="nav-item">
            <NuxtLink to="/staff" class="nav-link">
              <i class="nav-icon fas fa-tachometer-alt"></i>
              <p>Dashboard</p>
            </NuxtLink>
          </li>
          <li class="nav-item menu-open">
            <a href="#" class="nav-link active">
              <i class="nav-icon fas fa-copy"></i>
              <p>
                Contract
                <i class="right fas fa-angle-left"></i>
              </p>
            </a>
            <ul class="nav nav-treeview">
              <li class="nav-item">
                <NuxtLink to="/staff/contract" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Contract management</p>
                </NuxtLink>
              </li>
              <li class="nav-item">
                <NuxtLink to="/staff/contract/fields" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Fields management</p>
                </NuxtLink>
              </li>
            </ul>
          </li>

          <li class="nav-header">ACCOUNT</li>
          <li class="nav-item">
            <a href="#" class="nav-link" @click.prevent="logout">
              <i class="nav-icon fas fa-sign-out-alt text-danger"></i>
              <p class="text">Logout</p>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </aside>
</template>

<script setup>
const supabase = useSupabaseClient();
const router = useRouter();

async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error logging out:", error);
    return;
  }
  router.push("/login");
}
</script>
