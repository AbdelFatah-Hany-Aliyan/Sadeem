"use client";

import { useState } from "react";
import { updateTaskStatusAction, deleteTaskAction } from "@/app/admin/company/actions";
import { TaskStatus } from "@prisma/client";
import { CheckCircle2, RotateCw, Trash2, AlertCircle } from "lucide-react";

interface Props {
  taskId: string;
  currentStatus: TaskStatus;
  reviewRequired: boolean;
}

export default function TaskStatusSelector({
  taskId,
  currentStatus,
  reviewRequired,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    if (newStatus === currentStatus) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("taskId", taskId);
    formData.append("status", newStatus);

    const res = await updateTaskStatusAction(formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to update status");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذه المهمة؟ / Delete task?")) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("taskId", taskId);
    await deleteTaskAction(formData);
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-[10px] text-red-400 font-mono flex items-center gap-1">
          <AlertCircle size={11} />
          {error}
        </span>
      )}

      <select
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={loading}
        className="px-2.5 py-1 rounded-lg border border-border bg-background text-foreground text-xs font-mono disabled:opacity-50"
      >
        <option value="TODO">TODO (قيد الانتظار)</option>
        <option value="IN_PROGRESS">IN_PROGRESS (قيد التنفيذ)</option>
        <option value="IN_REVIEW">IN_REVIEW (قيد المراجعة)</option>
        <option value="BLOCKED">BLOCKED (متوقفة)</option>
        <option value="DONE">DONE (مكتملة)</option>
        <option value="CANCELLED">CANCELLED (ملغاة)</option>
      </select>

      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        title="حذف المهمة"
        className="p-1 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
