<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'

export interface RolePermissionItem {
  id: number | string
  name: string
  label: string
  selected: boolean
}

export interface RolePermissionGroup {
  module: string
  display_name: string
  view: RolePermissionItem | null
  create: RolePermissionItem | null
  edit: RolePermissionItem | null
  delete: RolePermissionItem | null
  other: RolePermissionItem[]
}

const groups = defineModel<RolePermissionGroup[]>('groups', { required: true })

const { t } = useI18n()
const search = ref('')

const actionKeys = ['view', 'create', 'edit', 'delete'] as const

const filteredGroups = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return groups.value
  return groups.value.filter((g) => g.display_name.toLowerCase().includes(q))
})

function rowPerms(group: RolePermissionGroup): RolePermissionItem[] {
  return [
    group.view,
    group.create,
    group.edit,
    group.delete,
    ...group.other,
  ].filter((p): p is RolePermissionItem => p != null)
}

function isRowFullySelected(group: RolePermissionGroup): boolean {
  const perms = rowPerms(group)
  return perms.length > 0 && perms.every((p) => p.selected)
}

function isRowPartiallySelected(group: RolePermissionGroup): boolean {
  const perms = rowPerms(group)
  const selected = perms.filter((p) => p.selected).length
  return selected > 0 && selected < perms.length
}

function setRowSelected(group: RolePermissionGroup, selected: boolean) {
  for (const perm of rowPerms(group)) {
    perm.selected = selected
  }
}

function toggleRow(group: RolePermissionGroup, event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  setRowSelected(group, checked)
}

function isColumnFullySelected(action: (typeof actionKeys)[number]): boolean {
  const perms = groups.value.map((g) => g[action]).filter((p): p is RolePermissionItem => p != null)
  return perms.length > 0 && perms.every((p) => p.selected)
}

function isColumnPartiallySelected(action: (typeof actionKeys)[number]): boolean {
  const perms = groups.value.map((g) => g[action]).filter((p): p is RolePermissionItem => p != null)
  const selected = perms.filter((p) => p.selected).length
  return selected > 0 && selected < perms.length
}

function setColumnSelected(action: (typeof actionKeys)[number], selected: boolean) {
  for (const group of groups.value) {
    const perm = group[action]
    if (perm) perm.selected = selected
  }
}

function toggleColumn(action: (typeof actionKeys)[number], event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  setColumnSelected(action, checked)
}

function selectAll() {
  for (const group of groups.value) {
    setRowSelected(group, true)
  }
}

function deselectAll() {
  for (const group of groups.value) {
    setRowSelected(group, false)
  }
}

function otherShortLabel(perm: RolePermissionItem, module: string) {
  const prefix = `${module}.`
  if (perm.label && perm.label !== perm.name) {
    return perm.label.replace(new RegExp(`^${module}[._]`, 'i'), '').trim() || perm.label
  }
  return perm.name.replace(prefix, '') || perm.name
}
</script>

<template>
  <div class="perm-editor">
    <div class="perm-toolbar">
      <div class="perm-search-wrap">
        <Icon icon="solar:magnifer-linear" class="perm-search-icon" />
        <input
          v-model="search"
          type="search"
          class="perm-search"
          :placeholder="t('roles.searchModules')"
        />
      </div>
      <div class="perm-quick-actions">
        <span class="perm-quick-label">{{ t('roles.quickActions') }}</span>
        <button type="button" class="btn btn-outline btn-sm" @click="selectAll">{{ t('roles.selectAll') }}</button>
        <button type="button" class="btn btn-outline btn-sm" @click="deselectAll">{{ t('roles.resetAll') }}</button>
      </div>
    </div>

    <div class="perm-table-wrap">
      <table class="perm-table">
        <thead>
          <tr>
            <th class="col-module">{{ t('roles.moduleSection') }}</th>
            <th v-for="action in actionKeys" :key="action" class="col-action">
              <span>{{ t(`roles.actions.${action}`) }}</span>
              <input
                type="checkbox"
                class="col-toggle"
                :checked="isColumnFullySelected(action)"
                :indeterminate.prop="isColumnPartiallySelected(action)"
                @change="toggleColumn(action, $event)"
              />
            </th>
            <th class="col-other">{{ t('roles.otherPermissions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="group in filteredGroups" :key="group.module" class="perm-row">
            <td class="col-module">
              <label class="module-cell">
                <input
                  type="checkbox"
                  class="row-toggle"
                  :checked="isRowFullySelected(group)"
                  :indeterminate.prop="isRowPartiallySelected(group)"
                  @change="toggleRow(group, $event)"
                />
                <span class="module-name">{{ group.display_name }}</span>
              </label>
            </td>
            <td v-for="action in actionKeys" :key="action" class="col-action">
              <label v-if="group[action]" class="action-check">
                <input v-model="group[action]!.selected" type="checkbox" />
              </label>
              <span v-else class="perm-empty">—</span>
            </td>
            <td class="col-other">
              <div v-if="group.other.length" class="other-badges">
                <label
                  v-for="perm in group.other"
                  :key="perm.id"
                  class="other-badge"
                  :class="{ active: perm.selected }"
                >
                  <input v-model="perm.selected" type="checkbox" class="other-badge-input" />
                  <Icon :icon="perm.selected ? 'solar:check-circle-bold' : 'solar:add-circle-linear'" />
                  {{ otherShortLabel(perm, group.module) }}
                </label>
              </div>
              <span v-else class="perm-empty">—</span>
            </td>
          </tr>
          <tr v-if="!filteredGroups.length">
            <td colspan="6" class="perm-no-results">{{ t('common.noData') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.perm-editor {
  border: 1px solid var(--fc-border);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.perm-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--fc-border);
  background: #fafbfc;
}

.perm-search-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 320px;
}

.perm-search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--fc-text-muted);
  font-size: 1rem;
}

.perm-search {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border: 1px solid var(--fc-border);
  border-radius: 6px;
  font-size: 0.875rem;
}

.perm-quick-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.perm-quick-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--fc-text-muted);
  margin-right: 0.25rem;
}

.perm-table-wrap {
  overflow-x: auto;
}

.perm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.perm-table thead th {
  background: #f8f9fa;
  border-bottom: 2px solid var(--fc-border);
  padding: 0.625rem 0.75rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  vertical-align: middle;
}

.perm-table thead th.col-module {
  text-align: left;
  min-width: 200px;
}

.perm-table thead th.col-action {
  width: 90px;
}

.perm-table thead th.col-action span {
  display: block;
  margin-bottom: 0.35rem;
}

.col-toggle {
  cursor: pointer;
  width: 1rem;
  height: 1rem;
}

.perm-table tbody td {
  border-bottom: 1px solid var(--fc-border);
  padding: 0.625rem 0.75rem;
  vertical-align: middle;
}

.module-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.module-name {
  font-weight: 600;
  color: #334155;
}

.row-toggle {
  cursor: pointer;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.col-action {
  text-align: center;
}

.action-check {
  display: inline-flex;
  justify-content: center;
  cursor: pointer;
}

.action-check input {
  width: 1.1rem;
  height: 1.1rem;
  cursor: pointer;
}

.perm-empty {
  color: #cbd5e1;
  font-size: 0.8125rem;
}

.other-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.other-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--fc-border);
  border-radius: 4px;
  background: #f8f9fa;
  color: #64748b;
  font-size: 0.6875rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.other-badge.active {
  background: var(--fc-primary);
  border-color: var(--fc-primary);
  color: #fff;
}

.other-badge-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.perm-no-results {
  text-align: center;
  color: var(--fc-text-muted);
  padding: 2rem !important;
}

.col-other {
  min-width: 160px;
}
</style>
