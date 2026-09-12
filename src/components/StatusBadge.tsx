import type { ModelStatus } from "@/lib/types";
import { STATUS_LABEL, statusClasses } from "@/lib/status";

export function StatusBadge({ status }: { status: ModelStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(status)}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
