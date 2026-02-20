# AGENT.md — Up Bank CLI for AI Agents

## Overview

The `upbank` CLI provides access to the Up API for Australian digital banking.

## Prerequisites

Configure API token:
```bash
upbank config set --token <token>
```

## Commands

### Accounts
```bash
upbank accounts list --json
upbank accounts get <account-id> --json
upbank accounts transactions <account-id> --json
```

### Transactions
```bash
upbank transactions list --json
upbank transactions get <transaction-id> --json
```

### Categories
```bash
upbank categories list --json
```

### Tags
```bash
upbank tags list --json
```

### Webhooks
```bash
upbank webhooks list --json
upbank webhooks create <url> --description "desc"
upbank webhooks delete <webhook-id>
upbank webhooks ping <webhook-id>
```

## Tips

- Always use `--json` for programmatic access
- Transactions use JSON:API format with `data.attributes` structure
- Account IDs are UUIDs from the Up system
