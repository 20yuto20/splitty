"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { currencySymbol, formatMoney } from "@/lib/currency";

type Member = { id: string; name: string };
type Mode = "equal" | "custom";

export function AddExpenseForm({
  groupId,
  currency,
  members,
}: {
  groupId: string;
  currency: string;
  members: Member[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("equal");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [payerId, setPayerId] = useState<string>(members[0]?.id ?? "");
  const [participants, setParticipants] = useState<Set<string>>(
    new Set(members.map((m) => m.id)),
  );
  const [customShares, setCustomShares] = useState<Record<string, string>>(
    Object.fromEntries(members.map((m) => [m.id, ""])),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const symbol = currencySymbol(currency);
  const totalAmount = parseInt(amount || "0", 10) || 0;

  const customSum = useMemo(
    () =>
      Object.values(customShares).reduce(
        (a, v) => a + (parseInt(v || "0", 10) || 0),
        0,
      ),
    [customShares],
  );

  function toggleParticipant(id: string) {
    const next = new Set(participants);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setParticipants(next);
  }

  function buildEqualShares(): { memberId: string; amount: number }[] {
    const ids = [...participants];
    if (ids.length === 0) return [];
    const base = Math.floor(totalAmount / ids.length);
    const remainder = totalAmount - base * ids.length;
    // Distribute the remainder one cent/yen at a time so totals reconcile exactly.
    return ids.map((id, i) => ({
      memberId: id,
      amount: base + (i < remainder ? 1 : 0),
    }));
  }

  function buildCustomShares(): { memberId: string; amount: number }[] {
    return Object.entries(customShares)
      .map(([memberId, v]) => ({
        memberId,
        amount: parseInt(v || "0", 10) || 0,
      }))
      .filter((s) => s.amount > 0);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!description.trim()) return setError("Add a short description.");
    if (!payerId) return setError("Pick who paid.");

    let shares: { memberId: string; amount: number }[];
    let finalAmount: number;

    if (mode === "equal") {
      if (totalAmount <= 0) return setError("Enter an amount greater than zero.");
      if (participants.size === 0) return setError("Select at least one participant.");
      shares = buildEqualShares();
      finalAmount = totalAmount;
    } else {
      shares = buildCustomShares();
      if (shares.length === 0) return setError("At least one participant must owe a non-zero amount.");
      finalAmount = customSum;
      if (finalAmount <= 0) return setError("Enter shares greater than zero.");
    }

    setSubmitting(true);
    const res = await fetch(`/api/groups/${groupId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: description.trim(),
        amount: finalAmount,
        payerId,
        shares,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to add expense.");
      setSubmitting(false);
      return;
    }
    router.push(`/g/${groupId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="card grid grid-cols-2 overflow-hidden p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("equal")}
          className={`rounded-lg px-4 py-2 transition ${
            mode === "equal"
              ? "bg-brand-600 text-white shadow-soft"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Equal split
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`rounded-lg px-4 py-2 transition ${
            mode === "custom"
              ? "bg-brand-600 text-white shadow-soft"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Custom shares
        </button>
      </div>

      <div>
        <label htmlFor="desc" className="label">
          Description
        </label>
        <input
          id="desc"
          className="input"
          placeholder="e.g. Taxi to airport"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={120}
          required
        />
      </div>

      <div>
        <label htmlFor="payer" className="label">
          Paid by
        </label>
        <select
          id="payer"
          className="input"
          value={payerId}
          onChange={(e) => setPayerId(e.target.value)}
          required
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {mode === "equal" ? (
        <>
          <div>
            <label htmlFor="amount" className="label">
              Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                {symbol}
              </span>
              <input
                id="amount"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                className="input pl-10"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <span className="label">Split between</span>
            <ul className="card divide-y divide-slate-100">
              {members.map((m) => {
                const checked = participants.has(m.id);
                return (
                  <li key={m.id}>
                    <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleParticipant(m.id)}
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="font-medium text-slate-900">{m.name}</span>
                      </span>
                      {checked && totalAmount > 0 && participants.size > 0 && (
                        <span className="text-sm text-slate-500">
                          {formatMoney(
                            Math.floor(totalAmount / participants.size),
                            currency,
                          )}
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : (
        <div>
          <span className="label">Each member&apos;s share</span>
          <ul className="card divide-y divide-slate-100">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="font-medium text-slate-900">{m.name}</span>
                <div className="relative w-36">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    {symbol}
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    placeholder="0"
                    className="input py-2 pl-8 text-right"
                    value={customShares[m.id] ?? ""}
                    onChange={(e) =>
                      setCustomShares({ ...customShares, [m.id]: e.target.value })
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between text-sm text-slate-600">
            <span>Total</span>
            <span className="font-semibold text-slate-900">
              {formatMoney(customSum, currency)}
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary flex-1">
          {submitting ? "Saving…" : "Save expense"}
        </button>
      </div>
    </form>
  );
}
