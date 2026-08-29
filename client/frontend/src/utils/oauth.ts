export function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  let str = "";
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  bytes.forEach((b) => { str += String.fromCharCode(b); });
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function randomState(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return base64UrlEncode(arr);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

export async function generateCodeVerifier(): Promise<string> {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return base64UrlEncode(arr);
}
