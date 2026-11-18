'use client';

import React, { useState } from 'react';
import { Fingerprint, Lock, ShieldCheck, KeyRound } from 'lucide-react';
import { PrivateVaultConfig } from '@/lib/types';
import {
  hashPin,
  isWebAuthnAvailable,
  registerBiometricCredential,
  verifyBiometricCredential
} from '@/lib/webauthnHelper';

interface PrivateSpaceGateProps {
  config: PrivateVaultConfig;
  isUnlocked: boolean;
  onUnlock: () => void;
  onConfigureVault: (newConfig: PrivateVaultConfig) => void;
}

export default function PrivateSpaceGate({
  config,
  isUnlocked,
  onUnlock,
  onConfigureVault
}: PrivateSpaceGateProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [enableBiometrics, setEnableBiometrics] = useState(true);
  const [error, setError] = useState('');
  const [loadingBio, setLoadingBio] = useState(false);

  if (isUnlocked) return null;

  const biometricSupported = isWebAuthnAvailable();

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (pin.length < 4) {
      setError('O PIN deve ter pelo menos 4 dígitos.');
      return;
    }
    if (pin !== confirmPin) {
      setError('Os PINs digitados não coincidem.');
      return;
    }

    const pinHash = await hashPin(pin);
    let credentialId: string | undefined;

    if (enableBiometrics && biometricSupported) {
      setLoadingBio(true);
      const id = await registerBiometricCredential();
      setLoadingBio(false);
      if (id) credentialId = id;
    }

    onConfigureVault({
      enabled: true,
      pinHash,
      webauthnCredentialId: credentialId
    });
    setPin('');
    setConfirmPin('');
    onUnlock();
  }

  async function handleVerifyPin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const candidateHash = await hashPin(pin);
    if (candidateHash === config.pinHash) {
      setPin('');
      onUnlock();
    } else {
      setError('PIN incorreto. Tente novamente.');
    }
  }

  async function handleBiometricUnlock() {
    if (!config.webauthnCredentialId) return;
    setError('');
    setLoadingBio(true);
    const ok = await verifyBiometricCredential(config.webauthnCredentialId);
    setLoadingBio(false);
    if (ok) {
      onUnlock();
    } else {
      setError('Falha na verificação biométrica. Use seu PIN.');
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-md3-xl border border-md3-outlineVariant bg-md3-surfaceContainerLowest p-6 shadow-md space-y-5">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="rounded-full bg-md3-primaryContainer p-3 text-md3-primary">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-md3-onSurface">
          {config.enabled ? 'Espaço Privado Bloqueado' : 'Configurar Espaço Privado'}
        </h2>
        <p className="text-xs text-md3-onSurfaceVariant">
          Pastas, links e tarefas privadas ficam isolados e fora das estatísticas gerais.
        </p>
      </div>

      {!config.enabled ? (
        <form onSubmit={handleSetup} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-md3-onSurfaceVariant mb-1">
              Crie um PIN numérico (mín. 4 dígitos)
            </label>
            <input
              type="password"
              inputMode="numeric"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-md3-md border border-md3-outline bg-md3-surface px-3.5 py-2 text-center tracking-widest text-base"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-md3-onSurfaceVariant mb-1">
              Confirme o PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full rounded-md3-md border border-md3-outline bg-md3-surface px-3.5 py-2 text-center tracking-widest text-base"
            />
          </div>

          {biometricSupported && (
            <label className="flex items-center gap-2.5 rounded-md3-md bg-md3-surfaceContainer p-3 text-xs cursor-pointer">
              <Fingerprint className="w-5 h-5 text-md3-primary shrink-0" />
              <span className="flex-1">
                Ativar desbloqueio por Digital / FaceID (WebAuthn)
              </span>
              <input
                type="checkbox"
                checked={enableBiometrics}
                onChange={(e) => setEnableBiometrics(e.target.checked)}
                className="accent-md3-primary"
              />
            </label>
          )}

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loadingBio}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md3-full bg-md3-primary py-2.5 text-sm font-medium text-md3-onPrimary"
          >
            <ShieldCheck className="w-4 h-4" />
            {loadingBio ? 'Registrando Biometria...' : 'Ativar Espaço Privado'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {config.webauthnCredentialId && biometricSupported && (
            <button
              type="button"
              onClick={handleBiometricUnlock}
              disabled={loadingBio}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md3-full bg-md3-secondaryContainer py-3 text-sm font-semibold text-md3-onSecondaryContainer hover:opacity-90"
            >
              <Fingerprint className="w-5 h-5 text-md3-primary" />
              {loadingBio ? 'Aguardando Digital...' : 'Desbloquear com Digital (WebAuthn)'}
            </button>
          )}

          <form onSubmit={handleVerifyPin} className="space-y-3">
            <div>
              <label className="flex items-center justify-center gap-1 text-xs font-medium text-md3-onSurfaceVariant mb-1">
                <KeyRound className="w-3.5 h-3.5" /> Ou digite seu PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full rounded-md3-md border border-md3-outline bg-md3-surface px-3.5 py-2 text-center tracking-widest text-base"
              />
            </div>

            {error && <p className="text-xs text-red-600 text-center font-medium">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-md3-full bg-md3-primary py-2.5 text-sm font-medium text-md3-onPrimary"
            >
              Entrar no Espaço Privado
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
