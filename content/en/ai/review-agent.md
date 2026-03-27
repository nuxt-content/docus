# Review Agent

> Keep your documentation in sync with code changes using the Docus AI review agent.

The Review Agent is an AI-powered tool that monitors your GitHub repository for pull requests. When a PR is opened or updated, the agent analyzes the changes and automatically suggests documentation updates to keep your docs in sync with your code.

## About the Review Agent

The agent acts as a virtual documentation maintainer. It uses the [built-in MCP server](/en/ai/mcp) to understand your project's documentation structure and content, then compares it with the code changes in a pull request.

Depending on your configuration, the agent can:

- **Analyze code diffs** to identify new features or breaking changes that require documentation.
- **Suggest updates** to existing documentation pages.
- **Create new pages** for major features that aren't yet documented.
- **Maintain consistency** in tone and style across your documentation.

## Setup

### 1. Get an AI Gateway API Key

The review agent requires an [AI Gateway](https://vercel.com/docs/ai-gateway) API key. If you already set this up for the [Assistant](/en/ai/assistant), you can skip this step.

```bash [.env]
AI_GATEWAY_API_KEY=your-api-key
```

### 2. Create a GitHub App

To use the Review Agent, you need to create and install a GitHub App:

1. Go to your **GitHub Settings > Developer settings > GitHub Apps** and click **New GitHub App**.
2. Set a **Name** and **Homepage URL** (your documentation site URL).
3. Under **Webhook**, set the **Webhook URL** to `https://your-docs-site.com/__docus__/webhook/github`.
4. Create a **Webhook secret** and save it for later.
5. Under **Permissions**, grant the following:
   - **Pull requests**: Read & write
   - **Contents**: Read & write (required for `commit` mode)
   - **Metadata**: Read-only
6. Under **Events**, subscribe to **Pull request**.
7. After creating the app, **Generate a private key** and download the `.pem` file.
8. **Install** the app on your repository.

### 3. Set Environment Variables

Add the GitHub App credentials to your environment:

```bash [.env]
# The App ID found in your GitHub App settings
GITHUB_APP_ID=123456

# The content of the .pem private key file
# For CI/CD, use a single line with \n for newlines
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."

# The Webhook secret you created
GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

### 4. Enable the Agent

Enable the review agent in your `nuxt.config.ts`:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  docus: {
    agent: {
      review: {
        enabled: true
      }
    }
  }
})
```

## Configuration

Configure the agent's behavior in `nuxt.config.ts`:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  docus: {
    agent: {
      review: {
        enabled: true,
        
        // feedback mode:
        // 'comment' (default): Posts suggested changes as a PR comment
        // 'commit': Directly commits changes to the PR branch
        mode: 'comment',

        // Target repository (owner/repo)
        // Auto-detected from environment variables or .git folder
        githubRepo: 'nuxt-content/docus'
      }
    }
  }
})
```

### Repository Auto-detection

Docus automatically detects the GitHub repository when deployed on popular platforms (Vercel, Netlify, GitHub Actions, GitLab CI) or running in local development. If auto-detection fails, the agent will log a warning and you must specify `githubRepo` manually.

## Advanced Configuration

The review agent shares the same AI model and MCP server configuration as the [Assistant](/en/ai/assistant):

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  docus: {
    agent: {
      // AI model used for review and chat
      model: 'google/gemini-3-flash',

      // MCP server used to read documentation
      mcpServer: '/mcp'
    }
  }
})
```
