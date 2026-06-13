<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import { blogsApi, type Blog } from '@/api/blogs'
import { useDataTable } from '@/composables/useDataTable'
import { usePermissions } from '@/composables/usePermissions'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'

const { t } = useI18n()
const router = useRouter()
const { hasAny } = usePermissions()
const { success, error: notifyError, confirm } = useNotify()
const table = useDataTable<Blog>((p) => blogsApi.list(p), 'created_at')

const columns = [
  { key: 'title', label: t('blogs.title'), sortable: true },
  { key: 'sections_count', label: t('blogs.sections') },
  { key: 'created_at', label: t('common.createdAt'), sortable: true },
]

async function remove(blog: Blog) {
  if (!(await confirm(t('blogs.deleteConfirm', { title: blog.title })))) return
  try {
    await blogsApi.delete(blog.id)
    success(t('blogs.deleted'))
    table.refresh()
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  }
}
</script>

<template>
  <PageCard :title="t('pages.blogs.title')" :subtitle="t('pages.blogs.description')">
    <template #actions>
      <button
        v-if="hasAny('blogs.create')"
        type="button"
        class="btn btn-primary btn-sm"
        @click="router.push('/admin/blogs/create')"
      >
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
      <template #cell-title="{ item }">
        <router-link :to="`/blogs/${(item as Blog).id}`" class="link">
          {{ (item as Blog).title }}
        </router-link>
      </template>
      <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
      <template #actions="{ item }">
        <button
          type="button"
          class="btn-icon"
          :title="t('common.view')"
          @click="router.push(`/admin/blogs/${(item as Blog).id}`)"
        >
          <Icon icon="solar:eye-linear" />
        </button>
        <button
          v-if="hasAny('blogs.update')"
          type="button"
          class="btn-icon"
          :title="t('common.edit')"
          @click="router.push(`/admin/blogs/${(item as Blog).id}/edit`)"
        >
          <Icon icon="solar:pen-linear" />
        </button>
        <button
          v-if="hasAny('blogs.delete')"
          type="button"
          class="btn-icon danger"
          :title="t('common.delete')"
          @click="remove(item as Blog)"
        >
          <Icon icon="solar:trash-bin-trash-linear" />
        </button>
      </template>
    </DataTable>
  </PageCard>
</template>
