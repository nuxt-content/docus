import { field, group } from '@nuxt/content/preview'

export default defineNuxtSchema({
  appConfig: {
    ui: group({
      title: 'UI',
      description: 'UI Customization.',
      icon: 'i-lucide-palette',
      fields: {
        colors: group({
          title: 'Colors',
          description: 'Manage main colors of your application',
          icon: 'i-lucide-palette',
          fields: {
            primary: field({
              type: 'string',
              title: 'Primary',
              description: 'Primary color of your UI.',
              icon: 'i-lucide-palette',
              default: 'green',
              required: ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'],
            }),
            neutral: field({
              type: 'string',
              title: 'Neutral',
              description: 'Neutral color of your UI.',
              icon: 'i-lucide-palette',
              default: 'slate',
              required: ['slate', 'gray', 'zinc', 'neutral', 'stone'],
            }),
          },
        }),
        icons: group({
          title: 'Icons',
          description: 'Manage icons used in the application.',
          icon: 'i-lucide-settings',
          fields: {
            search: field({
              type: 'icon',
              title: 'Search Bar',
              description: 'Icon to display in the search bar.',
              icon: 'i-lucide-search',
              default: 'i-lucide-search',
            }),
            dark: field({
              type: 'icon',
              title: 'Dark mode',
              description: 'Icon of color mode button for dark mode.',
              icon: 'i-lucide-moon',
              default: 'i-lucide-moon',
            }),
            light: field({
              type: 'icon',
              title: 'Light mode',
              description: 'Icon of color mode button for light mode.',
              icon: 'i-lucide-sun',
              default: 'i-lucide-sun',
            }),
            external: field({
              type: 'icon',
              title: 'External Link',
              description: 'Icon for external link.',
              icon: 'i-lucide-external-link',
              default: 'i-lucide-external-link',
            }),
            chevron: field({
              type: 'icon',
              title: 'Chevron',
              description: 'Icon for chevron.',
              icon: 'i-lucide-chevron-down',
              default: 'i-lucide-chevron-down',
            }),
            hash: field({
              type: 'icon',
              title: 'Hash',
              description: 'Icon for hash anchors.',
              icon: 'i-lucide-hash',
              default: 'i-lucide-hash',
            }),
          },
        }),
      },
    }),
    seo: group({
      title: 'SEO',
      description: 'SEO configuration.',
      icon: 'i-lucide-search',
      fields: {
        title: field({
          type: 'string',
          title: 'Title',
          description: 'Title to display in the header.',
          icon: 'i-lucide-type',
          default: '',
        }),
        description: field({
          type: 'string',
          title: 'Description',
          description: 'Description to display in the header.',
          icon: 'i-lucide-type',
          default: '',
        }),
      },
    }),
    header: group({
      title: 'Header',
      description: 'Header configuration.',
      icon: 'i-lucide-layout',
      fields: {
        title: field({
          type: 'string',
          title: 'Title',
          description: 'Title to display in the header.',
          icon: 'i-lucide-type',
          default: '',
        }),
        logo: group({
          title: 'Logo',
          description: 'Header logo configuration.',
          icon: 'i-lucide-image',
          fields: {
            light: field({
              type: 'media',
              title: 'Light Mode Logo',
              description: 'Pick an image from your gallery.',
              icon: 'i-lucide-sun',
              default: '',
            }),
            dark: field({
              type: 'media',
              title: 'Dark Mode Logo',
              description: 'Pick an image from your gallery.',
              icon: 'i-lucide-moon',
              default: '',
            }),
            alt: field({
              type: 'string',
              title: 'Alt',
              description: 'Alt to display for accessibility.',
              icon: 'i-lucide-text',
              default: '',
            }),
          },
        }),
      },
    }),
    socials: field({
      type: 'object',
      title: 'Social Networks',
      description: 'Social links configuration.',
      icon: 'i-lucide-network',
      default: {},
    }),
    toc: group({
      title: 'Table of contents',
      description: 'TOC configuration.',
      icon: 'i-lucide-list',
      fields: {
        title: field({
          type: 'string',
          title: 'Title',
          description: 'Title of the table of contents.',
          icon: 'i-lucide-heading',
          default: 'On this page',
        }),
        bottom: group({
          title: 'Bottom',
          description: 'Bottom section of the table of contents.',
          icon: 'i-lucide-list',
          fields: {
            title: field({
              type: 'string',
              title: 'Title',
              description: 'Title of the bottom section.',
              icon: 'i-lucide-heading',
              default: 'Community',
            }),
            links: field({
              type: 'array',
              title: 'Links',
              description: 'Links to display in the bottom section.',
              icon: 'i-lucide-link',
              default: [],
            }),
          },
        }),
      },
    }),
    github: group({
      title: 'GitHub',
      description: 'GitHub configuration.',
      icon: 'i-simple-icons-github',
      fields: {
        url: field({
          type: 'string',
          title: 'URL',
          description: 'GitHub URL.',
          icon: 'i-simple-icons-github',
          default: '',
        }),
        branch: field({
          type: 'string',
          title: 'Branch',
          description: 'GitHub branch.',
          icon: 'i-lucide-git-branch',
          default: 'main',
        }),
        rootDir: field({
          type: 'string',
          title: 'Root Directory',
          description: 'Root directory of the GitHub repository.',
          icon: 'i-lucide-folder',
          default: '',
        }),
      },
    }),
  },
})
