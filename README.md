> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw  
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# Up Bank CLI

A production-ready command-line interface for the [Up](https://up.com.au) API. Manage your Australian digital banking accounts, transactions, categories, tags, and webhooks directly from your terminal.

## Features

- **Accounts** — List accounts and view balances
- **Transactions** — View transaction history and categorize spending
- **Categories** — Browse spending categories
- **Tags** — Organize transactions with custom labels
- **Webhooks** — Real-time event notifications
- **JSON output** — All commands support `--json` for scripting

## Installation

```bash
npm install -g @ktmcp-cli/upbank
```

## Authentication Setup

Get your API token from the Up app:

1. Open the Up app
2. Go to Settings → API → Create new token
3. Copy your Personal Access Token

Configure the CLI:

```bash
upbank config set --token YOUR_TOKEN
```

## Commands

### Accounts

```bash
upbank accounts list
upbank accounts get <account-id>
upbank accounts transactions <account-id>
```

### Transactions

```bash
upbank transactions list
upbank transactions get <transaction-id>
```

### Categories

```bash
upbank categories list
```

### Tags

```bash
upbank tags list
```

### Webhooks

```bash
upbank webhooks list
upbank webhooks create <url>
upbank webhooks delete <webhook-id>
upbank webhooks ping <webhook-id>
```

## JSON Output

```bash
upbank accounts list --json
upbank transactions list --json | jq '.[] | {id, amount: .attributes.amount.value}'
```

## License

MIT — see [LICENSE](LICENSE) for details.

---

Part of the [KTMCP CLI](https://killthemcp.com) project.
