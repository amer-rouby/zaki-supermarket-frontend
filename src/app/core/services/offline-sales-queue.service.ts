import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SalesService } from './sales.service';
import { SaleRequest } from '../models';

export type QueuedSaleStatus = 'QUEUED' | 'CONFLICT';

export interface QueuedSale {
  clientReferenceId: string;
  request: SaleRequest;
  queuedAt: string;
  status: QueuedSaleStatus;
  errorMessage?: string;
}

const DB_NAME = 'zaki-offline-sales-queue';
const DB_VERSION = 1;
const STORE_NAME = 'queued_sales';

// Native IndexedDB queue for sales created while offline. No added
// dependency - this is a thin wrapper, not a general-purpose ORM. Sales are
// synced in the order they were queued when the browser comes back online;
// a sale the server actually rejects (e.g. a stock conflict) is marked
// CONFLICT and kept for manual review, never silently dropped or retried
// forever.
@Injectable({ providedIn: 'root' })
export class OfflineSalesQueueService {
  private readonly salesService = inject(SalesService);
  private dbPromise: Promise<IDBDatabase> | null = null;
  private syncing = false;

  readonly queue = signal<QueuedSale[]>([]);

  constructor() {
    this.refresh();
    window.addEventListener('online', () => this.syncAll());
  }

  private openDb(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'clientReferenceId' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  private async withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.openDb();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async getAllEntries(): Promise<QueuedSale[]> {
    return this.withStore('readonly', (store) => store.getAll() as IDBRequest<QueuedSale[]>);
  }

  private async refresh(): Promise<void> {
    try {
      const entries = await this.getAllEntries();
      entries.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
      this.queue.set(entries);
    } catch (err) {
      console.error('Failed to read offline sales queue:', err);
    }
  }

  async enqueue(request: SaleRequest): Promise<string> {
    const clientReferenceId = crypto.randomUUID();
    const entry: QueuedSale = {
      clientReferenceId,
      request: { ...request, clientReferenceId },
      queuedAt: new Date().toISOString(),
      status: 'QUEUED'
    };
    await this.withStore('readwrite', (store) => store.put(entry));
    await this.refresh();
    return clientReferenceId;
  }

  async discard(clientReferenceId: string): Promise<void> {
    await this.withStore('readwrite', (store) => store.delete(clientReferenceId));
    await this.refresh();
  }

  async syncAll(): Promise<void> {
    if (this.syncing || !navigator.onLine) return;
    this.syncing = true;
    try {
      const pending = (await this.getAllEntries())
        .filter((e) => e.status === 'QUEUED')
        .sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));

      for (const entry of pending) {
        try {
          await firstValueFrom(this.salesService.createSale(entry.request));
          await this.withStore('readwrite', (store) => store.delete(entry.clientReferenceId));
        } catch (err: any) {
          if (err?.status === 0) {
            // Still offline (or the request never reached the server) -
            // leave it queued and stop; the rest of the queue would fail too.
            break;
          }
          await this.withStore('readwrite', (store) =>
            store.put({ ...entry, status: 'CONFLICT', errorMessage: err?.message || 'Sync failed' } as QueuedSale)
          );
        }
      }
    } finally {
      this.syncing = false;
      await this.refresh();
    }
  }
}
