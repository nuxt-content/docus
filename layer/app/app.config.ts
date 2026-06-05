export default defineAppConfig({
  docus: {
    locale: 'en',
    colorMode: '',
  },
  search: {
    fts: false,
  },
  ui: {
    colors: {
      primary: 'emerald',
      neutral: 'zinc',
    },
    commandPalette: {
      slots: {
        item: 'items-center',
        input: '[&_.iconify]:size-4 [&_.iconify]:mx-0.5',
        itemLeadingIcon: 'size-4 mx-0.5',
      },
    },
    contentToc: {
      defaultVariants: {
        highlightVariant: 'circuit',
      },
    },
    contentNavigation: {
      slots: {
        linkLeadingIcon: 'size-4 mr-1',
        linkTrailing: 'hidden',
      },
      defaultVariants: {
        variant: 'link',
        highlight: true,
      },
    },
    navigationMenu: {
      defaultVariants: {
        variant: 'pill',
        highlight: true,
      },
    },
    pageLinks: {
      slots: {
        linkLeadingIcon: 'size-4',
        linkLabelExternalIcon: 'size-2.5',
      },
    },
  },
})
