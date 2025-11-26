<script setup lang="ts">
const { locale, locales, switchLocalePath } = useDocusI18n()

function getEmojiFlag(locale: string): string {
  const languageToCountry: Record<string, string> = {
    ar: 'sa', // Arabic -> Saudi Arabia
    bn: 'bd', // Bengali -> Bangladesh
    ca: 'es', // Catalan -> Spain
    ckb: 'iq', // Central Kurdish -> Iraq
    cs: 'cz', // Czech -> Czech Republic (note: modern country code is actually 'cz')
    da: 'dk', // Danish -> Denmark
    el: 'gr', // Greek -> Greece
    en: 'gb', // English -> Great Britain
    et: 'ee', // Estonian -> Estonia
    he: 'il', // Hebrew -> Israel
    hi: 'in', // Hindi -> India
    hy: 'am', // Armenian -> Armenia
    ja: 'jp', // Japanese -> Japan
    kk: 'kz', // Kazakh -> Kazakhstan
    km: 'kh', // Khmer -> Cambodia
    ko: 'kr', // Korean -> South Korea
    ky: 'kg', // Kyrgyz -> Kyrgyzstan
    lb: 'lu', // Luxembourgish -> Luxembourg
    ms: 'my', // Malay -> Malaysia
    nb: 'no', // Norwegian Bokmål -> Norway
    sl: 'si', // Slovenian -> Slovenia
    sv: 'se', // Swedish -> Sweden
    uk: 'ua', // Ukrainian -> Ukraine
    ur: 'pk', // Urdu -> Pakistan
    vi: 'vn', // Vietnamese -> Vietnam
    es: 'es', // Spanish -> Spain
  }

  const baseLanguage = locale.split('-')[0]?.toLowerCase() || locale
  const countryCode = languageToCountry[baseLanguage] || locale.replace(/^.*-/, '').slice(0, 2)

  return countryCode.toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(0x1F1A5 + char.charCodeAt(0)))
    .join('')
}
</script>

<template>
  <UPopover
    mode="hover"
    :content="{ align: 'end' }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      class="size-8"
    >
      <template #trailing>
        <span class="text-lg">
          {{ getEmojiFlag(locale) }}
        </span>
      </template>
    </UButton>

    <template #content>
      <ul class="flex flex-col">
        <li
          v-for="localeItem in locales"
          :key="localeItem.code"
        >
          <NuxtLink
            class="flex justify-between py-1.5 px-2 gap-1 hover:bg-muted"
            :to="switchLocalePath(localeItem.code) as string"
            :aria-label="localeItem.name"
          >
            <span class="text-sm">
              {{ localeItem.name }}
            </span>
            <span class="size-5 text-center">
              {{ getEmojiFlag(localeItem.code) }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </template>
  </UPopover>
</template>
