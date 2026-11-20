const CACHE_NAME = 'mega-brain-v12-cache';
let scheduledItems = [];
let firedAlarmKeys = new Set();
let alarmCheckTimer = null;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      startBackgroundAlarmLoop();
    })()
  );
});

function startBackgroundAlarmLoop() {
  if (alarmCheckTimer) clearInterval(alarmCheckTimer);
  alarmCheckTimer = setInterval(checkAlarmsInWorker, 4000);
}

function checkAlarmsInWorker() {
  if (!Array.isArray(scheduledItems) || scheduledItems.length === 0) return;

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  scheduledItems.forEach((item) => {
    if (!item || item.priority === 'done' || item.archivedToHistory) return;
    if (!item.notificationMode || item.notificationMode === 'none') return;
    if (!item.reminderTime) return;
    if (item.reminderDate && item.reminderDate !== todayIso && (!item.recurrence || item.recurrence === 'none')) return;

    const [remH, remM] = item.reminderTime.split(':').map(Number);
    if (isNaN(remH) || isNaN(remM)) return;

    const remMinutes = remH * 60 + remM;
    const diff = nowMinutes - remMinutes;
    const alarmKey = `${item.id}_${todayIso}_${item.reminderTime}`;

    if (diff >= 0 && diff <= 15 && !firedAlarmKeys.has(alarmKey)) {
      firedAlarmKeys.add(alarmKey);
      const wantVibrate = ['vibrate_only', 'popup_vibrate', 'vibrate_sound', 'all'].includes(item.notificationMode);
      const wantSound = ['sound_only', 'popup_sound', 'vibrate_sound', 'all'].includes(item.notificationMode);

      self.registration.showNotification(`⏰ Mega Brain: ${item.title}`, {
        body: item.freeNotes?.[0] || `Lembrete agendado para ${item.reminderTime}`,
        tag: alarmKey,
        renotify: true,
        requireInteraction: true,
        vibrate: wantVibrate ? [500, 150, 500, 150, 800, 200, 500] : undefined,
        silent: !wantSound,
        data: { itemId: item.id, alarmKey, url: './' },
      });

      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'ALARM_FIRED_FROM_SW',
            payload: { item, alarmKey },
          });
        });
      });
    }
  });
}

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SYNC_SCHEDULED_ALARMS') {
    scheduledItems = event.data.payload?.items || [];
    if (Array.isArray(event.data.payload?.firedKeys)) {
      event.data.payload.firedKeys.forEach((k) => firedAlarmKeys.add(k));
    }
    checkAlarmsInWorker();
    startBackgroundAlarmLoop();
  }

  if (event.data.type === 'SHOW_ALARM_NOTIFICATION') {
    const { title, body, vibrate, silent, tag } = event.data.payload;
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        tag: tag || 'megabrain-alarm',
        renotify: true,
        requireInteraction: true,
        vibrate: vibrate ? [500, 150, 500, 150, 800, 200, 500] : undefined,
        silent: Boolean(silent),
      })
    );
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'mega-brain-alarm-sync') {
    event.waitUntil(Promise.resolve(checkAlarmsInWorker()));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
