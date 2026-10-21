import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Download, Pencil, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { computeBalances } from "@/lib/balance";
import { settle } from "@/lib/settlement";
import { formatMoney } from "@/lib/currency";
import { ExpenseRow } from "@/components/ExpenseRow";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function GroupPage({ params }: Props) {
  const { id } = await params;
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: { orderBy: { createdAt: "asc" } },
      expenses: {
        orderBy: { createdAt: "desc" },
        include: {
          payer: true,
          shares: { include: { member: true } },
        },
      },
    },
  });
  if (!group) notFound();

  const balances = computeBalances(
    group.members.map((m) => ({ id: m.id, name: m.name })),
    group.expenses.map((e) => ({
      payerId: e.payerId,
      amount: e.amount,
      shares: e.shares.map((s) => ({ memberId: s.memberId, amount: s.amount })),
    })),
  );
  const transfers = settle(balances);
  const total = group.expenses.reduce((a, e) => a + e.amount, 0);

  return (
    <div className="space-y-8 pt-2">
      <section className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold tracking-tight text-slate-900">
            {group.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {group.members.map((m) => m.name).join(" · ")}
          </p>
        </div>
        <Link
          href={`/g/${group.id}/edit`}
          className="btn-ghost shrink-0"
          aria-label="Edit group"
        >
          <Pencil className="h-4 w-4" />
        </Link>
      </section>

      <Link href={`/g/${group.id}/add`} className="btn-primary w-full text-base">
        <Plus className="h-5 w-5" />
        Add expense
      </Link>

      <section className="space-y-3">
        <header className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Settlement</h2>
          <span className="text-sm text-slate-500">
            Total {formatMoney(total, group.currency)}
          </span>
        </header>

        {transfers.length === 0 ? (
          <div className="card p-5 text-sm text-slate-500">
            {group.expenses.length === 0
              ? "No expenses yet. Add one to see the settlement."
              : "Everyone is settled up. 🎉"}
          </div>
        ) : (
          <ul className="card divide-y divide-slate-100">
            {transfers.map((t, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 px-5 py-4"
              >
                <div className="flex min-w-0 items-center gap-2 text-slate-900">
                  <span className="truncate font-medium">{t.debtor}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate font-medium">{t.creditor}</span>
                </div>
                <span className="shrink-0 font-semibold text-brand-600">
                  {formatMoney(t.amount, group.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <header className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Expenses</h2>
          {group.expenses.length > 0 && (
            <a
              href={`/api/groups/${group.id}/csv`}
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              <Download className="h-4 w-4" />
              CSV
            </a>
          )}
        </header>

        {group.expenses.length === 0 ? (
          <div className="card p-5 text-sm text-slate-500">No expenses yet.</div>
        ) : (
          <ul className="card divide-y divide-slate-100">
            {group.expenses.map((e) => (
              <ExpenseRow
                key={e.id}
                groupId={group.id}
                currency={group.currency}
                expense={{
                  id: e.id,
                  description: e.description,
                  amount: e.amount,
                  createdAt: e.createdAt.toISOString(),
                  payerName: e.payer.name,
                  participants: e.shares.map((s) => s.member.name),
                }}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Balances</h3>
        <ul className="space-y-2 text-sm">
          {balances.map((b) => (
            <li key={b.memberId} className="flex justify-between">
              <span className="text-slate-700">{b.memberName}</span>
              <span
                className={
                  b.amount > 0
                    ? "font-semibold text-accent-600"
                    : b.amount < 0
                      ? "font-semibold text-rose-600"
                      : "text-slate-500"
                }
              >
                {formatMoney(b.amount, group.currency)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
