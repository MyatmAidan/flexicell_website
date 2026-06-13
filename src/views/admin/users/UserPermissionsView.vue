<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import { usersApi } from '@/api/users'
import type { User } from '@/types/auth'
import { useAuthStore } from '@/stores/auth'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'

type OverrideType = 'inherit' | 'grant' | 'revoke'

interface UserPermissionItem {
  id: number
  name: string
  label: string
  role_has: boolean
  override: OverrideType | null
  effective: boolean
}

interface UserPermissionGroup {
  module: string
  display_name: string
  view: UserPermissionItem | null
  create: UserPermissionItem | null
  edit: UserPermissionItem | null
  delete: UserPermissionItem | null
  other: UserPermissionItem[]
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { success, error: notifyError } = useNotify()
const auth = useAuthStore()

const loading = ref(true)
const saving = ref(false)
const user = ref<User | null>(null)
const groups = ref<UserPermissionGroup[]>([])

function overrideValue(perm: UserPermissionItem): OverrideType {
  return perm.override ?? 'inherit'
}

function setOverride(perm: UserPermissionItem, value: OverrideType) {
  perm.override = value === 'inherit' ? null : value
  if (value === 'grant') {
    perm.effective = true
  } else if (value === 'revoke') {
    perm.effective = false
  } else {
    perm.effective = perm.role_has
  }
}

function collectOverrides(): Record<number, OverrideType> {
  const result: Record<number, OverrideType> = {}
  for (const group of groups.value) {
    for (const key of ['view', 'create', 'edit', 'delete'] as const) {
      const perm = group[key]
      if (perm) result[perm.id] = overrideValue(perm)
    }
    for (const perm of group.other) {
      result[perm.id] = overrideValue(perm)
    }
  }
  return result
}

function cloneGroups(raw: UserPermissionGroup[]): UserPermissionGroup[] {
  return raw.map((group) => ({
    ...group,
    view: group.view ? { ...group.view } : null,
    create: group.create ? { ...group.create } : null,
    edit: group.edit ? { ...group.edit } : null,
    delete: group.delete ? { ...group.delete } : null,
    other: group.other.map((perm) => ({ ...perm })),
  }))
}

async function load() {
  loading.value = true
  try {
    const res = await usersApi.getPermissions(Number(route.params.id))
    const data = res.data as { user: User; grouped_permissions: UserPermissionGroup[] }
    user.value = data.user
    groups.value = cloneGroups(data.grouped_permissions || [])
  } catch (e) {
    notifyError(getApiErrorMessage(e))
    groups.value = []
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const userId = Number(route.params.id)
    await usersApi.updatePermissions(userId, collectOverrides())
    if (String(auth.user?.id) === String(userId)) {
      await auth.fetchUser()
    }
    success(t('users.permissionsUpdated'))
    router.push('/admin/users')
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <PageCard
    :title="t('users.permissionsTitle')"
    :subtitle="user ? t('users.permissionsSubtitle', { name: user.name }) : ''"
  >
    <template #actions>
      <button type="button" class="btn btn-outline btn-sm" @click="router.push('/admin/users')">
        <Icon icon="solar:alt-arrow-left-linear" /> {{ t('common.back') }}
      </button>
      <button type="button" class="btn btn-primary btn-sm" :disabled="saving || loading" @click="save">
        <Icon icon="solar:diskette-linear" />
        {{ saving ? t('common.loading') : t('common.save') }}
      </button>
    </template>

    <div v-if="loading" class="page-loading">{{ t('common.loading') }}</div>

    <template v-else>
      <p class="permissions-legend">
        <span><strong>I</strong> — {{ t('users.permissionInherit') }}</span>
        <span><strong>G</strong> — {{ t('users.permissionGrant') }}</span>
        <span><strong>R</strong> — {{ t('users.permissionRevoke') }}</span>
      </p>

      <div v-for="group in groups" :key="group.module" class="permission-group panel">
        <h3>{{ group.display_name }}</h3>
        <div class="permission-rows">
          <div
            v-for="perm in [
              group.view,
              group.create,
              group.edit,
              group.delete,
              ...group.other,
            ].filter(Boolean) as UserPermissionItem[]"
            :key="perm.id"
            class="permission-row"
          >
            <span class="permission-label">{{ perm.label }}</span>
            <div class="override-group">
              <div class="override-buttons">
                <label class="override-btn">
                  <input
                    type="radio"
                    :name="`perm-${perm.id}`"
                    :checked="overrideValue(perm) === 'inherit'"
                    @change="setOverride(perm, 'inherit')"
                  />
                  <span title="Inherit">I</span>
                </label>
                <label class="override-btn grant">
                  <input
                    type="radio"
                    :name="`perm-${perm.id}`"
                    :checked="overrideValue(perm) === 'grant'"
                    @change="setOverride(perm, 'grant')"
                  />
                  <span title="Grant">G</span>
                </label>
                <label class="override-btn revoke">
                  <input
                    type="radio"
                    :name="`perm-${perm.id}`"
                    :checked="overrideValue(perm) === 'revoke'"
                    @change="setOverride(perm, 'revoke')"
                  />
                  <span title="Revoke">R</span>
                </label>
              </div>
              <Icon
                :icon="perm.effective ? 'solar:check-circle-bold' : 'solar:close-circle-bold'"
                :class="perm.effective ? 'effective-yes' : 'effective-no'"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </PageCard>
</template>

<style scoped>
.permissions-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  font-size: 0.8125rem;
  color: var(--fc-text-muted);
  margin-bottom: 1.25rem;
}

.permission-group {
  margin-bottom: 1rem;
}

.permission-group h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.permission-rows {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.permission-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.375rem 0;
  border-bottom: 1px solid var(--fc-border);
}

.permission-label {
  font-size: 0.875rem;
}

.override-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.override-buttons {
  display: flex;
  gap: 0.25rem;
}

.override-btn {
  position: relative;
  cursor: pointer;
}

.override-btn input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.override-btn span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--fc-border);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--fc-text-muted);
}

.override-btn input:checked + span {
  background: var(--fc-primary);
  border-color: var(--fc-primary);
  color: #fff;
}

.override-btn.grant input:checked + span {
  background: #22c55e;
  border-color: #22c55e;
}

.override-btn.revoke input:checked + span {
  background: #ef4444;
  border-color: #ef4444;
}

.effective-yes {
  color: #22c55e;
  font-size: 1.125rem;
}

.effective-no {
  color: #ef4444;
  font-size: 1.125rem;
}
</style>
