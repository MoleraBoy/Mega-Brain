// Suporte a Biometria Digital (WebAuthn / TouchID / FaceID / Impressão Digital Android/iOS)
export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerBiometricCredential(userName = 'Usuario Mega Brain'): Promise<string | null> {
  if (!(await isBiometricAvailable())) return null;
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Mega Brain Private Space' },
        user: {
          id: userId,
          name: 'megabrain-private',
          displayName: userName,
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!cred) return null;
    const rawId = Array.from(new Uint8Array(cred.rawId));
    const encoded = btoa(String.fromCharCode(...rawId));
    localStorage.setItem('megabrain_webauthn_cred_id', encoded);
    return encoded;
  } catch {
    return null;
  }
}

export async function verifyBiometricCredential(): Promise<boolean> {
  const stored = localStorage.getItem('megabrain_webauthn_cred_id');
  if (!stored || !(await isBiometricAvailable())) return false;
  try {
    const binary = atob(stored);
    const credId = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) credId[i] = binary.charCodeAt(i);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ id: credId, type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    return Boolean(assertion);
  } catch {
    return false;
  }
}
