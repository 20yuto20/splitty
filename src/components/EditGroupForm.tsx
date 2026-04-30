"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type ExistingMember = { id: string; name: string; inUse: boolean };

export function EditGroupForm({
  groupId,
  currentName,
  members,
}: {
  groupId: string;
  currentName: string;
  members: ExistingMember[];
}) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [newMember, setNewMember] = useState("");
  const [addQueue, setAddQueue] = useState<string[]>([]);
  const [removeQueue, setRemoveQueue] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function queueAdd() {
    const v = newMember.trim();
    if (!v) return;
    if (members.some((m) => m.name === v) || addQueue.includes(v)) {
      setError("That name is already in the group.");
      return;
    }
    setAddQueue([...addQueue, v]);
    setNewMember("");
    setError(null);
  }

  function unqueueAdd(name: string) {
    setAddQueue(addQueue.filter((n) => n !== name));
  }

  function toggleRemove(id: string) {
    const next = new Set(removeQueue);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRemoveQueue(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch(`/api/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim() !== currentName ? name.trim() : undefined,
        addMembers: addQueue.length ? addQueue : undefined,
        removeMemberIds: removeQueue.size ? [...removeQueue] : undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to update.");
      setSubmitting(false);
      return;
    }
    router.push(`/g/${groupId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="label">
          Group name
        </label>
        <input
          id="name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
        />
      </div>

      <div>
        <span className="label">Members</span>
        <ul className="card divide-y divide-slate-100">
          {members.map((m) => {
            const queued = removeQueue.has(m.id);
            return (
              <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span
                  className={`font-medium ${queued ? "text-slate-400 line-through" : "text-slate-900"}`}
                >
                  {m.name}
                </span>
                {m.inUse ? (
                  <span className="text-xs text-slate-400">in use</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleRemove(m.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                    aria-label={queued ? "Undo remove" : "Remove member"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            );
          })}
          {addQueue.map((n) => (
            <li
              key={`new-${n}`}
              className="flex items-center justify-between gap-3 bg-accent-500/5 px-4 py-3"
            >
              <span className="font-medium text-accent-600">{n} (new)</span>
              <button
                type="button"
                onClick={() => unqueueAdd(n)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                aria-label={`Cancel adding ${n}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex gap-2">
          <input
            className="input"
            placeholder="Add a new member"
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                queueAdd();
              }
            }}
            maxLength={40}
          />
          <button type="button" className="btn-secondary shrink-0" onClick={queueAdd}>
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

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
          {submitting ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
