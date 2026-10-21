import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; expenseId: string }> },
) {
  const { id, expenseId } = await params;
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { groupId: true },
  });
  if (!expense || expense.groupId !== id) {
    return NextResponse.json({ error: "Expense not found." }, { status: 404 });
  }

  await prisma.expense.delete({ where: { id: expenseId } });
  return NextResponse.json({ ok: true });
}
