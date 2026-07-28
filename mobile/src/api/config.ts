import Constants from 'expo-constants';

const DEFAULT_API_URL = 'http://192.168.1.100:5000/api/v1';

export function getApiUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.apiUrl;
  if (typeof fromExtra === 'string' && fromExtra.length > 0) {
    return fromExtra.replace(/\/$/, '');
  }

  return DEFAULT_API_URL;
}

/** Server origin without the /api/v1 suffix (for /health and other root routes). */
export function getServerOrigin(): string {
  return getApiUrl().replace(/\/api\/v1\/?$/, '');
}

export function getHealthUrl(): string {
  return `${getServerOrigin()}/health`;
}
