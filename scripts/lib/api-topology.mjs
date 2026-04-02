import { envValue } from './config.mjs';

function envTruthy(name) {
  return ['1', 'true', 'yes', 'on'].includes(envValue(name).toLowerCase());
}

export function getApiProvider() {
  if (envTruthy('CLAUDE_CODE_USE_BEDROCK')) return 'bedrock';
  if (envTruthy('CLAUDE_CODE_USE_VERTEX')) return 'vertex';
  if (envTruthy('CLAUDE_CODE_USE_FOUNDRY')) return 'foundry';
  return 'firstParty';
}

export function isFirstPartyAnthropicBaseUrl() {
  const baseUrl = envValue('ANTHROPIC_BASE_URL');
  if (!baseUrl) return true;

  try {
    const host = new URL(baseUrl).host;
    const allowedHosts = ['api.anthropic.com'];

    if (envValue('USER_TYPE') === 'ant') {
      allowedHosts.push('api-staging.anthropic.com');
    }

    return allowedHosts.includes(host);
  } catch {
    return false;
  }
}

export function usesCustomAnthropicProxy() {
  return getApiProvider() === 'firstParty' && !isFirstPartyAnthropicBaseUrl();
}

export function hasObservedTools(sessionContext = {}) {
  return Array.isArray(sessionContext?.toolNames) && sessionContext.toolNames.length > 0;
}

export function resolveWebSearchGuidanceMode(sessionContext = {}) {
  const observedTools = hasObservedTools(sessionContext);
  const webSearchAvailable = Boolean(sessionContext?.webSearchAvailable);
  const customAnthropicProxy = usesCustomAnthropicProxy();

  if (webSearchAvailable && customAnthropicProxy) {
    return 'proxy-conditional';
  }

  if (webSearchAvailable) {
    return 'available';
  }

  if (observedTools) {
    return 'not-exposed';
  }

  if (customAnthropicProxy) {
    return 'proxy-unknown';
  }

  return 'generic';
}
