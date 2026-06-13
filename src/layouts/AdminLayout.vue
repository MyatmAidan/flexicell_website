<script setup lang="ts">
import { ref } from 'vue'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import AdminHeader from '@/components/admin/AdminHeader.vue'

const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}
</script>

<template>
  <div class="admin-layout" :class="{ 'sidebar-open': sidebarOpen }">
    <div class="sidebar-overlay" @click="closeSidebar" />
    <AdminSidebar @navigate="closeSidebar" />
    <div class="admin-main">
      <AdminHeader @toggle-sidebar="toggleSidebar" />
      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>
