'use client';

import React, { useState } from 'react';
import { Fingerprint, Lock } from 'lucide-react';
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
      webauthnCredentialId: credentialId,
      includePrivateInWednesdayReminder: false
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
      setError('Não foi possível validar a digital. Utilize seu PIN.');
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-md3-xl border border-md3-outlineVariant bg-md3-surfaceContainerLowest p-6 shadow-md space-y-5">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="rounded-full bg-md3-primaryContainer p-3 text-md3-primary">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-md3-onSurface">
          {config.enabled ? 'Espaço Privado Protegido' : 'Criar Espaço Privado'}
        </h2>
        <p className="text-xs text-md3-onSurfaceVariant">
          Pastas, subpastas, links e tarefas privadas ficam ocultos das estatísticas e dos lembretes de quarta-feira por padrão.
        </p>
      </div>

      {!config.enabled ? (
        <form onSubmit={handleSetup} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-md3-onSurfaceVariant mb-1">
              Defina um PIN numérico (mín. 4 dígitos)
            </label>
            <input
              type="password"
              inputMode="numeric"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-md3-md border border-md3-outline px-3 py-2 text-center tracking-widest text-base"
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
              className="w-full rounded-md3-md border border-md3-outline px-3 py-2 text-center tracking-widest text-base"
            />
          </div>

          {biometricSupported && (
            <label className="flex items-center gap-2 text-xs text-md3-onSurface cursor-pointer">
              <input
                type="checkbox"
                checked={enableBiometrics}
                onChange={(e) => setEnableBiometrics(e.target.checked)}
              />
              <Fingerprint className="w-4 h-4 text-md3-primary" />
              <span>Habilitar desbloqueio por digital/biometria no celular</span>
            </label>
          )}

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loadingBio}
            className="w-full rounded-md3-full bg-md3-primary py-2.5 text-sm font-semibold text-md3-onPrimary hover:opacity-95"
          >
            {loadingBio ? 'Registrando biometria...' : 'Ativar Espaço Privado'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <form onSubmit={handleVerifyPin} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              placeholder="Digite seu PIN"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-md3-md border border-md3-outline px-3 py-2.5 text-center tracking-widest text-base"
            />
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-md3-full bg-md3-primary py-2.5 text-sm font-semibold text-md3-onPrimary hover:opacity-95"
            >
              Desbloquear com PIN
            </button>
          </form>

          {config.webauthnCredentialId && (
            <button
              type="button"
              disabled={loadingBio}
              onClick={handleBiometricUnlock}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md3-full border border-md3-primary py-2.5 text-sm font-semibold text-md3-primary hover:bg-md3-primaryContainer/30"
            >
              <Fingerprint className="w-4 h-4" />
              {loadingBio ? 'Validando digital...' : 'Entrar com Digital no Celular'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
