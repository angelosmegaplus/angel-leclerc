const TOKEN_KEY = 'angel-os.identity.token';

export function getAngelIdentityToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAngelIdentityToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new CustomEvent('angel-identity-change'));
}

export function clearAngelIdentityToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new CustomEvent('angel-identity-change'));
}
