"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CURRENCIES } from "@/lib/currency";

export function CreateGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addMember() {
    const value = memberInput.trim();
    if (!value) return;
    if (members.includes(value)) {
      setError("That name is already in the group.");
      return;
    }
    setMembers([...members, value]);
    setMemberInput("");
    setError(null);
  }

  function removeMember(name: string) {
    setMembers(members.filter((m) => m !== name));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please give the group a name.");
      return;
    }
    if (members.length < 2) {
      setError("Add at least two members.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, currency, members }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create group.");
      }
      const { id } = await res.json();
      router.push(`/g/${id}/created`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="group-name" className="label">
          Group name
        </label>
        <input
          id="group-name"
          className="input"
          placeholder="e.g. Hokkaido trip"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
        />
      </div>

      <div>
        <label htmlFor="currency" className="label">
          Currency
        </label>
        <select
          id="currency"
          className="input"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} — {c.label} ({c.code})
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="label">Members</span>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Type a name and press Add"
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addMember();
              }
            }}
            maxLength={40}
          />
          <button type="button" className="btn-secondary shrink-0" onClick={addMember}>
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {members.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {members.map((m) => (
              <li key={m} className="chip">
                {m}
                <button
                  type="button"
                  onClick={() => removeMember(m)}
                  className="ml-1 rounded-full p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                  aria-label={`Remove ${m}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? "Creating…" : "Create group"}
      </button>
    </form>
  );
}
