<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  router.replace({ path: '/roles', query: { edit: String(route.params.id) } })
})
</script>

<template>
  <div class="page-loading" />
</template>
