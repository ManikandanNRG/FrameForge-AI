import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Propagate a per-request correlation id through async hops so structured
 * logs and the error envelope can include it (spec §13.5, §9.1).
 */

const store = new AsyncLocalStorage<string>();

export function getRequestId(): string | undefined {
  return store.getStore();
}

export function withRequestId<T>(id: string, fn: () => T): T {
  return store.run(id, fn);
}
