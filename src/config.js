import Conf from 'conf';

const config = new Conf({
  projectName: 'upbank-cli',
  schema: {
    apiToken: {
      type: 'string',
      default: ''
    }
  }
});

export function getConfig(key) {
  return config.get(key);
}

export function setConfig(key, value) {
  config.set(key, value);
}

export function getAllConfig() {
  return config.store;
}

export function clearConfig() {
  config.clear();
}

export function isConfigured() {
  const apiToken = config.get('apiToken');
  return !!apiToken;
}

export default config;
