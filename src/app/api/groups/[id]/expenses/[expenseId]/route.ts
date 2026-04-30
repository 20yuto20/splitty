import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; expenseId: string } },
) {
  const expense = await prisma.expense.findUnique({
    where: { id: params.expenseId },
    select: { groupId: true },
  });
  if (!expense || expense.groupId !== params.id) {
    return NextResponse.json({ error: "Expense not found." }, { status: 404 });
  }

  await prisma.expense.delete({ where: { id: params.expenseId } });
  return NextResponse.json({ ok: true });
}
