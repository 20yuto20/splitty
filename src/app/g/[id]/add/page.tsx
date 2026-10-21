import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AddExpenseForm } from "@/components/AddExpenseForm";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function AddExpensePage({ params }: Props) {
  const { id } = await params;
  const group = await prisma.group.findUnique({
    where: { id },
    include: { members: { orderBy: { createdAt: "asc" } } },
  });
  if (!group) notFound();

  return (
    <div className="space-y-6 pt-2">
      <h1 className="text-2xl font-bold text-slate-900">Add expense</h1>
      <AddExpenseForm
        groupId={group.id}
        currency={group.currency}
        members={group.members.map((m) => ({ id: m.id, name: m.name }))}
      />
    </div>
  );
}
