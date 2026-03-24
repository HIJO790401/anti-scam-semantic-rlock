import { AuditResponse } from "@/lib/types";
import { computeFinalVerdict } from "@/lib/void-engine/finalVerdict";
import { VoidEngineVerdict } from "@/lib/void-engine/types";

export function runVoidEngine(message: string, source: AuditResponse): VoidEngineVerdict {
  return computeFinalVerdict({ message, source });
}

export type { VoidEngineVerdict } from "@/lib/void-engine/types";
