import { inspect } from "node:util";

export function formatMigrationError(error: unknown): string {
  if (error instanceof AggregateError) {
    const messages = error.errors
      .map((item: unknown) =>
        item instanceof Error ? item.message : inspect(item, { depth: 1 }),
      )
      .filter(Boolean);
    return messages.length > 0 ? messages.join("; ") : "Aggregate connection error";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return inspect(error, { depth: 1 });
}
