"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/currency";

type Expense = {
  id: string;
  description: string;
  amount: number;
  createdAt: string;
  payerName: string;
  participants: string[];
};

export function ExpenseRow({
  groupId,
  expense,
  currency,
}: {
  groupId: string;
  expense: Expense;
  currency: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm(`Delete "${expense.description}"?`)) return;
    setBusy(true);
    const res = await fetch(`/api/groups/${groupId}/expenses/${expense.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to delete.");
      setBusy(false);
    }
  }

  const date = new Date(expense.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <li className="flex items-start justify-between gap-3 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-medium text-slate-900">
          {expense.description}
        </div>
        <div className="mt-1 text-sm text-slate-500">
          {expense.payerName} paid · {date}
        </div>
        <div className="mt-1 text-xs text-slate-400">
          For: {expense.participants.join(", ")}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="font-semibold text-slate-900">
          {formatMoney(expense.amount, currency)}
        </span>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 disabled:opacity-40"
          aria-label="Delete expense"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
