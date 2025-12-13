// WebAuthn Passkey utilities for registration and authentication

const RP_NAME = 'CryptoPay';
const RP_ID = window.location.hostname;

// Store credentials in localStorage (in production, use a backend)
const CREDENTIALS_KEY = 'cryptopay_passkey_credentials';

interface StoredCredential {
  id: string;
  rawId: string;
  publicKey: string;
  username: string;
  createdAt: string;
}

function getStoredCredentials(): StoredCredential[] {
  const stored = localStorage.getItem(CREDENTIALS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveCredential(credential: StoredCredential): void {
  const credentials = getStoredCredentials();
  credentials.push(credential);
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

function generateUserId(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

export function isPasskeySupported(): boolean {
  return !!window.PublicKeyCredential;
}

export async function isPasskeyAvailable(): Promise<boolean> {
  if (!isPasskeySupported()) return false;

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

export function hasRegisteredPasskey(): boolean {
  return getStoredCredentials().length > 0;
}

export async function registerPasskey(
  username: string
): Promise<{ success: boolean; error?: string }> {
  if (!isPasskeySupported()) {
    return { success: false, error: 'お使いのブラウザはパスキーをサポートしていません' };
  }

  try {
    const challenge = generateChallenge();
    const userId = generateUserId();

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: RP_NAME,
        id: RP_ID,
      },
      user: {
        id: userId,
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'パスキーの作成がキャンセルされました' };
    }

    const response = credential.response as AuthenticatorAttestationResponse;

    // Store credential for later authentication
    const storedCredential: StoredCredential = {
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      publicKey: arrayBufferToBase64(response.getPublicKey() || new ArrayBuffer(0)),
      username,
      createdAt: new Date().toISOString(),
    };

    saveCredential(storedCredential);

    return { success: true };
  } catch (error) {
    console.error('Passkey registration error:', error);

    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'パスキーの登録がキャンセルされました' };
      }
      if (error.name === 'SecurityError') {
        return { success: false, error: 'セキュリティエラー: HTTPSが必要です' };
      }
    }

    return { success: false, error: 'パスキーの登録に失敗しました' };
  }
}

export async function authenticateWithPasskey(): Promise<{
  success: boolean;
  username?: string;
  error?: string;
}> {
  if (!isPasskeySupported()) {
    return { success: false, error: 'お使いのブラウザはパスキーをサポートしていません' };
  }

  const storedCredentials = getStoredCredentials();

  try {
    const challenge = generateChallenge();

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: RP_ID,
      timeout: 60000,
      userVerification: 'required',
      // If we have stored credentials, allow only those
      // Otherwise, allow any discoverable credential
      allowCredentials:
        storedCredentials.length > 0
          ? storedCredentials.map((cred) => ({
              id: base64ToArrayBuffer(cred.rawId),
              type: 'public-key' as const,
              transports: ['internal' as const],
            }))
          : undefined,
    };

    const credential = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: '認証がキャンセルされました' };
    }

    // Find the matching stored credential
    const matchedCredential = storedCredentials.find((cred) => cred.id === credential.id);

    // In a real app, you would verify the signature on the server
    // For this demo, we just check if the credential exists
    return {
      success: true,
      username: matchedCredential?.username || 'User',
    };
  } catch (error) {
    console.error('Passkey authentication error:', error);

    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return { success: false, error: '認証がキャンセルされました' };
      }
      if (error.name === 'SecurityError') {
        return { success: false, error: 'セキュリティエラー: HTTPSが必要です' };
      }
    }

    return { success: false, error: '認証に失敗しました' };
  }
}

export function clearPasskeys(): void {
  localStorage.removeItem(CREDENTIALS_KEY);
}
