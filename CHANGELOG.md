# Changelog

## [4.1.4](https://github.com/nuxt-content/docus/compare/v4.1.3...v4.1.4) (2025-09-11)

### Bug Fixes

* reactive navigation in production ([b073f01](https://github.com/nuxt-content/docus/commit/b073f010e6eb01d63d333349f0175a6a8c2ec8d4))

## [4.1.3](https://github.com/nuxt-content/docus/compare/v4.1.2...v4.1.3) (2025-09-08)

### Bug Fixes

* **landing:** remove prose forced to false by default ([#1176](https://github.com/nuxt-content/docus/issues/1176)) ([9b15ece](https://github.com/nuxt-content/docus/commit/9b15ece2b87813de51d6fffb06995a2f7370d847))

## [4.1.2](https://github.com/nuxt-content/docus/compare/v4.1.1...v4.1.2) (2025-09-04)

### Features

* **imports:** only add useDocusI18n if not already imported ([d3dd4ed](https://github.com/nuxt-content/docus/commit/d3dd4ed17484c3f25b4c39df812d3177ceb7a974))

## [4.1.1](https://github.com/nuxt-content/docus/compare/v4.1.0...v4.1.1) (2025-09-04)

### Features

* **header:** add option to copy logo on right-click ([#1172](https://github.com/nuxt-content/docus/issues/1172)) ([8d954a8](https://github.com/nuxt-content/docus/commit/8d954a8c458e257ffcc861ac59e131ff3927b82a))

### Bug Fixes

* **app:** disable locale redirection check for non i18n ([9b8c571](https://github.com/nuxt-content/docus/commit/9b8c57116610b9dcf4995c0a2c0b40f6e6eea90a))
* **imports:** manually add useDocusI18n ([a4fa212](https://github.com/nuxt-content/docus/commit/a4fa212cfac219e54a3b2106860c41782cf864b9))

## [4.1.0](https://github.com/nuxt-content/docus/compare/v4.0.4...v4.1.0) (2025-09-04)

### Features

* **app:** handle files search and translations on error page ([7081457](https://github.com/nuxt-content/docus/commit/7081457dc6e2278bba15a984f95220355813b806))
* **customization:** `AppFooterLeft` and `AppFooterRight` components ([7815063](https://github.com/nuxt-content/docus/commit/7815063edf4a496ed250dfa114752333af4b3ce3))
* **customization:** DocsAsideLeftBody component ([55c408d](https://github.com/nuxt-content/docus/commit/55c408d4b2360ce55baa6d9565634c515269b611))
* **i18n:** do not register locales if related content is missing ([#1170](https://github.com/nuxt-content/docus/issues/1170)) ([9150d2e](https://github.com/nuxt-content/docus/commit/9150d2e4b23f94d45cc711897e2c9cbce5b69c77))
* **page:** enable dynamic layout from frontmatter ([3143007](https://github.com/nuxt-content/docus/commit/3143007ab65c5810d1afd54bf73e76378b8dce71))

### Bug Fixes

* **ci:** lint ([57c6fe1](https://github.com/nuxt-content/docus/commit/57c6fe16f5a114d8101c69af16b09efe469aefdb))
* **layer:** resolve tailwind + ui pro css paths ([#1161](https://github.com/nuxt-content/docus/issues/1161)) ([35ae390](https://github.com/nuxt-content/docus/commit/35ae390e9ddd55a649dddfa6b6894bd0208b7960))
* **routing:** remove useDocusI18n manual import ([e0c1406](https://github.com/nuxt-content/docus/commit/e0c14067314ae12c74b071690968bc23e6e4aff1))

### Reverts

* Revert "chore(deps): upgrade" ([32f1d0f](https://github.com/nuxt-content/docus/commit/32f1d0f789bfbd9fe0c8c92b0d2558571ad7d1ba))

## [4.0.4](https://github.com/nuxt-content/docus/compare/v4.0.3...v4.0.4) (2025-08-07)

### Bug Fixes

* **css:** ensure tailwind whitelisting without overriding ([5b3f6d2](https://github.com/nuxt-content/docus/commit/5b3f6d2b6671077bd7017ea2d0f198c8484fe562))

## [4.0.3](https://github.com/nuxt-content/docus/compare/v4.0.2...v4.0.3) (2025-08-06)

### Features

* **i18n:** add docus locales for new countries ([638589c](https://github.com/nuxt-content/docus/commit/638589c5e0aa9e2febea0ea7ab32ce59d3b7544f))

### Bug Fixes

* **i18n:** update to v10 by handling redirect on root ([5444fe9](https://github.com/nuxt-content/docus/commit/5444fe90bb39d1b83c3ad15ecdc267e47f85c5e1))
* **prerendering:** remove root route ([c4fb378](https://github.com/nuxt-content/docus/commit/c4fb3788eef46728e7e72e4b4442a169175405ce))
* **prerendering:** use i18n:registerModule hook ([6fc0277](https://github.com/nuxt-content/docus/commit/6fc027721ab64b26d83afa9a5ebac0b16b643553))
* **prerendering:** wrong links ([090b86f](https://github.com/nuxt-content/docus/commit/090b86fe823dcef294ce79f4f0f125883019e409))
* **prerender:** wrong links ([fd30ac0](https://github.com/nuxt-content/docus/commit/fd30ac07724e1ff5ea194fda1d5f8d0cee384e38))
* **routing:** handle unique root level content ([d97a793](https://github.com/nuxt-content/docus/commit/d97a793d5059b1099d251dd8ab73876eb3897891))
* **starters:** fr landing page ([1bba5a0](https://github.com/nuxt-content/docus/commit/1bba5a0545f389cf0dfc7aea2ce59165a4436cf1))
* **template:** ensure composable is available ([a68e88c](https://github.com/nuxt-content/docus/commit/a68e88c5fe9e39cddab8bd3ea4662461208ac412))

## [4.0.2](https://github.com/nuxt-content/docus/compare/v4.0.1...v4.0.2) (2025-07-25)

### Bug Fixes

* **deps:** rollback to i18n v9 for redirection issue ([2ef0181](https://github.com/nuxt-content/docus/commit/2ef018140c47a7ac3ce0ae3acd12f8ae9a2d5ccf))

## [4.0.1](https://github.com/nuxt-content/docus/compare/v4.0.0...v4.0.1) (2025-07-25)

### Bug Fixes

* **git:** hide fatal error when fetching branch ([cbdd880](https://github.com/nuxt-content/docus/commit/cbdd880c9884fbb60e459e93406e8268e0bec3f4))

## [4.0.0](https://github.com/nuxt-content/docus/compare/v3.0.5...v4.0.0) (2025-07-25)

### Features

* **cli:** add `prepare` command ([2bec323](https://github.com/nuxt-content/docus/commit/2bec3236ffa47d2503b97e676318122ac9b43d4b))
* **cli:** use native nuxt cli instead of docus CLI ([#1117](https://github.com/nuxt-content/docus/issues/1117)) ([ff4bc93](https://github.com/nuxt-content/docus/commit/ff4bc93ea3b6b903632b20419ca1ceb6b0965392))
* **i18n:** adapt visual to i18n configuration ([0d99d98](https://github.com/nuxt-content/docus/commit/0d99d98f868a416fa3b8db614e987452cdae9159))

### Bug Fixes

* **app:** correct types ([448b78a](https://github.com/nuxt-content/docus/commit/448b78a4fb3539047f2e23eb36d04afb77c03f4b))
* **typecheck:** use nuxtrc to detect i18n module in layer ([905716e](https://github.com/nuxt-content/docus/commit/905716efb66f135f143789576b33e66783bae925))

## [3.0.5](https://github.com/nuxt-content/docus/compare/v3.0.4...v3.0.5) (2025-07-01)

### Features

* **app:** add `bash` & `diff` highlight langs ([55e0fa0](https://github.com/nuxt-content/docus/commit/55e0fa0408e5d0656fa36cb49554668dbc288082))
* **app:** handle `github.rootDir` app config ([0698787](https://github.com/nuxt-content/docus/commit/06987870962d6c3b604f35126c10018388930c37))

### Bug Fixes

* **app:** add `highlight` on content toc ([a511b50](https://github.com/nuxt-content/docus/commit/a511b508cd2140f86ba7e045244cf59b68f84c68))
* **app:** allow content navigation variant override ([ccc1340](https://github.com/nuxt-content/docus/commit/ccc1340faa0da10ac8e17d909739b987b337fcd4))
* **app:** display page links in header ([9acc755](https://github.com/nuxt-content/docus/commit/9acc75565f1f92013371319a2506edbba7dd415c))
* **app:** import from `@nuxt/kit` ([d8dbee4](https://github.com/nuxt-content/docus/commit/d8dbee4c804754b94ff3abc9e0d0225f5112688a))
* **app:** improve app config type ([246c16a](https://github.com/nuxt-content/docus/commit/246c16a984e1e837c19bdd22c439bb6fb5bbf813))
* **app:** use `useClipboard` to copy page ([a8cd48b](https://github.com/nuxt-content/docus/commit/a8cd48b063679b1c58142842ef857abf15fc8630))

## [3.0.4](https://github.com/nuxt-content/docus/compare/v3.0.3...v3.0.4) (2025-06-24)

### Bug Fixes

* **prerender:** redirect issue with static deployment ([5f8fbb3](https://github.com/nuxt-content/docus/commit/5f8fbb32c5cba8479b2562495d0fb7c49291c6de))

## [3.0.3](https://github.com/nuxt-content/docus/compare/v3.0.2...v3.0.3) (2025-06-20)

### Features

* **nav:** handle nav for docs folder ([65a477a](https://github.com/nuxt-content/docus/commit/65a477a0974ced0cae7aed6d5fd498ec4e7e0687))

### Bug Fixes

* **landing:** conditionally add prose ([1931668](https://github.com/nuxt-content/docus/commit/19316680c2c2035d7d72b4628d2caa901b3a01a6))
* **landing:** put back prose ([73edf2a](https://github.com/nuxt-content/docus/commit/73edf2a417802b5a366af17d17961f4e9a900564))
* **prerender:** add mardown raw content ([e35b7aa](https://github.com/nuxt-content/docus/commit/e35b7aaab954f69b7b8edd67d92a37ba6678c9d4))

## [3.0.2](https://github.com/nuxt-content/docus/compare/v3.0.1...v3.0.2) (2025-06-17)

### Features

* **llms:** enable full by default ([677078f](https://github.com/nuxt-content/docus/commit/677078f0d1e432d7b25e876374e36eeb2796d5f2))

### Bug Fixes

* **setup:** docs layer ([d407155](https://github.com/nuxt-content/docus/commit/d40715593adecf5e8421e100e897687a28a56e39))
* **starter:** prerender issues ([2facbea](https://github.com/nuxt-content/docus/commit/2facbeaa3c8c9287c2048c754602063912fe5a49))

## [3.0.1](https://github.com/nuxt-content/docus/compare/v3.0.0...v3.0.1) (2025-06-17)

### Bug Fixes

* **configs:** handle llms and site default configs in a module ([c642df9](https://github.com/nuxt-content/docus/commit/c642df95c0a3a8b98eddaa33f00b5b1187eeaba8))
* improve async data key for SEO ([2de5ffe](https://github.com/nuxt-content/docus/commit/2de5ffe22ccfc9fb46c802d0fbc77f4a764f78a5))
* **llms:** missing deps to enable full ([6d354ce](https://github.com/nuxt-content/docus/commit/6d354ceafa7792880f50487d2ad392172df10d87))
* **setup:** define default app config in module ([b250a1b](https://github.com/nuxt-content/docus/commit/b250a1b677c6cf1bf68794615c86599864ce9fd5))

## [3.0.0](https://github.com/nuxt-content/docus/compare/v3.0.0-alpha.3...v3.0.0) (2025-06-13)

### Features

* **llms:** enable full ([65374af](https://github.com/nuxt-content/docus/commit/65374af2bc44c42cb35fa66055bd65d092dcd32e))

## [3.0.0-alpha.3](https://github.com/nuxt-content/docus/compare/v3.0.0-alpha.2...v3.0.0-alpha.3) (2025-06-12)

## [3.0.0-alpha.2](https://github.com/nuxt-content/docus/compare/v3.0.0-alpha.1...v3.0.0-alpha.2) (2025-06-12)

### Bug Fixes

* **ci:** nightly ([26b92a7](https://github.com/nuxt-content/docus/commit/26b92a71a2abd1e0216f6d7433edfde696c25264))
* **deps:** add brace-expansion as optimized deps ([32a5589](https://github.com/nuxt-content/docus/commit/32a5589d0abaec0a4566778fa154e1eee28c014a))
* **deps:** remove brace-expansion optimization ([355ac39](https://github.com/nuxt-content/docus/commit/355ac39d60674aec4e99234a6e73502db00ce4a8))

## [3.0.0-alpha.1](https://github.com/nuxt-content/docus/compare/v3.0.0-alpha.0...v3.0.0-alpha.1) (2025-06-12)

### Bug Fixes

* **deps:** refine optimizeDeps of `@nuxt/content` ([#1080](https://github.com/nuxt-content/docus/issues/1080)) ([ba0f6ef](https://github.com/nuxt-content/docus/commit/ba0f6effa28b25135719746da17991453ffd678d))

## [3.0.0-alpha.0](https://github.com/nuxt-content/docus/compare/v2.0.0-alpha.1...v3.0.0-alpha.0) (2025-06-12)

### Bug Fixes

* **docs:** use docus instead of @larbish/docus ([0dee9ec](https://github.com/nuxt-content/docus/commit/0dee9ec484f4f097c68f2236cb2f927dcbd1db30))

## [2.0.0-alpha.1](https://github.com/nuxt-content/docus/compare/v2.0.0-alpha.0...v2.0.0-alpha.1) (2025-06-10)

### Bug Fixes

* **cli:** init command ([cfa6290](https://github.com/nuxt-content/docus/commit/cfa6290f5aa38da852dad57780a277c502df3daf))

## [2.0.0-alpha.0](https://github.com/nuxt-content/docus/compare/v2.0.0...v2.0.0-alpha.0) (2025-06-10)

### Features

* animate the menu toggle icon ([1cb0273](https://github.com/nuxt-content/docus/commit/1cb0273d68e8b28b76c22f07cb40ca74c8034189))
* **app:** build command ([cb505bb](https://github.com/nuxt-content/docus/commit/cb505bbfffc50654a4634846ff39510401c93bf2))
* **app:** compat nuxt version 4 ([594ac08](https://github.com/nuxt-content/docus/commit/594ac0834738effb6752f3b3efc25d1dd9f0b3d7))
* **app:** init docus v2 ([bc3a9d1](https://github.com/nuxt-content/docus/commit/bc3a9d101052fb787e562744d5d9b3d87799c24b))
* **app:** rename DocsHeaderRight to DocsPageHeaderLinks ([82a2ca8](https://github.com/nuxt-content/docus/commit/82a2ca87aefdf446c62564010c6839b76a57de89))
* **ci:** publish nightly ([4753cd4](https://github.com/nuxt-content/docus/commit/4753cd450f8f6741572911169ea21c88e1f75915))
* **components:** AppHeaderBody ([ae5ecc8](https://github.com/nuxt-content/docus/commit/ae5ecc86d00918c9fb35f235bc2b72c322932f9d))
* **components:** customizable app header and docs asides ([4ca262b](https://github.com/nuxt-content/docus/commit/4ca262b247f01ad4b8041bf106886f3d506525fa))
* **config:** handle app.config.ts ([739cbb1](https://github.com/nuxt-content/docus/commit/739cbb151a5d8ff510662d1ee534a827e05cb21f))
* **docs:** docs header right ([843527c](https://github.com/nuxt-content/docus/commit/843527cb6f909fd9cf5492b014b659d45490f3ef))
* **docs:** links from app config from docs aside right bottom ([28f521d](https://github.com/nuxt-content/docus/commit/28f521dd51aa4ce5b7354416bd3bf626f9f79cd0))
* **docs:** trigger nightly ([4493e33](https://github.com/nuxt-content/docus/commit/4493e33d6cce899d4eacb4f0191cbfe40b6554d9))
* improvements ([b1af212](https://github.com/nuxt-content/docus/commit/b1af212900712223673617749eecb227378cb3e3))
* **llms:** integrate nuxt llms by default ([3f060d8](https://github.com/nuxt-content/docus/commit/3f060d85bca006e8cea412144fdfda7eec481d1f))
* **seo:** og images landing ([a81f07b](https://github.com/nuxt-content/docus/commit/a81f07b49ee21b6bb1e944178f596065ce8b0ff2))
* **seo:** site name and title template ([19fb325](https://github.com/nuxt-content/docus/commit/19fb32542036ff943bc1ad532ce182d9fe036a5b))
* **social:** update og image ([87f87e4](https://github.com/nuxt-content/docus/commit/87f87e4cb2905267feb2bd66fe8c744d7ace53af))
* **starter:** update ([6ddff7f](https://github.com/nuxt-content/docus/commit/6ddff7fd3909c746c86ac6a82b6bbc350c3e987e))

### Bug Fixes

* add docs dir only if not found as layer ([05fdaf3](https://github.com/nuxt-content/docus/commit/05fdaf3a87edf1b9470918259e7792b91a82d1a1))
* **app:** config ([af15911](https://github.com/nuxt-content/docus/commit/af15911b054c9d7c3c22902f4d44860da3510f12))
* **cli:** layers ([370740c](https://github.com/nuxt-content/docus/commit/370740c4231d147bac5c5f5f90702fc9f0b3a74e))
* **cli:** rename to docus ([ef17013](https://github.com/nuxt-content/docus/commit/ef1701359be87390ceae4b064970269f4bd206b3))
* **cli:** update init cmd ([b902db7](https://github.com/nuxt-content/docus/commit/b902db7ce6293c778577747905718e62e1e4d4cd))
* **config:** update toc links schema ([5ce2c70](https://github.com/nuxt-content/docus/commit/5ce2c70aa7c52be341c9484d5fd10427c8320d09))
* **docs:** copy page ([63f1088](https://github.com/nuxt-content/docus/commit/63f1088a7b4efe0cf12213df899554cb8e820a86))
* **docs:** safari copy to clipboard ([4761858](https://github.com/nuxt-content/docus/commit/47618586a94169e9e4f75158ffd2e62539735f01))
* **git:** fetch info ([98dae4b](https://github.com/nuxt-content/docus/commit/98dae4bf59829313cd630f7bf4eaffb6003cbe95))
* **git:** vercel branch name variable ([966a1b9](https://github.com/nuxt-content/docus/commit/966a1b9369957e76019efdc3dc0c48c8d3c99a07))
* **icon:** use iconify provider ([f41113c](https://github.com/nuxt-content/docus/commit/f41113c1f767db3f26830070db245fcd542caa5e))
* **landing:** neutral and primary in iframe command menu ([e16717d](https://github.com/nuxt-content/docus/commit/e16717df0ae90cea71bf9c83eb8056c4a3d59202))
* **package:** add repository ([cebd917](https://github.com/nuxt-content/docus/commit/cebd91740a797b7c4f94dd360b335a289f18e2e6))
* **package:** dev without rebuild ([67fad9e](https://github.com/nuxt-content/docus/commit/67fad9ec773caeac517d737dfc8370b1302d4de5))
* **package:** set pnpm version ([b96e34b](https://github.com/nuxt-content/docus/commit/b96e34b6cfb6a070667e812925c5058585710169))
* **pages:** possibility to set gh edit url ([85a01e7](https://github.com/nuxt-content/docus/commit/85a01e79817c53142472c49a4e1db684c71c7b3e))
* **schema:** toc ([00b90d8](https://github.com/nuxt-content/docus/commit/00b90d89fe16db9ee92894e8bb1e797674c9cd93))
* **seo:** default title and description ([0321956](https://github.com/nuxt-content/docus/commit/03219562b9fa02eed1ee1bbf4cbab31092028911))
* **seo:** site name and url ([afc59b6](https://github.com/nuxt-content/docus/commit/afc59b678287caf53b39ac69d65165a67a4840b8))
* **seo:** use seo key instead of site ([68bece7](https://github.com/nuxt-content/docus/commit/68bece7bdbb9b9ef7d9ed7408a37ffb8445a0453))
* **seo:** use site title ([9e9df32](https://github.com/nuxt-content/docus/commit/9e9df3264efec4fd6f4cf9843894c05f3f77ce15))
* **setup:** default header title ([1a4ee1d](https://github.com/nuxt-content/docus/commit/1a4ee1d80f00d673b5b58048c28d673e977b0204))
* **setup:** infer URL ([105e1ca](https://github.com/nuxt-content/docus/commit/105e1ca4ac7b33fd6589cc533c75bed561c06ca4))
* source app config ([abc5c35](https://github.com/nuxt-content/docus/commit/abc5c355daa47665c064a19834455c1e57c5799c))
