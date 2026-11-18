'use client';
// Ponto de entrada Next.js/React modular do Mega Brain.
// Para execução imediata sem build, abra diretamente o arquivo index.html na mesma pasta.
import React from 'react';
import { MegaBrainState } from './types';
import { inferMetadataFromHistory, detectIsTNE } from './tneClassifier';
import { triggerAlert } from './notificationHelper';
import { isBiometricAvailable, registerBiometricCredential, verifyBiometricCredential } from './webauthnHelper';

export {
  inferMetadataFromHistory,
  detectIsTNE,
  triggerAlert,
  isBiometricAvailable,
  registerBiometricCredential,
  verifyBiometricCredential,
};

export default function MegaBrainPage() {
  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">Mega Brain — Arquitetura Modular</h1>
      <p className="text-sm text-gray-500 mt-1">
        Abra o arquivo <code>index.html</code> incluído nesta pasta para executar a SPA completa imediatamente no navegador.
      </p>
    </main>
  );
}
