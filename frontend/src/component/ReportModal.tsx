"use client"

import HandCard from "@/component/HandCard"
import { fetchReport, resetPassword } from "@/service/AdminService"
import type { Report, ReportDetail, ReportHand } from "@shared/Report"
import { useEffect, useState } from "react"

export default function ReportModal({ report, onClose }: { report: Report; onClose: () => void }) {
  const [detail, setDetail] = useState<ReportDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<"hands" | "chat">("hands")

  const isReset = report.kind === "password_reset"

  useEffect(() => {
    // reset requests aren't about a table, so there are no hands or chat to load
    if (isReset) return

    fetchReport(report.id)
      .then(setDetail)
      .catch((err: Error) => setError(err.message))
  }, [report.id, isReset])

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div role="dialog" aria-label="Report" className="flex max-h-[min(640px,85vh)] w-full max-w-[720px] flex-col rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="avatar-initial">{(report.username ?? "?")[0]}</span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">{report.username ?? "Deleted player"}</h2>
              <p className="truncate text-sm text-[#9e9393]">
                {report.tableName ?? "No table"} · {formatTime(report.createdAt)}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>

        <div className="px-5 pt-4">
          <p className="whitespace-pre-wrap break-words rounded-md bg-white/[.04] px-4 py-3 text-[15px] leading-relaxed">{report.body}</p>
          {isReset && <ResetPanel report={report} />}
          {!isReset && <div role="tablist" className="mt-4 flex gap-5 border-b border-white/10 text-sm">
            <TabButton active={tab === "hands"} onClick={() => setTab("hands")} label={`Hands${detail ? ` (${detail.hands.length})` : ""}`} />
            <TabButton active={tab === "chat"} onClick={() => setTab("chat")} label={`Chat${detail ? ` (${detail.chat.length})` : ""}`} />
          </div>}
        </div>

        {!isReset && <div className="min-h-[200px] flex-1 overflow-y-auto px-5 py-4">
          {error && <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          {!detail && !error && <p className="py-10 text-center text-sm text-[#9e9393]">Loading…</p>}
          {detail && tab === "hands" && <Hands hands={detail.hands} />}
          {detail && tab === "chat" && <Chat detail={detail} />}
        </div>}
      </div>
    </div>
  )
}

/* for a password reset request: the admin types a new password for the account and passes it on */
function ResetPanel({ report }: { report: Report }) {
  const [password, setPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [doneFor, setDoneFor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (report.status === "resolved") return <p className="py-6 text-sm text-[#9e9393]">This password was already reset.</p>

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { email } = await resetPassword(report.id, password)
      setDoneFor(email ?? "the player")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password")
    } finally {
      setSaving(false)
    }
  }

  if (doneFor) {
    return (
      <p role="status" className="my-5 rounded-md bg-green-500/10 px-4 py-3 text-sm text-green-300">
        Password set. Send it to {doneFor}.
      </p>
    )
  }
  return (
    <form onSubmit={submit} className="my-5 grid gap-3">
      <label className="grid gap-1.5 text-sm text-[#b5a9a9]">
        New password
        <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required autoComplete="off" className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[#f5f2ef]" />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <button type="submit" className="primary-action w-fit" disabled={saving}>
        {saving ? "Saving…" : "Set password"}
      </button>
    </form>
  )
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px border-b-2 pb-2 font-medium transition-colors ${active ? "border-[#e8a3a5] text-white" : "border-transparent text-[#9e9393] hover:text-white"}`}
    >
      {label}
    </button>
  )
}

function Hands({ hands }: { hands: ReportHand[] }) {
  if (hands.length === 0) return <p className="py-10 text-center text-sm text-[#9e9393]">No hands played at this table.</p>

  return (
    <div className="grid gap-4">
      {hands.map((hand) => (
        <HandCard key={hand.id} hand={hand} />
      ))}
    </div>
  )
}

function Chat({ detail }: { detail: ReportDetail }) {
  if (detail.chat.length === 0) return <p className="py-10 text-center text-sm text-[#9e9393]">No chat messages.</p>

  return (
    <ul className="grid gap-2.5 text-sm">
      {detail.chat.map((message) => (
        <li key={message.id} className="flex gap-3">
          <span className="w-16 shrink-0 tabular-nums text-xs leading-5 text-[#7d7373]">{formatClock(message.createdAt)}</span>
          {message.userId === null ? (
            <span className="italic text-[#9e9393]">{message.body}</span>
          ) : (
            <p className="min-w-0 break-words">
              <span className="mr-2 font-semibold">{message.name}</span>
              <span className="text-[#d8cfcf]">{message.body}</span>
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}

function formatTime(date: string) {
  return new Date(date).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

function formatClock(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}
