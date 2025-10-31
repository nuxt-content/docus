---
seo:
  title: Write beautiful docs with Markdown
  description: Ship fast, flexible, and SEO-optimized documentation with beautiful
    design out of the box. Docus brings together the best of the Nuxt ecosystem.
    Powered by Nuxt UI.
---

::u-page-hero
#title
Write beautiful docs with Markdown.

#description
Ship fast, flexible, and SEO-optimized documentation with beautiful design out of the box. :br Docus brings the best of the Nuxt ecosystem.

#links
  :::u-button
  ---
  color: neutral
  size: xl
  to: en/getting-started/installation
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::u-button
  ---
  color: neutral
  icon: simple-icons-github
  size: xl
  to: https://github.com/nuxt-content/docus
  variant: outline
  ---
  Star on GitHub
  :::

#headline
  :::u-button
  ---
  size: sm
  to: https://github.com/nuxt-content/docus/releases/tag/v5.0.0
  variant: outline
  ---
  Docus v5 →
  :::
::

::u-page-section
  :::u-page-grid
    ::::u-page-card
    ---
    spotlight: true
    class: group col-span-2 lg:col-span-1
    target: _blank
    to: https://nuxt.com
    ---
      :::::floating-nuxt
      :::::
    
    #title
    Built with [Nuxt 4]{.text-primary}
    
    #description
    Optimized by the most famous Vue framework. Docus gives you everything you need to build fast, performant, and SEO-friendly websites.
    ::::
  
    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2
    target: _blank
    to: https://ui.nuxt.com
    ---
      :::::u-color-mode-image
      ---
      height: 320
      width: 859
      alt: Beautiful visual powered by UI
      class: w-full h-80 object-cover rounded-lg
      dark: /landing/dark/templates-ui-pro.webp
      light: /landing/light/templates-ui-pro.webp
      ---
      :::::
    
    #title
    Powered by [Nuxt UI]{.text-primary}
    
    #description
    Beautiful out of the box, minimal by design but highly customizable. Docus leverages Nuxt UI to give you the best docs writing experience with zero boilerplate, just focus on your content.
    ::::
  
    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2
    target: _blank
    ---
      :::::tabs
        ::::::tabs-item{.mt-5 icon="i-lucide-eye" label="Preview"}
          :::::::div{.flex.flex-col.gap-4}
            ::::::::note{.my-0}
            Here's some additional information for you.
            ::::::::
          
            ::::::::tip{.my-0}
            Here's a helpful suggestion.
            ::::::::
          
            ::::::::warning{.my-0}
            Be careful with this action as it might have unexpected results.
            ::::::::
          
            ::::::::caution{.my-0}
            This action cannot be undone.
            ::::::::
          :::::::
        ::::::
      
        ::::::tabs-item
        ---
        class: mt-5 mb-2 text-xs overflow-x-auto
        icon: i-lucide-code
        label: Code
        ---
        ```mdc
        ::note
        Here's some additional information.
        ::
        
        ::tip
        Here's a helpful suggestion.
        ::
        
        ::warning
        Be careful with this action as it might have unexpected results.
        ::
        
        ::caution
        This action cannot be undone.
        ::
        ```
        ::::::
      :::::
    
    #title
    Enhanced Markdown syntax by [Nuxt Content]{.text-primary}
    
    #description
    The only thing you need to take care about is writing your content. Write your pages in Markdown and extend with MDC syntax to embed Nuxt UI or custom Vue components. Structure, routing, and rendering are handled for you.
    ::::
  
    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2 md:col-span-1
    target: _blank
    ---
      :::::div{.bg-elevated.rounded-lg.p-3.overflow-x-auto}
      ```ts [app.config.ts]
      export default defineAppConfig({
        ui: {
          colors: {
            primary: 'green',
            secondary: 'sky',
          },
        },
        socials: {
          x: 'https://x.com/nuxt_js',
          nuxt: 'https://nuxt.com'
        }
      })
      ```
      :::::
    
    #title
    Customize with [Nuxt App Config]{.text-primary}
    
    #description
    Update colors, social links, header logos and component styles globally using the `app.config.ts`, no direct code modifications required.
    ::::
  
    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2 md:col-span-1 min-h-[450px]
    target: _blank
    ---
      :::::color-mode-switch
      :::::
    
    #title
    [Nuxt Color]{.text-primary} mode
    
    #description
    Built-in dark mode provided, no configuration required.
    ::::
  
    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2
    target: _blank
    ---
      :::::u-color-mode-image
      ---
      height: 554
      width: 859
      alt: Built-in navigation and full-text search
      class: rounded-lg
      dark: /landing/dark/command-menu.png
      format: webp
      light: /landing/light/command-menu.png
      loading: lazy
      ---
      :::::
    
    #title
    Built-in navigation and [full-text search]{.text-primary}
    
    #description
    Only focus on ordering your content, Docus handles the search modal and auto-generates the side navigation for you.
    ::::
  
    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2
    target: _blank
    ---
      :::::browser-frame
      :video{.rounded-md controls loop playsinline src="https://res.cloudinary.com/nuxt/video/upload/v1747230893/studio/wzt9zfmdvk7hgmdx3cnt.mp4"}
      :::::
    
    #title
    Collaborate on [Nuxt Studio]{.text-primary}
    
    #description
    Write and manage your content visually, with zero Markdown knowledge required. Let your non technical colleagues collaborate on the documentation and integrate Vue components without code skills.
    ::::
  
    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2 lg:col-span-1
    target: _blank
    to: https://image.nuxt.com/
    ---
      :::::div{.flex-1.flex.items-center.justify-center}
        ::::::u-color-mode-image
        ---
        alt: Nuxt Image visual
        class: w-[30%] lg:w-[70%] my-12 lg:my-0
        dark: /landing/dark/nuxt-image.svg
        light: /landing/light/nuxt-image.svg
        ---
        ::::::
      :::::
    
    #title
    [Nuxt Image]{.text-primary} optimization
    
    #description
    Docus automatically converts Markdown images to use `<NuxtImg>` .
    ::::
  :::
::
