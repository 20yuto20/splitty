import type { Balance } from "./settlement";

type Member = { id: string; name: string };
type Share = { memberId: string; amount: number };
type Expense = { payerId: string; amount: number; shares: Share[] };

/**
 * Compute each member's net balance from a group's members and expenses.
 *
 * For each expense:
 *   - the payer is credited the full amount
 *   - each share-holder is debited their share
 *
 * Net balance = sum of credits - sum of debits.
 * Positive means the member is owed money; negative means they owe.
 */
export function computeBalances(members: Member[], expenses: Expense[]): Balance[] {
  const totals = new Map<string, number>();
  for (const m of members) totals.set(m.id, 0);

  for (const e of expenses) {
    totals.set(e.payerId, (totals.get(e.payerId) ?? 0) + e.amount);
    for (const s of e.shares) {
      totals.set(s.memberId, (totals.get(s.memberId) ?? 0) - s.amount);
    }
  }

  return members.map((m) => ({
    memberId: m.id,
    memberName: m.name,
    amount: totals.get(m.id) ?? 0,
  }));
}
