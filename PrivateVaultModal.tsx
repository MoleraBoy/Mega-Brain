'use client';

import React, { useEffect, useState } from 'react';
import { Fingerprint, Lock, ShieldCheck, X } from 'lucide-react';
import { PrivateVaultConfig } from '@/lib/types';
import {
  hashPin,
  isBiometricAvailable,
  registerBiometricCredential,
  verifyBiometricCredential
} from '@/lib/webauthn';

interface Props {
  isOpen: boolean;
  config: PrivateVaultConfig;
  onClose: () => void;
  onUnlock: () => void;
  onSaveConfig: (cfg: PrivateVaultConfig) => void;
}

export function PrivateVaultModal({ isOpen, config, onClose, onUnlock, onSaveConfig }: Props) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [enableBio, setEnableBio] = useState(true);
  const [bioSupported, setBioSupported] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    isBiometricAvailable().then(setBioSupported);
  }, []);

  if (!isOpen) return null;

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pin.length < 4) {
      setError('O PIN deve ter pelo menos 4 dígitos.');
      return;
    }
    if (pin !== confirmPin) {
      setError('Os PINs não coincidem.');
      return;
    }
    const pinHash = await hashPin(pin);
    let credentialId: string | undefined;
    if (enableBio && bioSupported) {
      const cred = await registerBiometricCredential();
      if (cred) credentialId = cred;
    }
    onSaveConfig({
      isConfigured: true,
      pinHash,
      webAuthnCredentialId: credentialId
    });
    setPin('');
    setConfirmPin('');
    onUnlock();
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const hashed = await hashPin(pin);
    if (hashed === config.pinHash) {
      setPin('');
      onUnlock();
    } else {
      setError('PIN incorreto.');
    }
  };

  const handleBiometricUnlock = async () => {
    setError('');
    if (!config.webAuthnCredentialId) return;
    const ok = await verifyBiometricCredential(config.webAuthnCredentialId);
    if (ok) {
      onUnlock();
    } else {
      setError('Falha na leitura biométrica. Use seu PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-md3-xl bg-white p-6 shadow-2xl border border-md3-outlineVariant">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 text-md3-primary">
            <ShieldCheck className="w-6 h-6" />
            <h2 className="text-lg font-semibold">
              {config.isConfigured ? 'Desbloquear Espaço Privado' : 'Criar Espaço Privado'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-md3-surfaceContainer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!config.isConfigured ? (
          <form onSubmit={handleSetup} className="space-y-4">
            <p className="text-sm text-gray-600">
              Pastas, links e tarefas do Espaço Privado ficam ocultos e não entram nas estatísticas do relatório (a menos que você marque a opção manualmente).
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Crie um PIN (mín. 4 dígitos)</label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full rounded-md3-md border border-md3-outlineVariant px-3.5 py-2.5 text-sm focus:border-md3-primary focus:outline-none"
                placeholder="••••"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Confirme o PIN</label>
              <input
                type="password"
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="w-full rounded-md3-md border border-md3-outlineVariant px-3.5 py-2.5 text-sm focus:border-md3-primary focus:outline-none"
                placeholder="••••"
              />
            </div>
            {bioSupported && (
              <label className="flex items-center gap-2.5 text-sm text-gray-700 bg-md3-surfaceContainer p-3 rounded-md3-md cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableBio}
                  onChange={(e) => setEnableBio(e.target.checked)}
                  className="rounded text-md3-primary"
                />
                <Fingerprint className="w-5 h-5 text-md3-primary" />
                <span>Ativar entrada com Digital no celular (WebAuthn)</span>
              </label>
            )}
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-md3-full bg-md3-primary py-2.5 text-sm font-medium text-white hover:opacity-95 transition"
            >
              Criar Espaço Privado
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {config.webAuthnCredentialId && (
              <button
                type="button"
                onClick={handleBiometricUnlock}
                className="w-full flex items-center justify-center gap-2 rounded-md3-full bg-md3-primaryContainer text-md3-onPrimaryContainer py-3 text-sm font-semibold hover:brightness-95 transition"
              >
                <Fingerprint className="w-5 h-5" />
                Entrar com Digital / Biometria
              </button>
            )}
            <form onSubmit={handleVerifyPin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ou digite seu PIN</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full rounded-md3-md border border-md3-outlineVariant pl-10 pr-3.5 py-2.5 text-sm focus:border-md3-primary focus:outline-none"
                    placeholder="Digite seu PIN"
                  />
                </div>
              </div>
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-md3-full bg-md3-primary py-2.5 text-sm font-medium text-white hover:opacity-95 transition"
              >
                Desbloquear com PIN
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
