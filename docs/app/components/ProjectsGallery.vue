<script setup lang="ts">
import type { Collections } from '@nuxt/content'

interface ProjectFrontmatter {
  path: string
  title: string
  description?: string
  project?: {
    type?: 'commercial' | 'residential'
    status?: 'planning' | 'in-progress' | 'completed'
    client?: string
    location?: string
    area?: string
    startDate?: string
    endDate?: string | null
    brand?: string
    progress?: number
    images?: string[]
    tags?: string[]
  }
}

const { data: projects } = await useAsyncData('projects-gallery', () =>
  queryCollection('docs_ar' as keyof Collections)
    .where('path', 'LIKE', '/ar/projects/%')
    .where('path', '<>', '/ar/projects')
    .select('path', 'title', 'description', 'project')
    .all() as Promise<ProjectFrontmatter[]>,
)

// Filters
const activeStatus = ref<string>('all')
const activeType = ref<string>('all')
const searchQuery = ref('')

const statusOptions = [
  { value: 'all', label: 'الكل', icon: 'i-lucide-layout-grid' },
  { value: 'completed', label: 'مكتمل', icon: 'i-lucide-check-circle' },
  { value: 'in-progress', label: 'جارٍ التنفيذ', icon: 'i-lucide-loader' },
  { value: 'planning', label: 'تخطيط', icon: 'i-lucide-calendar' },
]

const typeOptions = [
  { value: 'all', label: 'كل الأنواع' },
  { value: 'commercial', label: 'تجاري' },
  { value: 'residential', label: 'سكني' },
]

const filteredProjects = computed(() => {
  let list = projects.value || []
  if (activeStatus.value !== 'all') {
    list = list.filter(p => p.project?.status === activeStatus.value)
  }
  if (activeType.value !== 'all') {
    list = list.filter(p => p.project?.type === activeType.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(p =>
      p.title.toLowerCase().includes(q)
      || (p.description || '').toLowerCase().includes(q)
      || (p.project?.client || '').toLowerCase().includes(q)
      || (p.project?.location || '').toLowerCase().includes(q)
      || (p.project?.tags || []).some(t => t.toLowerCase().includes(q)),
    )
  }
  return list
})

const stats = computed(() => {
  const all = projects.value || []
  return {
    total: all.length,
    completed: all.filter(p => p.project?.status === 'completed').length,
    inProgress: all.filter(p => p.project?.status === 'in-progress').length,
    planning: all.filter(p => p.project?.status === 'planning').length,
  }
})

function statusBadge(status?: string) {
  switch (status) {
    case 'completed': return { color: 'success' as const, label: 'مكتمل', icon: 'i-lucide-check-circle' }
    case 'in-progress': return { color: 'warning' as const, label: 'جارٍ التنفيذ', icon: 'i-lucide-loader' }
    case 'planning': return { color: 'info' as const, label: 'تخطيط', icon: 'i-lucide-calendar' }
    default: return { color: 'neutral' as const, label: 'غير محدد', icon: 'i-lucide-help-circle' }
  }
}

function typeBadge(type?: string) {
  return type === 'commercial'
    ? { color: 'primary' as const, label: 'تجاري' }
    : type === 'residential'
      ? { color: 'secondary' as const, label: 'سكني' }
      : { color: 'neutral' as const, label: type || '' }
}

function brandIcon(brand?: string) {
  switch (brand) {
    case 'brand-identity': return 'i-lucide-store'
    case 'luxury-finishing': return 'i-lucide-gem'
    case 'uberfix': return 'i-lucide-wrench'
    default: return 'i-lucide-building-2'
  }
}
</script>

<template>
  <div class="not-prose space-y-6 mt-6">
    <!-- Stats Row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="rounded-xl border border-default bg-elevated px-4 py-3 text-center">
        <div class="text-2xl font-bold text-primary">
          {{ stats.total }}
        </div>
        <div class="text-sm text-muted mt-1">
          إجمالي المشروعات
        </div>
      </div>
      <div class="rounded-xl border border-default bg-elevated px-4 py-3 text-center">
        <div class="text-2xl font-bold text-success">
          {{ stats.completed }}
        </div>
        <div class="text-sm text-muted mt-1">
          مكتملة
        </div>
      </div>
      <div class="rounded-xl border border-default bg-elevated px-4 py-3 text-center">
        <div class="text-2xl font-bold text-warning">
          {{ stats.inProgress }}
        </div>
        <div class="text-sm text-muted mt-1">
          جارٍ التنفيذ
        </div>
      </div>
      <div class="rounded-xl border border-default bg-elevated px-4 py-3 text-center">
        <div class="text-2xl font-bold text-info">
          {{ stats.planning }}
        </div>
        <div class="text-sm text-muted mt-1">
          في التخطيط
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
      <!-- Search -->
      <UInput
        v-model="searchQuery"
        placeholder="ابحث في المشروعات..."
        icon="i-lucide-search"
        class="w-full sm:w-64"
      />

      <!-- Status filter -->
      <div class="flex gap-2 flex-wrap">
        <UButton
          v-for="opt in statusOptions"
          :key="opt.value"
          size="sm"
          :color="activeStatus === opt.value ? 'primary' : 'neutral'"
          :variant="activeStatus === opt.value ? 'solid' : 'outline'"
          :icon="opt.icon"
          @click="activeStatus = opt.value"
        >
          {{ opt.label }}
        </UButton>
      </div>

      <!-- Type filter -->
      <div class="flex gap-2 flex-wrap">
        <UButton
          v-for="opt in typeOptions"
          :key="opt.value"
          size="sm"
          :color="activeType === opt.value ? 'primary' : 'neutral'"
          :variant="activeType === opt.value ? 'solid' : 'outline'"
          @click="activeType = opt.value"
        >
          {{ opt.label }}
        </UButton>
      </div>
    </div>

    <!-- Grid -->
    <div
      v-if="filteredProjects.length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <NuxtLink
        v-for="project in filteredProjects"
        :key="project.path"
        :to="project.path"
        class="group block rounded-xl border border-default bg-background hover:border-primary/50 hover:shadow-md transition-all duration-200 overflow-hidden"
      >
        <!-- Image placeholder / cover -->
        <div class="relative h-40 bg-elevated flex items-center justify-center overflow-hidden">
          <NuxtImg
            v-if="project.project?.images?.[0]"
            :src="project.project.images[0]"
            :alt="project.title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div
            v-else
            class="flex flex-col items-center gap-2 text-muted"
          >
            <UIcon
              :name="brandIcon(project.project?.brand)"
              class="size-10 text-primary/30"
            />
          </div>

          <!-- Status badge overlay -->
          <div class="absolute top-2 start-2">
            <UBadge
              :color="statusBadge(project.project?.status).color"
              variant="solid"
              size="sm"
              :icon="statusBadge(project.project?.status).icon"
            >
              {{ statusBadge(project.project?.status).label }}
            </UBadge>
          </div>

          <!-- Type badge -->
          <div class="absolute top-2 end-2">
            <UBadge
              :color="typeBadge(project.project?.type).color"
              variant="subtle"
              size="sm"
            >
              {{ typeBadge(project.project?.type).label }}
            </UBadge>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 space-y-2">
          <h3 class="font-semibold text-base leading-snug group-hover:text-primary transition-colors">
            {{ project.title }}
          </h3>
          <p
            v-if="project.description"
            class="text-sm text-muted line-clamp-2"
          >
            {{ project.description }}
          </p>

          <div class="flex flex-wrap gap-2 pt-1">
            <span
              v-if="project.project?.location"
              class="flex items-center gap-1 text-xs text-muted"
            >
              <UIcon
                name="i-lucide-map-pin"
                class="size-3"
              />
              {{ project.project.location }}
            </span>
            <span
              v-if="project.project?.area"
              class="flex items-center gap-1 text-xs text-muted"
            >
              <UIcon
                name="i-lucide-maximize-2"
                class="size-3"
              />
              {{ project.project.area }}
            </span>
          </div>

          <!-- Progress bar for in-progress -->
          <div
            v-if="project.project?.status === 'in-progress' && project.project?.progress"
            class="pt-1"
          >
            <div class="flex justify-between text-xs text-muted mb-1">
              <span>نسبة الإنجاز</span>
              <span>{{ project.project.progress }}%</span>
            </div>
            <div class="w-full bg-elevated rounded-full h-1.5">
              <div
                class="bg-warning h-1.5 rounded-full transition-all"
                :style="{ width: `${project.project.progress}%` }"
              />
            </div>
          </div>

          <!-- Tags -->
          <div
            v-if="project.project?.tags?.length"
            class="flex flex-wrap gap-1 pt-1"
          >
            <span
              v-for="tag in project.project.tags.slice(0, 3)"
              :key="tag"
              class="text-xs bg-elevated rounded px-1.5 py-0.5 text-muted"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="text-center py-16 text-muted"
    >
      <UIcon
        name="i-lucide-folder-open"
        class="size-12 mb-3 mx-auto text-muted/50"
      />
      <p class="text-lg font-medium">
        لا توجد مشروعات
      </p>
      <p class="text-sm">
        جرّب تغيير فلتر البحث أو الحالة
      </p>
    </div>
  </div>
</template>
