import type { RolePermissionGroup } from '@/components/admin/PermissionGroupEditor.vue'

export function collectSelectedPermissionNames(groups: RolePermissionGroup[]): string[] {
  const names: string[] = []
  for (const group of groups) {
    for (const key of ['view', 'create', 'edit', 'delete'] as const) {
      const perm = group[key]
      if (perm?.selected) names.push(perm.name)
    }
    for (const perm of group.other) {
      if (perm.selected) names.push(perm.name)
    }
  }
  return names
}

export function cloneRolePermissionGroups(raw: RolePermissionGroup[]): RolePermissionGroup[] {
  return raw.map((group) => ({
    ...group,
    view: group.view ? { ...group.view, selected: !!group.view.selected } : null,
    create: group.create ? { ...group.create, selected: !!group.create.selected } : null,
    edit: group.edit ? { ...group.edit, selected: !!group.edit.selected } : null,
    delete: group.delete ? { ...group.delete, selected: !!group.delete.selected } : null,
    other: group.other.map((perm) => ({ ...perm, selected: !!perm.selected })),
  }))
}

export function emptyRolePermissionGroups(template: RolePermissionGroup[]): RolePermissionGroup[] {
  return template.map((group) => ({
    ...group,
    view: group.view ? { ...group.view, selected: false } : null,
    create: group.create ? { ...group.create, selected: false } : null,
    edit: group.edit ? { ...group.edit, selected: false } : null,
    delete: group.delete ? { ...group.delete, selected: false } : null,
    other: group.other.map((perm) => ({ ...perm, selected: false })),
  }))
}
