import { TaskNotificationMode } from './types';

export function triggerTaskNotification(
  title: string,
  mode: TaskNotificationMode,
  onPopup: (message: string) => void
) {
  if (mode === 'sound_vibrate') {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([250, 100, 250]);
    }
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(740, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Fallback caso o navegador exija interação prévia para áudio
    }
    onPopup(`🔔📳 Notificação (Som + Vibração): ${title}`);
  } else if (mode === 'vibrate_only') {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([350, 140, 350]);
    }
    onPopup(`📳 Notificação (Só Vibração): ${title}`);
  } else {
    onPopup(`💬 Lembrete (Só Popup): ${title}`);
  }
}
