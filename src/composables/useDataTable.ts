import { ref, watch, onMounted } from 'vue'
import type { ApiResponse } from '@/types/api'
import type { ListParams } from '@/types/list'

type FetchFn<T> = (params: ListParams) => Promise<ApiResponse<T[]>>

export function useDataTable<T>(fetchFn: FetchFn<T>, defaultSort = 'created_at') {
  const items = ref<T[]>([]) as { value: T[] }
  const loading = ref(false)
  const error = ref('')
  const search = ref('')
  const sortBy = ref(defaultSort)
  const sortDir = ref<'asc' | 'desc'>('desc')
  const page = ref(1)
  const perPage = ref(15)
  const total = ref(0)
  const lastPage = ref(1)

  let searchTimer: ReturnType<typeof setTimeout> | null = null

  async function load(extra: ListParams = {}) {
    loading.value = true
    error.value = ''
    try {
      const response = await fetchFn({
        search: search.value || undefined,
        sort_by: sortBy.value,
        sort_dir: sortDir.value,
        per_page: perPage.value,
        page: page.value,
        ...extra,
      })
      if (response.success) {
        items.value = response.data ?? []
        if (response.meta) {
          total.value = response.meta.total
          lastPage.value = response.meta.last_page
          page.value = response.meta.current_page
        }
      }
    } catch (e) {
      items.value = []
      error.value = (e as Error).message || 'Failed to load data'
    } finally {
      loading.value = false
    }
  }

  function setSort(column: string) {
    if (sortBy.value === column) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = column
      sortDir.value = 'asc'
    }
    page.value = 1
    load()
  }

  function setPage(p: number) {
    page.value = p
    load()
  }

  function setSearch(q: string) {
    search.value = q
    page.value = 1
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => load(), 300)
  }

  function refresh() {
    load()
  }

  onMounted(() => load())

  watch([perPage], () => {
    page.value = 1
    load()
  })

  return {
    items,
    loading,
    error,
    search,
    sortBy,
    sortDir,
    page,
    perPage,
    total,
    lastPage,
    load,
    setSort,
    setPage,
    setSearch,
    refresh,
  }
}
