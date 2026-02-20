import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import {
  listAccounts,
  getAccount,
  listAccountTransactions,
  listTransactions,
  getTransaction,
  categorizeTransaction,
  listCategories,
  getCategory,
  listTags,
  addTagsToTransaction,
  removeTagsFromTransaction,
  listWebhooks,
  getWebhook,
  createWebhook,
  deleteWebhook,
  pingWebhook
} from './api.js';

const program = new Command();

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 40);
  });

  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));

  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });

  console.log(chalk.dim(`\n${data.length} result(s)`));
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('API token not configured.');
    console.log('\nRun: upbank config set --token <your-token>');
    process.exit(1);
  }
}

program
  .name('upbank')
  .description(chalk.bold('Up Bank CLI') + ' - Australian banking from your terminal')
  .version('1.0.0');

// CONFIG
const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--token <token>', 'Up API token')
  .action((options) => {
    if (options.token) {
      setConfig('apiToken', options.token);
      printSuccess('API token set');
    } else {
      printError('No token provided');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const apiToken = getConfig('apiToken');
    console.log(chalk.bold('\nUp Bank Configuration\n'));
    console.log('API Token:    ', apiToken ? chalk.green('*'.repeat(20)) : chalk.red('not set'));
    console.log('');
  });

// ACCOUNTS
const accountsCmd = program.command('accounts').description('Manage accounts');

accountsCmd
  .command('list')
  .description('List accounts')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const accounts = await withSpinner('Fetching accounts...', () => listAccounts());

      if (options.json) {
        printJson(accounts);
        return;
      }

      printTable(accounts, [
        { key: 'id', label: 'ID' },
        { key: 'attributes', label: 'Name', format: (v) => v?.displayName || 'N/A' },
        { key: 'attributes', label: 'Type', format: (v) => v?.accountType || 'N/A' },
        { key: 'attributes', label: 'Balance', format: (v) => v?.balance?.value || '0.00' },
        { key: 'attributes', label: 'Currency', format: (v) => v?.balance?.currencyCode || 'AUD' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

accountsCmd
  .command('get <account-id>')
  .description('Get a specific account')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();
    try {
      const account = await withSpinner('Fetching account...', () => getAccount(accountId));

      if (!account) {
        printError('Account not found');
        process.exit(1);
      }

      if (options.json) {
        printJson(account);
        return;
      }

      console.log(chalk.bold('\nAccount Details\n'));
      console.log('Account ID:   ', chalk.cyan(account.id));
      console.log('Name:         ', account.attributes?.displayName || 'N/A');
      console.log('Type:         ', account.attributes?.accountType || 'N/A');
      console.log('Balance:      ', chalk.green(account.attributes?.balance?.value || '0.00'));
      console.log('Currency:     ', account.attributes?.balance?.currencyCode || 'AUD');
      console.log('Created At:   ', account.attributes?.createdAt || 'N/A');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

accountsCmd
  .command('transactions <account-id>')
  .description('List transactions for an account')
  .option('--limit <n>', 'Maximum number of results', '50')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();
    try {
      const transactions = await withSpinner('Fetching transactions...', () =>
        listAccountTransactions(accountId, { 'page[size]': options.limit })
      );

      if (options.json) {
        printJson(transactions);
        return;
      }

      printTable(transactions, [
        { key: 'id', label: 'ID', format: (v) => v?.substring(0, 8) + '...' },
        { key: 'attributes', label: 'Description', format: (v) => v?.description || 'N/A' },
        { key: 'attributes', label: 'Amount', format: (v) => v?.amount?.value || '0.00' },
        { key: 'attributes', label: 'Status', format: (v) => v?.status || 'N/A' },
        { key: 'attributes', label: 'Created', format: (v) => v?.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'N/A' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// TRANSACTIONS
const transactionsCmd = program.command('transactions').description('Manage transactions');

transactionsCmd
  .command('list')
  .description('List all transactions')
  .option('--limit <n>', 'Maximum number of results', '50')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const transactions = await withSpinner('Fetching transactions...', () =>
        listTransactions({ 'page[size]': options.limit })
      );

      if (options.json) {
        printJson(transactions);
        return;
      }

      printTable(transactions, [
        { key: 'id', label: 'ID', format: (v) => v?.substring(0, 8) + '...' },
        { key: 'attributes', label: 'Description', format: (v) => v?.description || 'N/A' },
        { key: 'attributes', label: 'Amount', format: (v) => v?.amount?.value || '0.00' },
        { key: 'attributes', label: 'Status', format: (v) => v?.status || 'N/A' },
        { key: 'attributes', label: 'Created', format: (v) => v?.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'N/A' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

transactionsCmd
  .command('get <transaction-id>')
  .description('Get a specific transaction')
  .option('--json', 'Output as JSON')
  .action(async (transactionId, options) => {
    requireAuth();
    try {
      const transaction = await withSpinner('Fetching transaction...', () => getTransaction(transactionId));

      if (!transaction) {
        printError('Transaction not found');
        process.exit(1);
      }

      if (options.json) {
        printJson(transaction);
        return;
      }

      console.log(chalk.bold('\nTransaction Details\n'));
      console.log('Transaction ID: ', chalk.cyan(transaction.id));
      console.log('Description:    ', transaction.attributes?.description || 'N/A');
      console.log('Amount:         ', chalk.green(transaction.attributes?.amount?.value || '0.00'));
      console.log('Status:         ', transaction.attributes?.status || 'N/A');
      console.log('Created At:     ', transaction.attributes?.createdAt || 'N/A');
      console.log('Settled At:     ', transaction.attributes?.settledAt || 'N/A');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// CATEGORIES
const categoriesCmd = program.command('categories').description('Manage categories');

categoriesCmd
  .command('list')
  .description('List categories')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const categories = await withSpinner('Fetching categories...', () => listCategories());

      if (options.json) {
        printJson(categories);
        return;
      }

      printTable(categories, [
        { key: 'id', label: 'ID' },
        { key: 'attributes', label: 'Name', format: (v) => v?.name || 'N/A' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// TAGS
const tagsCmd = program.command('tags').description('Manage tags');

tagsCmd
  .command('list')
  .description('List tags')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const tags = await withSpinner('Fetching tags...', () => listTags());

      if (options.json) {
        printJson(tags);
        return;
      }

      printTable(tags, [
        { key: 'id', label: 'ID' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// WEBHOOKS
const webhooksCmd = program.command('webhooks').description('Manage webhooks');

webhooksCmd
  .command('list')
  .description('List webhooks')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const webhooks = await withSpinner('Fetching webhooks...', () => listWebhooks());

      if (options.json) {
        printJson(webhooks);
        return;
      }

      printTable(webhooks, [
        { key: 'id', label: 'ID' },
        { key: 'attributes', label: 'URL', format: (v) => v?.url || 'N/A' },
        { key: 'attributes', label: 'Description', format: (v) => v?.description || 'N/A' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

webhooksCmd
  .command('create <url>')
  .description('Create a webhook')
  .option('--description <desc>', 'Webhook description', '')
  .option('--json', 'Output as JSON')
  .action(async (url, options) => {
    requireAuth();
    try {
      const webhook = await withSpinner('Creating webhook...', () =>
        createWebhook(url, options.description)
      );

      if (options.json) {
        printJson(webhook);
        return;
      }

      printSuccess(`Webhook created: ${chalk.bold(webhook.id)}`);
      console.log('URL:         ', webhook.attributes?.url);
      console.log('Secret Key:  ', webhook.attributes?.secretKey || 'N/A');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

webhooksCmd
  .command('delete <webhook-id>')
  .description('Delete a webhook')
  .action(async (webhookId) => {
    requireAuth();
    try {
      await withSpinner('Deleting webhook...', () => deleteWebhook(webhookId));
      printSuccess('Webhook deleted');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

webhooksCmd
  .command('ping <webhook-id>')
  .description('Ping a webhook')
  .action(async (webhookId) => {
    requireAuth();
    try {
      await withSpinner('Pinging webhook...', () => pingWebhook(webhookId));
      printSuccess('Webhook pinged successfully');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
