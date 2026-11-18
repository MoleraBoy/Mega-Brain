import { NotificationSettings, TaskItem } from './types';

export function playReminderSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch {
    // Fallback silencioso se o navegador bloquear autoplay
  }
}

export function triggerReminderVibration(): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate([180, 90, 180]);
  }
}

export function dispatchReminderAlert(
  task: Pick<TaskItem, 'title' | 'soundEnabled' | 'vibrationEnabled'>,
  globalSettings: NotificationSettings
): { playedSound: boolean; vibrated: boolean } {
  const shouldPlaySound = globalSettings.globalSoundEnabled && task.soundEnabled;
  const shouldVibrate = globalSettings.globalVibrationEnabled && task.vibrationEnabled;

  if (shouldPlaySound) {
    playReminderSound();
  }
  if (shouldVibrate) {
    triggerReminderVibration();
  }

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification('Lembrete — Mega Brain', {
      body: task.title,
      silent: !shouldPlaySound
    });
  }

  return { playedSound: shouldPlaySound, vibrated: shouldVibrate };
}
