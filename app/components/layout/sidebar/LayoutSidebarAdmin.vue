<template>
  <aside class="main-sidebar sidebar-dark-primary elevation-4">
    <NuxtLink to="/admin/document" class="brand-link">
      <span class="brand-text font-weight-light">Nuxt AdminLTE</span>
    </NuxtLink>

    <div class="sidebar">
      <div class="user-panel mt-3 pb-3 mb-3 d-flex">
        <div class="image"></div>
        <div class="info">
          <a href="#" class="d-block">User</a>
        </div>
      </div>

      <div class="form-inline">
        <div class="input-group" data-widget="sidebar-search">
          <input
            class="form-control form-control-sidebar"
            type="search"
            placeholder="Search"
            aria-label="Search"
          />
          <div class="input-group-append">
            <button class="btn btn-sidebar">
              <i class="fas fa-search fa-fw"></i>
            </button>
          </div>
        </div>
      </div>

      <nav class="mt-2">
        <ul
          class="nav nav-pills nav-sidebar flex-column"
          data-widget="treeview"
          role="menu"
          data-accordion="false"
        >
          <li class="nav-header">MAIN CONTENT</li>
          <li class="nav-item">
            <NuxtLink to="/admin/document" class="nav-link">
              <i class="nav-icon fas fa-file"></i>
              <p>Document</p>
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
                <NuxtLink to="/admin/contract" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Contract details</p>
                </NuxtLink>
              </li>
              <li class="nav-item">
                <NuxtLink to="/admin/contract/fields" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Fields</p>
                </NuxtLink>
              </li>
              <li class="nav-item">
                <NuxtLink to="/admin/contract/template" class="nav-link">
                  <i class="far fa-circle nav-icon"></i>
                  <p>Templates</p>
                </NuxtLink>
              </li>
            </ul>
          </li>
          <li class="nav-item">
            <NuxtLink to="/admin/customer" class="nav-link">
              <i class="nav-icon fas fa-user"></i>
              <p>Customer Profiles</p>
            </NuxtLink>
          </li>

          <li class="nav-header">ACCOUNT</li>
          <li class="nav-item">
            <NuxtLink to="/admin/register" class="nav-link">
              <i class="nav-icon fa-regular fa-address-card"></i>
              <p class="text">Register</p>
            </NuxtLink>
          </li>
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
  if (!window.confirm("Are you sure you want to logout?")) {
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error logging out:", error);
    return;
  }
  router.push("/login");
}
</script>
