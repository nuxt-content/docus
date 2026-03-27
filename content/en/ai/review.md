# Review Agent

> PR documentation review agent triggered by GitHub webhooks.

The Review Agent is a specialized AI assistant that helps keep your documentation accurate by reviewing pull requests. It can identify inconsistencies, suggest improvements, and even commit fixes directly to the PR branch.

## How It Works

The Review Agent integrates with GitHub using webhooks:

1. **Webhook Trigger** - A GitHub webhook notifies your Docus site about a new or updated pull request.
2. **Analysis** - The Review Agent analyzes the PR diff and compares it with the existing documentation.
3. **Action** - Based on its configuration, the agent either posts a comment with suggestions or commits documentation updates directly.

## Configuration

Enable the Review Agent in your `nuxt.config.ts`:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  docus: {
    agent: {
      review: {
        // Enable the webhook handler
        enabled: true,
        // Mode: 'comment' (default) or 'commit'
        mode: 'comment',
        // Target repository (org/repo)
        githubRepo: 'nuxt-content/docus'
      }
    }
  }
})
```

### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `false` | Enable the webhook handler. |
| `mode` | `'comment' \| 'commit'` | `'comment'` | Whether the agent posts a PR comment or commits fixes. |
| `githubRepo` | `string` | *auto-detected* | Target GitHub repository in `org/repo` format. |

<note>

The agent automatically detects the repository name when deployed on Vercel, Netlify, or GitHub Actions.

</note>

## GitHub App Setup

The Review Agent requires a GitHub App to interact with your pull requests.

### 1. Create a GitHub App

1. Go to your GitHub organization's **Settings** > **Developer settings** > **GitHub Apps** and click **New GitHub App**.
2. Set the **Webhook URL** to `https://your-docs.com/__docus__/webhook/github`.
3. Set the **Webhook secret**.
4. Grant the following permissions:
   - **Pull requests**: Read & write
   - **Contents**: Read & write (required for `commit` mode)
   - **Metadata**: Read-only
5. Subscribe to **Pull request** events.

### 2. Set Environment Variables

Add the following variables to your environment:

```bash [.env]
# Required for GitHub App authentication
GITHUB_APP_ID=your-app-id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# Required for AI model access
AI_GATEWAY_API_KEY=your-api-key
```

### 3. Install the App

Install the GitHub App on your repository by going to **Install App** in the GitHub App settings.

## Webhook Endpoint

The Review Agent registers a webhook handler at the following route:

`https://your-docs.com/__docus__/webhook/github`

Ensure your GitHub App's webhook configuration matches this URL. If you are developing locally, you can use a service like [ngrok](https://ngrok.com/) to expose your local server to the internet.
