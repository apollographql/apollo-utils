import { createHash } from ".";

export function operationHash(operation: string): string {
  return createHash("sha256").update(operation).digest("hex");
}
