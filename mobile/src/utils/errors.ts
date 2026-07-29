import { isApiError } from '../api/errors';

export function getUserFriendlyError(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    if (error.status === 401) {
      return 'Tu sesión expiró. Inicia sesión de nuevo.';
    }
    if (error.status >= 500) {
      return 'El servidor no está disponible. Intenta más tarde.';
    }
    if (error.detail) {
      return error.detail;
    }
    if (error.title) {
      return error.title;
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch') || message.includes('conexión')) {
      return 'Sin conexión. Revisa tu internet e intenta de nuevo.';
    }
  }

  return fallback;
}
