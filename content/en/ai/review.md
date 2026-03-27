---
title: Review Agent
description: Automate documentation reviews on your pull requests with a built-in AI agent.
---

# Review Agent

> Automate documentation reviews on your pull requests with a built-in AI agent.

The Review Agent helps keep your documentation accurate and up to date by automatically reviewing pull requests. When a PR is opened or updated, the agent analyzes the changes and provides feedback or suggests documentation updates based on your existing content.

## Features

- **Automatic Reviews**: Triggered by GitHub webhooks on every pull request.
- **Smart Filtering**: Automatically ignores internal changes, lockfiles, and non-documentation files to focus on what matters.
- **Multiple Modes**: Choose between receiving suggestions as comments or having the agent commit directly to your branch.
- **Context Aware**: Uses your existing documentation (via MCP) as context to ensure consistency in tone and style.

## Quick Start

### 1. Create a GitHub App

To use the Review Agent, you need to create a GitHub App for your organization or account.

1. Go to your GitHub **Settings** > **Developer settings** > **GitHub Apps** > **New GitHub App**.
2. **Name**: `My Docs Agent` (or any name you prefer).
3. **Homepage URL**: Your documentation site URL.
4. **Webhook**: Enabled.
   - **Webhook URL**: `https://your-docs-site.com/__docus__/webhook/github`
   - **Webhook Secret**: Generate a random secret string and keep it safe.
5. **Permissions**:
   - **Repository permissions**:
     - `Pull requests`: Read & Write
     - `Contents`: Read & Write (required if you want the agent to commit changes)
     - `Metadata`: Read-only (default)
6. **Events**:
   - Subscribe to `Pull request` events.

### 2. Install the App

After creating the app, click **Install App** in the sidebar and install it on the repository where your documentation is hosted.

### 3. Set Environment Variables

Add the following variables to your deployment environment (e.g., Vercel, Netlify):

```bash [.env]
GITHUB_APP_ID=your-app-id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your-webhook-secret
AI_GATEWAY_API_KEY=your-vercel-ai-gateway-key
```

## Configuration

Enable the Review Agent in your `nuxt.config.ts`:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  docus: {
    agent: {
      review: {
        // Enable the review agent
        enabled: true,

        // 'comment' (default) or 'commit'
        mode: 'comment',

        // Target repository in 'org/repo' format (auto-detected if blank)
        githubRepo: 'nuxt-content/docus'
      }
    }
  }
})
```

### Review Modes

The agent can operate in two modes:

- `comment`: The agent posts its findings and suggestions as a comment on the pull request.
- `commit`: The agent directly commits suggested documentation changes to the pull request branch.

### Repository Detection

By default, Docus attempts to auto-detect your GitHub repository from environment variables provided by CI providers (Vercel, Netlify, GitHub Actions) or from your local `.git/config`. If detection fails, you can explicitly set `githubRepo`.

## Advanced Agent Configuration

The Review Agent shares the same base configuration as the Chat Assistant:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  docus: {
    agent: {
      // AI model to use for reviews
      model: 'google/gemini-3-flash',

      // MCP server used to retrieve documentation context
      mcpServer: '/mcp'
    }
  }
})
```
