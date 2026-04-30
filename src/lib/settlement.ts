/**
 * Settlement algorithm — TypeScript port of main.py.
 *
 * Given each member's net balance (positive = owed money, negative = owes money),
 * produces a minimal-ish list of debtor → creditor transfers that zero everyone out.
 *
 * Strategy: repeatedly match the largest creditor with the largest debtor and
 * transfer min(creditor, |debtor|) until no balances remain. This greedy pairing
 * yields at most n-1 transfers for n members.
 */

export type Balance = {
  memberId: string;
  memberName: string;
  amount: number;
};

export type Transfer = {
  debtorId: string;
  debtor: string;
  creditorId: string;
  creditor: string;
  amount: number;
};

export function settle(balances: Balance[]): Transfer[] {
  const working = balances.map((b) => ({ ...b }));
  const transfers: Transfer[] = [];

  while (true) {
    working.sort((a, b) => b.amount - a.amount);
    const creditor = working[0];
    const debtor = working[working.length - 1];

    if (!creditor || !debtor) break;

    const amount = Math.min(creditor.amount, Math.abs(debtor.amount));
    if (amount <= 0) break;

    creditor.amount -= amount;
    debtor.amount += amount;

    transfers.push({
      debtorId: debtor.memberId,
      debtor: debtor.memberName,
      creditorId: creditor.memberId,
      creditor: creditor.memberName,
      amount,
    });
  }

  return transfers;
}
