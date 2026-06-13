<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import { usersApi } from '@/api/users'
import { rolesApi, type Role } from '@/api/roles'
import type { User } from '@/types/auth'
import { useDataTable } from '@/composables/useDataTable'
import { usePermissions } from '@/composables/usePermissions'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'

const { t } = useI18n()
const { hasAny } = usePermissions()
const { success, error: notifyError, confirm } = useNotify()
const table = useDataTable<User>((p) => usersApi.list(p))

const showModal = ref(false)
const editing = ref<User | null>(null)
const saving = ref(false)
const roleOptions = ref<Role[]>([])
const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'staff',
  phone: '',
  address: '',
})

async function loadRoles() {
  try {
    const res = await rolesApi.list({ per_page: 100 })
    roleOptions.value = (res.data ?? []).filter((r) => r.code)
    if (!form.value.role && roleOptions.value.length) {
      form.value.role = roleOptions.value[0]?.code ?? 'staff'
    }
  } catch {
    roleOptions.value = []
  }
}

const columns = [
  { key: 'name', label: t('users.name'), sortable: true },
  { key: 'email', label: t('users.email'), sortable: true },
  { key: 'role_code', label: t('users.role') },
  { key: 'phone', label: t('users.phone') },
  { key: 'address', label: t('users.address') },
  { key: 'created_at', label: t('common.createdAt'), sortable: true },
]

function openCreate() {
  editing.value = null
  form.value = {
    name: '',
    email: '',
    password: '',
    role: roleOptions.value.find((r) => r.code === 'staff')?.code ?? roleOptions.value[0]?.code ?? 'staff',
    phone: '',
    address: '',
  }
  showModal.value = true
}

function openEdit(user: User) {
  editing.value = user
  form.value = {
    name: user.name,
    email: user.email,
    password: '',
    role: user.role_code || roleOptions.value[0]?.code || 'staff',
    phone: user.phone || '',
    address: user.address || '',
  }
  showModal.value = true
}

onMounted(loadRoles)

async function save() {
  saving.value = true
  try {
    const payload: Record<string, unknown> = {
      name: form.value.name,
      email: form.value.email,
      role: form.value.role,
      phone: form.value.phone || null,
      address: form.value.address || null,
    }
    if (form.value.password) payload.password = form.value.password

    if (editing.value) {
      await usersApi.update(editing.value.id, payload)
      success(t('users.updated'))
    } else {
      if (!form.value.password) {
        notifyError(t('users.passwordRequired'))
        return
      }
      payload.password = form.value.password
      await usersApi.create(payload)
      success(t('users.created'))
    }
    showModal.value = false
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    saving.value = false
  }
}

async function remove(user: User) {
  if (!(await confirm(t('users.deleteConfirm', { name: user.name })))) return
  try {
    await usersApi.delete(user.id)
    success(t('users.deleted'))
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}
</script>

<template>
  <PageCard :title="t('pages.users.title')" :subtitle="t('pages.users.description')">
    <template #actions>
      <button v-if="hasAny('users.create')" type="button" class="btn btn-primary btn-sm" @click="openCreate">
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
      <template #cell-role_code="{ value }">
        <span class="badge">{{ t(`users.roles.${value || 'staff'}`) }}</span>
      </template>
      <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
      <template #actions="{ item }">
        <RouterLink
          v-if="hasAny('users.update')"
          :to="`/users/${(item as User).id}/permissions`"
          class="btn-icon"
          :title="t('users.permissions')"
        >
          <Icon icon="solar:shield-keyhole-linear" />
        </RouterLink>
        <button v-if="hasAny('users.update')" type="button" class="btn-icon" @click="openEdit(item as User)">
          <Icon icon="solar:pen-linear" />
        </button>
        <button v-if="hasAny('users.delete')" type="button" class="btn-icon danger" @click="remove(item as User)">
          <Icon icon="solar:trash-bin-trash-linear" />
        </button>
      </template>
    </DataTable>
  </PageCard>

  <Modal :show="showModal" :title="editing ? t('users.edit') : t('users.create')" size="lg" @close="showModal = false">
    <div class="form-grid two-col">
      <div class="form-group">
        <label>{{ t('users.name') }} *</label>
        <input v-model="form.name" type="text" required />
      </div>
      <div class="form-group">
        <label>{{ t('users.email') }} *</label>
        <input v-model="form.email" type="email" required />
      </div>
      <div class="form-group">
        <label>{{ t('users.password') }} {{ editing ? '' : '*' }}</label>
        <input
          v-model="form.password"
          type="password"
          :placeholder="editing ? t('users.passwordOptional') : ''"
          :required="!editing"
        />
      </div>
      <div class="form-group">
        <label>{{ t('users.role') }} *</label>
        <select v-model="form.role" required>
          <option v-for="role in roleOptions" :key="role.id" :value="role.code">
            {{ role.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ t('users.phone') }}</label>
        <input v-model="form.phone" type="text" />
      </div>
      <div class="form-group full">
        <label>{{ t('users.address') }}</label>
        <textarea v-model="form.address" rows="2" />
      </div>
    </div>
    <template #footer>
      <button type="button" class="btn btn-outline" @click="showModal = false">{{ t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
        {{ saving ? t('common.loading') : t('common.save') }}
      </button>
    </template>
  </Modal>
</template>
