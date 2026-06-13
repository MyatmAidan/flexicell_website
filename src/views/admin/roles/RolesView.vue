<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import RoleFormFields from '@/components/admin/RoleFormFields.vue'
import type { RolePermissionGroup } from '@/components/admin/PermissionGroupEditor.vue'
import { rolesApi, type Role } from '@/api/roles'
import { useDataTable } from '@/composables/useDataTable'
import { usePermissions } from '@/composables/usePermissions'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'
import { cloneRolePermissionGroups, collectSelectedPermissionNames, emptyRolePermissionGroups } from '@/utils/permissions'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { hasAny } = usePermissions()
const { success, error: notifyError, confirm } = useNotify()
const table = useDataTable<Role>((p) => rolesApi.list(p))

const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const saving = ref(false)
const loadingRole = ref(false)
const editingRoleId = ref<string | number | null>(null)
const permissionTemplate = ref<RolePermissionGroup[]>([])
const form = ref({ name: '', code: '' })
const formGroups = ref<RolePermissionGroup[]>([])

const columns = [
  { key: 'name', label: t('roles.name'), sortable: true },
  { key: 'code', label: t('roles.code') },
  { key: 'users_count', label: t('roles.usersCount'), sortable: true },
  { key: 'created_at', label: t('common.createdAt'), sortable: true },
]

const modalTitle = () => (modalMode.value === 'create' ? t('roles.create') : t('roles.edit'))

async function loadPermissionTemplate() {
  if (permissionTemplate.value.length > 0) return
  try {
    const res = await rolesApi.list({ per_page: 1 })
    const first = res.data?.[0]
    if (!first) return
    const detail = await rolesApi.get(first.id)
    permissionTemplate.value = cloneRolePermissionGroups(
      (detail.data.grouped_permissions as RolePermissionGroup[]) || [],
    )
  } catch {
    permissionTemplate.value = []
  }
}

async function openCreate() {
  await loadPermissionTemplate()
  modalMode.value = 'create'
  editingRoleId.value = null
  form.value = { name: '', code: '' }
  formGroups.value = emptyRolePermissionGroups(permissionTemplate.value)
  showModal.value = true
}

async function loadRoleIntoForm(id: string | number) {
  modalMode.value = 'edit'
  editingRoleId.value = id
  showModal.value = true
  loadingRole.value = true
  try {
    const detail = await rolesApi.get(id)
    form.value = {
      name: detail.data.name,
      code: detail.data.code || '',
    }
    formGroups.value = cloneRolePermissionGroups(
      (detail.data.grouped_permissions as RolePermissionGroup[]) || [],
    )
  } catch (e) {
    notifyError(getApiErrorMessage(e))
    showModal.value = false
  } finally {
    loadingRole.value = false
  }
}

function openEdit(role: Role) {
  void loadRoleIntoForm(role.id)
}

async function save() {
  saving.value = true
  try {
    const payload: Record<string, unknown> = {
      name: form.value.name.trim(),
      permissions: collectSelectedPermissionNames(formGroups.value),
    }

    if (modalMode.value === 'create') {
      if (form.value.code.trim()) payload.code = form.value.code.trim()
      await rolesApi.create(payload)
      success(t('roles.created'))
    } else if (editingRoleId.value != null) {
      await rolesApi.update(editingRoleId.value, payload)
      success(t('roles.updated'))
    }

    showModal.value = false
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    saving.value = false
  }
}

async function remove(role: Role) {
  if (!(await confirm(t('roles.deleteConfirm', { name: role.name })))) return
  try {
    await rolesApi.delete(role.id)
    success(t('roles.deleted'))
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}

function openEditById(id: string | number) {
  void loadRoleIntoForm(id)
}

onMounted(async () => {
  await loadPermissionTemplate()
  const editId = route.query.edit
  if (editId && hasAny('roles.update')) {
    await openEditById(String(editId))
    router.replace({ path: '/roles' })
  }
})

watch(showModal, (open) => {
  if (!open && route.query.edit) {
    router.replace({ path: '/roles' })
  }
})
</script>

<template>
  <PageCard :title="t('pages.roles.title')" :subtitle="t('pages.roles.description')">
    <template #actions>
      <button v-if="hasAny('roles.create')" type="button" class="btn btn-primary btn-sm" @click="openCreate">
        <Icon icon="solar:add-circle-linear" /> {{ t('common.create') }}
      </button>
    </template>

    <div class="table-toolbar">
      <input
        type="search"
        class="search-input"
        :placeholder="t('common.search')"
        @input="table.setSearch(($event.target as HTMLInputElement).value)"
      />
    </div>

    <DataTable
      :columns="columns"
      :items="table.items.value"
      :loading="table.loading.value"
      :sort-by="table.sortBy.value"
      :sort-dir="table.sortDir.value"
      :page="table.page.value"
      :last-page="table.lastPage.value"
      :total="table.total.value"
      @sort="table.setSort"
      @page-change="table.setPage"
    >
      <template #cell-name="{ item }">
        <button
          v-if="hasAny('roles.update')"
          type="button"
          class="link link-btn"
          @click="openEdit(item as Role)"
        >
          {{ (item as Role).name }}
        </button>
        <span v-else>{{ (item as Role).name }}</span>
      </template>
      <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
      <template #actions="{ item }">
        <button
          v-if="hasAny('roles.update')"
          type="button"
          class="btn-icon"
          @click="openEdit(item as Role)"
        >
          <Icon icon="solar:pen-linear" />
        </button>
        <button
          v-if="hasAny('roles.delete')"
          type="button"
          class="btn-icon danger"
          @click="remove(item as Role)"
        >
          <Icon icon="solar:trash-bin-trash-linear" />
        </button>
      </template>
    </DataTable>
  </PageCard>

  <Modal :show="showModal" :title="modalTitle()" size="xl" @close="showModal = false">
    <div v-if="loadingRole" class="page-loading">{{ t('common.loading') }}</div>
    <RoleFormFields
      v-else
      v-model:name="form.name"
      v-model:code="form.code"
      v-model:groups="formGroups"
      :code-readonly="modalMode === 'edit'"
    />

    <template #footer>
      <button type="button" class="btn btn-outline" @click="showModal = false">{{ t('common.cancel') }}</button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="saving || loadingRole || !form.name.trim()"
        @click="save"
      >
        {{ saving ? t('common.loading') : modalMode === 'create' ? t('common.create') : t('common.save') }}
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.link-btn {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
}
</style>
