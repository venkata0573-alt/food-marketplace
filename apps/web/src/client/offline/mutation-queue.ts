'use client';
// client-justification: drains offline mutation queue when connectivity returns.

import { useEffect } from 'react';

const QUEUE_KEY = 'fm-offline-mutations';

export interface QueuedMutation {
  id: string;
  url: string;
  method: string;
  body: string;
}

export function readQueue(): QueuedMutation[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedMutation[]) : [];
  } catch {
    return [];
  }
}

export function writeQueue(items: QueuedMutation[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function enqueueOfflineMutation(entry: Omit<QueuedMutation, 'id'>): void {
  const queue = readQueue();
  queue.push({ ...entry, id: crypto.randomUUID() });
  writeQueue(queue);
}

export async function flushOfflineQueue(): Promise<void> {
  const queue = readQueue();
  if (queue.length === 0) {
    return;
  }
  const remaining: QueuedMutation[] = [];
  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: item.body,
      });
      if (!response.ok) {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
}

export function OfflineMutationDrain() {
  useEffect(() => {
    const onOnline = () => {
      void flushOfflineQueue();
    };
    window.addEventListener('online', onOnline);
    void flushOfflineQueue();
    return () => window.removeEventListener('online', onOnline);
  }, []);
  return null;
}
