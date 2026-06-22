type Handler = (data: unknown) => void;

const listeners = new Map<string, Set<Handler>>();
let es: EventSource | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function connect() {
  if (es && es.readyState !== EventSource.CLOSED) return;

  es = new EventSource("/api/events");

  es.onopen = () => {
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
  };

  es.onerror = () => {
    es?.close();
    es = null;
    retryTimer = setTimeout(connect, 3000);
  };

  for (const [event] of listeners) {
    es.addEventListener(event, (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        listeners.get(event)?.forEach(fn => fn(data));
      } catch (_) {}
    });
  }
}

function ensureListenerAttached(event: string) {
  if (!es || es.readyState === EventSource.CLOSED) return;
  es.addEventListener(event, (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      listeners.get(event)?.forEach(fn => fn(data));
    } catch (_) {}
  });
}

export function subscribe(event: string, handler: Handler): () => void {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
    ensureListenerAttached(event);
  }
  listeners.get(event)!.add(handler);
  connect();

  return () => {
    listeners.get(event)?.delete(handler);
  };
}
