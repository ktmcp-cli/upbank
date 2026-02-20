import axios from 'axios';
import { getConfig } from './config.js';

const UP_BASE_URL = 'https://api.up.com.au/api/v1';

async function apiRequest(method, endpoint, data = null, params = null) {
  const apiToken = getConfig('apiToken');

  if (!apiToken) {
    throw new Error('API token not configured. Run: upbank config set --token <token>');
  }

  const config = {
    method,
    url: `${UP_BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  if (params) config.params = params;
  if (data) config.data = data;

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

function handleApiError(error) {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 401) {
      throw new Error('Authentication failed. Check your API token.');
    } else if (status === 403) {
      throw new Error('Access forbidden.');
    } else if (status === 404) {
      throw new Error('Resource not found.');
    } else if (status === 429) {
      throw new Error('Rate limit exceeded.');
    } else {
      const message = data?.errors?.[0]?.detail || data?.message || JSON.stringify(data);
      throw new Error(`API Error (${status}): ${message}`);
    }
  } else if (error.request) {
    throw new Error('No response from Up API. Check your internet connection.');
  } else {
    throw error;
  }
}

// ACCOUNTS
export async function listAccounts(params = {}) {
  const data = await apiRequest('GET', '/accounts', null, params);
  return data.data || [];
}

export async function getAccount(accountId) {
  const data = await apiRequest('GET', `/accounts/${accountId}`);
  return data.data || null;
}

export async function listAccountTransactions(accountId, params = {}) {
  const data = await apiRequest('GET', `/accounts/${accountId}/transactions`, null, params);
  return data.data || [];
}

// TRANSACTIONS
export async function listTransactions(params = {}) {
  const data = await apiRequest('GET', '/transactions', null, params);
  return data.data || [];
}

export async function getTransaction(transactionId) {
  const data = await apiRequest('GET', `/transactions/${transactionId}`);
  return data.data || null;
}

export async function categorizeTransaction(transactionId, categoryId) {
  const data = await apiRequest('PATCH', `/transactions/${transactionId}/relationships/category`, {
    data: { type: 'categories', id: categoryId }
  });
  return data;
}

// CATEGORIES
export async function listCategories(params = {}) {
  const data = await apiRequest('GET', '/categories', null, params);
  return data.data || [];
}

export async function getCategory(categoryId) {
  const data = await apiRequest('GET', `/categories/${categoryId}`);
  return data.data || null;
}

// TAGS
export async function listTags(params = {}) {
  const data = await apiRequest('GET', '/tags', null, params);
  return data.data || [];
}

export async function addTagsToTransaction(transactionId, tags) {
  const data = await apiRequest('POST', `/transactions/${transactionId}/relationships/tags`, {
    data: tags.map(tag => ({ type: 'tags', id: tag }))
  });
  return data;
}

export async function removeTagsFromTransaction(transactionId, tags) {
  const data = await apiRequest('DELETE', `/transactions/${transactionId}/relationships/tags`, {
    data: tags.map(tag => ({ type: 'tags', id: tag }))
  });
  return data;
}

// WEBHOOKS
export async function listWebhooks(params = {}) {
  const data = await apiRequest('GET', '/webhooks', null, params);
  return data.data || [];
}

export async function getWebhook(webhookId) {
  const data = await apiRequest('GET', `/webhooks/${webhookId}`);
  return data.data || null;
}

export async function createWebhook(url, description = '') {
  const data = await apiRequest('POST', '/webhooks', {
    data: {
      attributes: { url, description }
    }
  });
  return data.data || null;
}

export async function deleteWebhook(webhookId) {
  await apiRequest('DELETE', `/webhooks/${webhookId}`);
  return true;
}

export async function pingWebhook(webhookId) {
  const data = await apiRequest('POST', `/webhooks/${webhookId}/ping`);
  return data;
}

export async function listWebhookLogs(webhookId, params = {}) {
  const data = await apiRequest('GET', `/webhooks/${webhookId}/logs`, null, params);
  return data.data || [];
}
