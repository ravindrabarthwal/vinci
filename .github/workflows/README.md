# Sisyphus Agent Workflow Setup

This workflow enables an AI agent to respond to GitHub issues and PRs when mentioned with `@sisyphus-agent`.

## Prerequisites

- GitHub repository with Actions enabled
- A GitHub account for the bot (or use your own account)
- GitHub Copilot subscription with API access

## Required Secrets

Configure these secrets in your repository settings (`Settings > Secrets and variables > Actions > Secrets`):

| Secret | Description |
|--------|-------------|
| `GH_PAT` | GitHub Personal Access Token with `repo`, `workflow`, and `issues` permissions. This allows the bot to push commits, create PRs, and interact with issues. |
| `OPENCODE_AUTH_JSON` | OpenCode authentication JSON. Copy from `~/.local/share/opencode/auth.json` after authenticating locally. See [Getting Auth JSON](#getting-opencode-auth-json) below. |

## Required Variables

Configure these variables in your repository settings (`Settings > Secrets and variables > Actions > Variables`):

| Variable | Description | Example |
|----------|-------------|---------|
| `GIT_USER_NAME` | Git commit author name | `sisyphus-agent` |
| `GIT_USER_EMAIL` | Git commit author email | `sisyphus-agent@users.noreply.github.com` |

## Creating the Personal Access Token (PAT)

1. Go to [GitHub Developer Settings > Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Sisyphus Agent")
4. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
5. Click "Generate token"
6. Copy the token immediately (you won't see it again)
7. Add it as `GH_PAT` secret in your repository

## Getting OpenCode Auth JSON

1. Install OpenCode locally: `curl -fsSL https://opencode.ai/install | bash`
2. Run `opencode` and authenticate with GitHub Copilot when prompted
3. After successful authentication, copy the auth file contents:
   ```bash
   cat ~/.local/share/opencode/auth.json
   ```
4. Add the entire JSON content as `OPENCODE_AUTH_JSON` secret in your repository

## Usage

Once configured, mention `@sisyphus-agent` in any issue or PR comment to invoke the agent:

```
@sisyphus-agent please investigate this bug and create a fix
```

```
@sisyphus-agent add input validation to the login form
```

The agent will:
1. React with 👀 to acknowledge the request
2. Add a "sisyphus: working" label
3. Investigate and work on the request
4. Create a PR if code changes are needed
5. Report results back in the issue/PR comments
6. Remove the working label and react with 👍 when done

## Trigger Conditions

The workflow runs when:
- Someone comments on an issue or PR mentioning `@sisyphus-agent`
- The commenter is a repository OWNER, MEMBER, or COLLABORATOR
- The commenter is NOT the bot itself (prevents loops)

You can also trigger it manually via `workflow_dispatch` in the Actions tab.

## Customization

### Change the Bot Username

Edit the workflow file and replace all instances of `sisyphus-agent` with your preferred bot username.

## Troubleshooting

### Agent not responding
- Check that the commenter has appropriate permissions (OWNER, MEMBER, or COLLABORATOR)
- Verify all secrets and variables are configured correctly
- Check the Actions tab for workflow run logs

### Authentication errors
- Ensure `GH_PAT` has the correct scopes
- Verify `OPENCODE_AUTH_JSON` contains valid JSON from your local auth file
- Re-authenticate locally and update the secret if tokens have expired

### Push failures
- Ensure `GH_PAT` has `repo` and `workflow` scopes
- Check if branch protection rules are blocking pushes
