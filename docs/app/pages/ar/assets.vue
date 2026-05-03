<script setup lang="ts">
import type { AssetsBrowserResponse, AssetEntry } from '../../server/api/assets-browser.get'

definePageMeta({ layout: 'docs' })

useSeoMeta({
  title: 'مستودع الملفات — assets.alazab.com',
  description: 'تصفح الملفات والمواد المرجعية المحفوظة في مستودع مجموعة العزب.',
})

// ── State ────────────────────────────────────────────────────────────────────
const currentPath = ref('/')
const searchQuery = ref('')
const activeExt = ref('all')

// ── Fetch ────────────────────────────────────────────────────────────────────
const { data, pending, refresh, error } = await useAsyncData<AssetsBrowserResponse>(
  'assets-browser',
  () => $fetch<AssetsBrowserResponse>('/api/assets-browser', {
    query: { path: currentPath.value },
  }),
  { watch: [currentPath] },
)

// ── Navigation ───────────────────────────────────────────────────────────────
function navigate(entry: AssetEntry) {
  if (entry.type === 'directory') {
    const base = currentPath.value.endsWith('/') ? currentPath.value : `${currentPath.value}/`
    currentPath.value = `${base}${entry.name}/`
  }
  else {
    window.open(entry.url, '_blank')
  }
}

function goUp() {
  if (currentPath.value === '/') return
  const parts = currentPath.value.replace(/\/$/, '').split('/')
  parts.pop()
  currentPath.value = parts.length > 1 ? `${parts.join('/')}/` : '/'
}

const breadcrumbs = computed(() => {
  const parts = currentPath.value.replace(/\/$/, '').split('/').filter(Boolean)
  const crumbs = [{ label: 'الجذر', path: '/' }]
  let built = ''
  for (const part of parts) {
    built += `/${part}`
    crumbs.push({ label: part, path: `${built}/` })
  }
  return crumbs
})

// ── Filtering ────────────────────────────────────────────────────────────────
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif']
const DOC_EXTS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md']
const VIDEO_EXTS = ['mp4', 'webm', 'mov', 'avi', 'mkv']
const ARCH_EXTS = ['zip', 'rar', '7z', 'tar', 'gz']
const CAD_EXTS = ['dwg', 'dxf', 'rvt', 'rfa', 'skp', 'ifc']

const extGroups = [
  { value: 'all', label: 'الكل', icon: 'i-lucide-layout-grid' },
  { value: 'dirs', label: 'مجلدات', icon: 'i-lucide-folder' },
  { value: 'images', label: 'صور', icon: 'i-lucide-image' },
  { value: 'docs', label: 'مستندات', icon: 'i-lucide-file-text' },
  { value: 'cad', label: 'ملفات معمارية', icon: 'i-lucide-drafting-compass' },
  { value: 'videos', label: 'فيديو', icon: 'i-lucide-video' },
  { value: 'archives', label: 'أرشيف', icon: 'i-lucide-archive' },
]

function entryGroup(entry: AssetEntry): string {
  if (entry.type === 'directory') return 'dirs'
  if (IMAGE_EXTS.includes(entry.ext)) return 'images'
  if (DOC_EXTS.includes(entry.ext)) return 'docs'
  if (CAD_EXTS.includes(entry.ext)) return 'cad'
  if (VIDEO_EXTS.includes(entry.ext)) return 'videos'
  if (ARCH_EXTS.includes(entry.ext)) return 'archives'
  return 'other'
}

const filteredEntries = computed(() => {
  let list = data.value?.entries || []

  if (activeExt.value !== 'all') {
    list = list.filter(e => entryGroup(e) === activeExt.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(e => e.name.toLowerCase().includes(q))
  }

  // Dirs first, then files sorted by name
  return [...list].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name, 'ar')
  })
})

// ── Image fallback ───────────────────────────────────────────────────────────
const failedImages = ref<Set<string>>(new Set())
function onImageError(url: string) {
  failedImages.value = new Set([...failedImages.value, url])
}
function fileIcon(entry: AssetEntry): string {
  if (entry.type === 'directory') return 'i-lucide-folder'
  const g = entryGroup(entry)
  if (g === 'images') return 'i-lucide-image'
  if (g === 'docs') {
    if (entry.ext === 'pdf') return 'i-lucide-file-text'
    return 'i-lucide-file'
  }
  if (g === 'cad') return 'i-lucide-drafting-compass'
  if (g === 'videos') return 'i-lucide-video'
  if (g === 'archives') return 'i-lucide-archive'
  return 'i-lucide-file'
}

function fileIconColor(entry: AssetEntry): string {
  if (entry.type === 'directory') return 'text-warning'
  const g = entryGroup(entry)
  if (g === 'images') return 'text-success'
  if (g === 'docs') return 'text-info'
  if (g === 'cad') return 'text-primary'
  if (g === 'videos') return 'text-purple-500'
  if (g === 'archives') return 'text-orange-500'
  return 'text-muted'
}

function formatSize(bytes: number | null): string {
  if (bytes === null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(mtime: string): string {
  if (!mtime) return ''
  try {
    return new Date(mtime).toLocaleDateString('ar-EG')
  }
  catch {
    return mtime
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <UIcon
            name="i-lucide-hard-drive"
            class="size-7 text-primary"
          />
          مستودع الملفات
        </h1>
        <p class="text-sm text-muted mt-1">
          assets.alazab.com — مستودع ملفات مجموعة العزب
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          size="sm"
          :loading="pending"
          @click="refresh()"
        >
          تحديث
        </UButton>
        <UButton
          icon="i-lucide-external-link"
          color="neutral"
          variant="outline"
          size="sm"
          :to="`https://assets.alazab.com${currentPath}`"
          target="_blank"
        >
          فتح المصدر
        </UButton>
      </div>
    </div>

    <!-- Breadcrumbs -->
    <nav
      class="flex items-center gap-1 text-sm text-muted flex-wrap"
      aria-label="مسار التنقل"
    >
      <template
        v-for="(crumb, i) in breadcrumbs"
        :key="crumb.path"
      >
        <button
          class="hover:text-primary transition-colors"
          :class="{ 'text-foreground font-medium': i === breadcrumbs.length - 1 }"
          @click="currentPath = crumb.path"
        >
          {{ crumb.label }}
        </button>
        <UIcon
          v-if="i < breadcrumbs.length - 1"
          name="i-lucide-chevron-left"
          class="size-3"
        />
      </template>
    </nav>

    <!-- Controls -->
    <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
      <UInput
        v-model="searchQuery"
        placeholder="ابحث في الملفات..."
        icon="i-lucide-search"
        class="w-full sm:w-64"
      />
      <div class="flex gap-2 flex-wrap">
        <UButton
          v-for="grp in extGroups"
          :key="grp.value"
          size="sm"
          :color="activeExt === grp.value ? 'primary' : 'neutral'"
          :variant="activeExt === grp.value ? 'solid' : 'outline'"
          :icon="grp.icon"
          @click="activeExt = grp.value"
        >
          {{ grp.label }}
        </UButton>
      </div>
    </div>

    <!-- Error state -->
    <UAlert
      v-if="error || (data && !data.ok)"
      color="error"
      icon="i-lucide-alert-triangle"
      title="تعذّر تحميل الملفات"
      :description="data?.error || error?.message || 'يُرجى التحقق من اتصالك أو حالة الخادم.'"
    />

    <!-- Loading -->
    <div
      v-else-if="pending"
      class="flex items-center justify-center py-20"
    >
      <UIcon
        name="i-lucide-loader"
        class="size-8 text-primary animate-spin"
      />
    </div>

    <!-- File Grid -->
    <div
      v-else-if="filteredEntries.length"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
    >
      <!-- Go up button -->
      <button
        v-if="currentPath !== '/'"
        class="group flex flex-col items-center gap-2 p-4 rounded-xl border border-default hover:border-primary/50 hover:bg-elevated transition-all text-muted hover:text-foreground"
        @click="goUp()"
      >
        <UIcon
          name="i-lucide-corner-left-up"
          class="size-8"
        />
        <span class="text-xs text-center truncate w-full">للخلف</span>
      </button>

      <button
        v-for="entry in filteredEntries"
        :key="entry.name"
        class="group relative flex flex-col items-center gap-2 p-4 rounded-xl border border-default hover:border-primary/50 hover:bg-elevated transition-all cursor-pointer text-start"
        :title="entry.name"
        @click="navigate(entry)"
      >
        <!-- Image thumbnail -->
        <div
          v-if="entryGroup(entry) === 'images' && !failedImages.has(entry.url)"
          class="w-full h-20 rounded-lg overflow-hidden bg-elevated"
        >
          <img
            :src="entry.url"
            :alt="entry.name"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
            @error="onImageError(entry.url)"
          >
        </div>

        <!-- Generic icon -->
        <UIcon
          v-else
          :name="fileIcon(entry)"
          class="size-10 transition-transform group-hover:scale-110"
          :class="fileIconColor(entry)"
        />

        <!-- Name -->
        <span class="text-xs font-medium text-center line-clamp-2 w-full break-all">
          {{ entry.name }}
        </span>

        <!-- Meta -->
        <div class="flex flex-col items-center gap-0.5 w-full">
          <span
            v-if="entry.size !== null"
            class="text-[10px] text-muted"
          >
            {{ formatSize(entry.size) }}
          </span>
          <span
            v-if="entry.mtime"
            class="text-[10px] text-muted"
          >
            {{ formatDate(entry.mtime) }}
          </span>
        </div>

        <!-- Ext badge -->
        <div
          v-if="entry.ext"
          class="absolute top-2 end-2"
        >
          <span class="text-[9px] uppercase font-bold bg-elevated rounded px-1 py-0.5 text-muted">
            {{ entry.ext }}
          </span>
        </div>
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="text-center py-20 text-muted"
    >
      <UIcon
        name="i-lucide-folder-open"
        class="size-12 mb-3 mx-auto text-muted/40"
      />
      <p class="text-lg font-medium">
        المجلد فارغ
      </p>
      <p class="text-sm mt-1">
        لا توجد ملفات في هذا المسار
      </p>
    </div>

    <!-- Stats bar -->
    <div
      v-if="data?.entries?.length"
      class="flex items-center gap-4 text-xs text-muted border-t border-default pt-4"
    >
      <span>{{ filteredEntries.length }} عنصر</span>
      <span>المسار: {{ currentPath }}</span>
    </div>
  </div>
</template>
