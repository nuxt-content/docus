<script setup lang="ts">
import { useVersion } from '../composables/useVersion'

const { version, versions, switchVersion } = useVersion()

const currentVersion = computed(() => versions.find(v => v.value === version.value))

const items = computed(() => versions.map(v => ({
  label: v.label,
  icon: v.value === version.value ? 'i-lucide-check' : undefined,
  active: v.value === version.value,
  slot: 'version' as const,
  tag: v.tag,
  onSelect: () => switchVersion(v.value),
})))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'start' }"
    :ui="{
      content: 'w-(--reka-dropdown-menu-trigger-width)',
    }"
  >
    <button class="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-elevated transition-colors cursor-pointer">
      <div class="flex items-center gap-2 min-w-0">
        <UIcon
          name="i-lucide-book-open"
          class="size-4 shrink-0 text-primary"
        />
        <span class="font-medium text-highlighted truncate">{{ currentVersion?.label || version }}</span>
        <UBadge
          v-if="currentVersion?.tag"
          :label="currentVersion.tag"
          variant="subtle"
          size="sm"
        />
      </div>
      <UIcon
        name="i-lucide-chevrons-up-down"
        class="size-4 shrink-0 text-muted"
      />
    </button>

    <template #version="{ item }">
      <span class="truncate">{{ item.label }}</span>
      <UBadge
        v-if="item.tag"
        :label="item.tag"
        variant="subtle"
        size="sm"
      />
    </template>
  </UDropdownMenu>
</template>
