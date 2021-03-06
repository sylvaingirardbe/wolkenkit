'use strict';

const url = require('url');

const request = require('requestretry');

const noop = require('../../../noop'),
      shared = require('../shared');

const encrypt = async function (options, progress = noop) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.value) {
    throw new Error('Environment is missing.');
  }

  const { env, directory, privateKey, value } = options;

  const configuration = await shared.getConfiguration({
    env,
    directory,
    isPackageJsonRequired: true
  }, progress);

  const tunnel = await shared.startTunnel({ configuration, env, privateKey }, progress);

  const endpoint = url.format({
    protocol: 'http:',
    hostname: tunnel.host,
    port: tunnel.port,
    pathname: '/v1/encrypt'
  });

  progress({ message: `Using ${endpoint} as route.` });

  const response = await request({
    method: 'POST',
    url: endpoint,
    json: true,
    body: { value },
    fullResponse: false,
    maxAttempts: 3,
    retryDelay: 2 * 1000,
    retryStrategy: request.RetryStrategies.HTTPOrNetworkError
  });

  const encrypted = response.value;

  tunnel.close();

  return encrypted;
};

module.exports = encrypt;
