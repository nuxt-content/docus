# Reproduce create-docus Error

This setup successfully reproduces the reported error when running `create-docus my-docs`.

## ✅ Confirmed Reproduction

The error has been successfully reproduced. When you run the Docker container, you'll see:

```
ERROR Invalid command, must be named
  at runCommand (/workspace/cli/node_modules/.pnpm/nuxi@3.29.3/node_modules/nuxi/dist/shared/nuxi.CM8jcyGe.mjs:690:11)
```

## Test Options

### Option 1: Test Local Build

Tests your local changes to the CLI:

```bash
# Build locally first (if you made changes)
cd cli && pnpm build && cd ..

# Run with docker compose
docker compose up --build
```

### Option 2: Test Published Package

Tests the latest published version from npm:

```bash
docker compose -f docker-compose.published.yml up --build
```

This pulls `create-docus@latest` directly from npm.

## Debug

To get a shell and investigate:
```bash
docker build -t test-docus .
docker run -it test-docus /bin/sh

# Inside container:
cd /workspace/cli
cat dist/main.mjs

# Try running directly
node dist/main.mjs my-docs

# Check nuxi
cd /workspace/cli && pnpm list nuxi
npx nuxi --help

# Test nuxi directly
npx nuxi init test-direct -t gh:nuxt-content/docus/.starters/default
```

