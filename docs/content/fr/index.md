---
seo:
  title: Rédigez votre documentation en Markdown
  description: Publiez instantanément une documentation élégante, optimisée pour
    le SEO, avec design déjà pensé. Docus intègre le meilleur de l'écosystème
    Nuxt.
---

::u-page-hero
#title
Créez votre documentation en Markdown

#description
Publiez instantanément une documentation élégante, optimisée pour le SEO, avec design déjà pensé. :br Docus intègre le meilleur de l’écosystème Nuxt.

#links
  :::u-button
  ---
  color: neutral
  size: xl
  to: /fr/getting-started/installation
  trailing-icon: i-lucide-arrow-right
  ---
  Commencer
  :::

  :::u-button
  ---
  color: neutral
  icon: simple-icons-github
  size: xl
  to: https://github.com/nuxt-content/docus
  variant: outline
  ---
  Voir sur GitHub
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
    Construit avec [Nuxt]{.text-primary}

    #description
    Optimisé par votre meta framework Vue préféré. Docus vous donne tout ce dont vous avez besoin pour créer des sites rapides, performants et optimisés pour le SEO.
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
      alt: Magnifique visuel propulsé par UI
      class: w-full h-80 object-cover rounded-lg
      dark: /landing/dark/templates-ui-pro.webp
      light: /landing/light/templates-ui-pro.webp
      ---
      :::::

    #title
    Propulsé par [Nuxt UI]{.text-primary}

    #description
    Sexy, minimaliste et personnalisable. Docus intègre Nuxt UI pour vous offrir la meilleure expérience pour écrire une documentation sans boilerplate, concentrez-vous simplement sur votre contenu.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2
    target: _blank
    ---
      :::::tabs
        ::::::tabs-item{.mt-5 icon="i-lucide-eye" label="Aperçu"}
          :::::::div{.flex.flex-col.gap-4}
            ::::::::note{.my-0}
            Voici des informations supplémentaires pour vous.
            ::::::::

            ::::::::tip{.my-0}
            Voici une suggestion utile.
            ::::::::

            ::::::::warning{.my-0}
            Faites attention à cette action car elle pourrait avoir des résultats inattendus.
            ::::::::

            ::::::::caution{.my-0}
            Cette action est irréversible.
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
        Voici des informations supplémentaires.
        ::

        ::tip
        Voici une suggestion utile.
        ::

        ::warning
        Faites attention à cette action car elle pourrait avoir des résultats inattendus.
        ::

        ::caution
        Cette action est irréversible.
        ::
        ```
        ::::::
      :::::

    #title
    Markdown amélioré par [Nuxt Content]{.text-primary}

    #description
    La seule chose dont vous devez vous soucier est d'écrire votre contenu. Rédigez vos pages en Markdown et intégrer des composants Nuxt UI ou des composants Vue personnalisés. La structure, le routing et le rendu sont gérés pour vous.
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
    Personnalisation avec [Nuxt App Config]{.text-primary}

    #description
    Mettez à jour les couleurs, les liens sociaux, les logos ou même le style de vos composants globalement via le `app.config.ts`, sans modification directe du code.
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
    [Nuxt Color]{.text-primary}

    #description
    Light et dark mode intégré, aucune configuration nécessaire.
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
      alt: Navigation intégrée et recherche plein texte
      class: rounded-lg
      dark: /landing/dark/command-menu.png
      format: webp
      light: /landing/light/command-menu.png
      loading: lazy
      ---
      :::::

    #title
    Navigation intégrée et [recherche textuelle]{.text-primary}

    #description
    Concentrez-vous uniquement sur votre contenu, Docus génère automatiquement une modale de recherche et la navigation latérale pour vous.
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
    Collaborez sur [Nuxt Studio]{.text-primary}

    #description
    Rédigez et gérez votre contenu visuellement, sans aucune connaissance de Markdown requise. Laissez vos collègues non techniques collaborer sur la documentation et intégrer des composants Vue sans compétences en code.
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
        alt: Visuel Nuxt Image
        class: w-[30%] lg:w-[70%] my-12 lg:my-0
        dark: /landing/dark/nuxt-image.svg
        light: /landing/light/nuxt-image.svg
        ---
        ::::::
      :::::

    #title
    Optimisation [Nuxt Image]{.text-primary}

    #description
    Docus convertit automatiquement les images Markdown pour utiliser `<NuxtImg>`.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2 lg:col-span-1
    target: _blank
    to: /fr/concepts/internationalization
    ---
      :::::u-color-mode-image
      ---
      height: 195
      width: 403
      alt: Illustration de l'internationalisation
      class: w-full h-auto rounded-lg
      dark: /landing/dark/i18n.svg
      light: /landing/light/i18n.svg
      ---
      :::::

    #title
    Support d'[internationalisation]{.text-primary}

    #description
    Support i18n intégré avec routage automatique et gestion de contenu. Créez une documentation multilingue sans effort.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2
    target: _blank
    to: /fr/ai/mcp
    ---
      :::::u-color-mode-image
      ---
      height: 400
      width: 859
      alt: Illustration du serveur MCP natif et contenu prêt pour l'IA
      class: w-full h-auto rounded-lg
      dark: /landing/dark/mcp.svg
      light: /landing/light/mcp.svg
      ---
      :::::

    #title
    Prêt pour l'[IA]{.text-primary} avec MCP natif

    #description
    Serveur Model Context Protocol intégré qui connecte votre documentation aux outils IA comme Cursor, VS Code et Claude. Génération automatique des fichiers `llms.txt` et `llms-full.txt` pour une intégration LLM transparente.
    ::::
  :::
::
