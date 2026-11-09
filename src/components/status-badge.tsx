import { STATUS_BADGE, STATUS_LABEL, type OrderStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`badge ${STATUS_BADGE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
