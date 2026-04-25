/**
 * Dev/debug: stringify viem/wagmi error chains for console + optional server log.
 */

function serializeUnknown(err: unknown, depth = 0): unknown {
  if (depth > 6) return "[max depth]";
  if (err == null) return err;
  if (typeof err === "string" || typeof err === "number" || typeof err === "boolean")
    return err;
  if (err instanceof Error) {
    const ex = err as Error & {
      cause?: unknown;
      details?: string;
      shortMessage?: string;
      metaMessages?: string[];
      data?: unknown;
    };
    const base: Record<string, unknown> = {
      name: err.name,
      message: err.message,
    };
    if (ex.cause !== undefined) base.cause = serializeUnknown(ex.cause, depth + 1);
    if (ex.details) base.details = ex.details;
    if (ex.shortMessage) base.shortMessage = ex.shortMessage;
    if (ex.metaMessages) base.metaMessages = ex.metaMessages;
    if (ex.data !== undefined) base.data = ex.data;
    return base;
  }
  if (typeof err === "object") {
    try {
      return JSON.parse(JSON.stringify(err));
    } catch {
      return String(err);
    }
  }
  return String(err);
}

function safeJson(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(
    value,
    (_key, v: unknown) => {
      if (typeof v === "bigint") return v.toString();
      if (v instanceof Error) return serializeUnknown(v);
      if (typeof v === "object" && v !== null) {
        if (seen.has(v)) return "[circular]";
        seen.add(v);
      }
      return v;
    },
    2,
  );
}

/** Logs to browser console; in development, mirrors to `npm run dev` terminal via `/api/client-log`. */
export function logTxDebug(
  flow: string,
  meta: Record<string, unknown>,
  err: unknown,
): void {
  const payload = {
    t: new Date().toISOString(),
    flow,
    ...meta,
    error: serializeUnknown(err),
  };
  const serialized = safeJson(payload);
  console.error(`[Prydox tx debug] ${serialized}`);
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    void fetch("/api/client-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: serialized,
    }).catch(() => {
      /* ignore */
    });
  }
}
