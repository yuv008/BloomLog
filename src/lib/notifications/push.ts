"use client";

const COZY_MESSAGES = [
  "a quiet minute for today?",
  "your garden is waiting, softly.",
  "no pressure. just presence.",
];

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function scheduleCozyHourReminder(cozyHour: string) {
  if (typeof window === "undefined") return;

  const [h, m] = cozyHour.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const delay = target.getTime() - now.getTime();
  const message = COZY_MESSAGES[Math.floor(Math.random() * COZY_MESSAGES.length)];

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification("Bloomlog", {
        body: message,
        icon: "/icons/icon-192.png",
        tag: "cozy-hour",
        silent: true,
      }).catch(() => {
        setTimeout(() => showLocalNotification(message), delay);
      });
    });
  } else {
    setTimeout(() => showLocalNotification(message), Math.min(delay, 60000));
  }

  localStorage.setItem("bloomlog_cozy_hour", cozyHour);
}

function showLocalNotification(body: string) {
  if (Notification.permission === "granted") {
    new Notification("Bloomlog", { body, icon: "/icons/icon-192.png", silent: true });
  }
}

export async function registerPushSubscription(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  await navigator.serviceWorker.register("/sw.js");
}
