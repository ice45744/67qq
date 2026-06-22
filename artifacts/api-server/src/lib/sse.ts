import type { Response } from "express";

type SSEClient = {
  id: string;
  res: Response;
};

const clients = new Map<string, SSEClient>();

export function addSSEClient(id: string, res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write(`: connected\n\n`);

  clients.set(id, { id, res });

  res.on("close", () => {
    clients.delete(id);
  });
}

export function broadcast(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients.values()) {
    try {
      client.res.write(payload);
    } catch (_) {
      clients.delete(client.id);
    }
  }
}
