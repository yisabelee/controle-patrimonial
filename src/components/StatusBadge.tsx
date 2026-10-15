import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, type Status } from "@/lib/patrimonio";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant={status} className="whitespace-nowrap font-medium">
      {STATUS_LABEL[status]}
    </Badge>
  );
}
