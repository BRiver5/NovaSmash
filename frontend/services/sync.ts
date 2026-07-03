/**
 * Fire-and-forget backend sync. SQLite is the source of truth; the backend is
 * a best-effort mirror. Failures are swallowed and re-queued — they never
 * surface to the UI or block a user action.
 */
import { api, API_BASE_URL } from './api';

type Op = () => Promise<unknown>;

const queue: Op[] = [];
let flushing = false;

export function enqueueSync(op: Op): void {
  if (!API_BASE_URL) return; // no backend configured — pure offline
  op().catch(() => {
    queue.push(op);
  });
}

export async function flushSyncQueue(): Promise<void> {
  if (flushing || queue.length === 0 || !API_BASE_URL) return;
  flushing = true;
  const pending = queue.splice(0, queue.length);
  for (const op of pending) {
    try {
      await op();
    } catch {
      queue.push(op); // re-queue and stop; try again next tick
      break;
    }
  }
  flushing = false;
}

export const syncApi = api;
