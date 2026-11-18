// Utilitários de segurança para o Espaço Privado (PIN SHA-256 + Biometria/Digital WebAuthn)

export async function hashPin(pin: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`mega_brain_salt_${pin}`);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return btoa(`fallback_${pin}`);
}

export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials !== 'undefined'
  );
}

export async function registerBiometricCredential(): Promise<string | null> {
  if (!isWebAuthnAvailable()) return null;
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Mega Brain Espaço Privado' },
        user: {
          id: userId,
          name: 'usuario@megabrain.local',
          displayName: 'Usuário Mega Brain'
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 }
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required'
        },
        timeout: 60000
      }
    })) as PublicKeyCredential | null;

    if (!credential) return null;
    return btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
  } catch {
    return null;
  }
}

export async function verifyBiometricCredential(credentialIdBase64: string): Promise<boolean> {
  if (!isWebAuthnAvailable() || !credentialIdBase64) return false;
  try {
    const rawId = Uint8Array.from(atob(credentialIdBase64), (c) => c.charCodeAt(0));
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ type: 'public-key', id: rawId }],
        userVerification: 'required',
        timeout: 60000
      }
    });
    return Boolean(assertion);
  } catch {
    return false;
  }
}
