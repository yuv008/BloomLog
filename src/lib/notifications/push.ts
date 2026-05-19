"use client";

const COZY_MESSAGES = [
  "a quiet minute for today?",
  "your garden is waiting, softly.",
  "no pressure. just presence.",
];

function zonedMinutes(timeZone: string, date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function msUntilCozyHour(cozyHour: string, timeZone: string): number {
  const [th, tm] = cozyHour.split(":").map(Number);
  const target = th * 60 + (tm || 0);
  const now = zonedMinutes(timeZone);
  let diffMin = target - now;
  if (diffMin <= 0) diffMin += 24 * 60;
  return diffMin * 60 * 1000;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function scheduleCozyHourReminder(cozyHour: string, timeZone?: string) {
  if (typeof window === "undefined") return;

  const tz =
    timeZone ??
    (typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC");

  const delay = msUntilCozyHour(cozyHour, tz);
  const message = COZY_MESSAGES[Math.floor(Math.random() * COZY_MESSAGES.length)];

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg
        .showNotification("Bloomlog", {
          body: message,
          icon: "/icons/icon-192.png",
          tag: "cozy-hour",
          silent: true,
        })
        .catch(() => {
          setTimeout(() => showLocalNotification(message), delay);
        });
    });
  } else {
    setTimeout(() => showLocalNotification(message), Math.min(delay, 60000));
  }

  localStorage.setItem("bloomlog_cozy_hour", cozyHour);
  localStorage.setItem("bloomlog_timezone", tz);
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
