
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 1000;
const ipStore = new Map();

export function rateLimit(ip) {
  const now = Date.now();
  const record = ipStore.get(ip) || { count: 0, start: now };

  if (now - record.start > WINDOW_MS) {
    ipStore.set(ip, { count: 1, start: now });
    return true;
  }

  if (record.count >= RATE_LIMIT) return false;

  record.count++;
  ipStore.set(ip, record);
  return true;
}
