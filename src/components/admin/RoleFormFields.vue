<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PermissionGroupEditor, { type RolePermissionGroup } from '@/components/admin/PermissionGroupEditor.vue'

defineProps<{
  codeReadonly?: boolean
}>()

const name = defineModel<string>('name', { required: true })
const code = defineModel<string>('code', { default: '' })
const groups = defineModel<RolePermissionGroup[]>('groups', { required: true })

const { t } = useI18n()
</script>

<template>
  <div class="form-grid two-col">
    <div class="form-group">
      <label>{{ t('roles.name') }} *</label>
      <input v-model="name" type="text" required />
    </div>
    <div class="form-group">
      <label>{{ t('roles.code') }}</label>
      <input
        v-model="code"
        type="text"
        :readonly="codeReadonly"
        :class="{ readonly: codeReadonly }"
        :placeholder="codeReadonly ? '' : t('roles.codeOptional')"
      />
    </div>
  </div>

  <div v-if="groups.length" class="permissions-section">
    <h2>{{ t('roles.permissions') }}</h2>
    <PermissionGroupEditor v-model:groups="groups" />
  </div>
</template>

<style scoped>
.permissions-section {
  margin-top: 1.25rem;
}

.permissions-section h2 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.readonly {
  background: #f1f5f9;
  color: #64748b;
  cursor: not-allowed;
}
</style>
