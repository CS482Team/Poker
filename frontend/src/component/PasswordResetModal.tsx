"use client"

import { resetPassword } from "@/service/AdminService"
import type { Report } from "@shared/Report"
import { useState, type FormEvent } from "react"

export default function PasswordResetModal({ report, onClose, onDone }: { report: Report; onClose: () => void; onDone: () => void }) {
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      setEmail(await resetPassword(report.id, password))
      onDone()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <form role="dialog" aria-label="Set password" onSubmit={submit} className="w-full max-w-[420px] rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="truncate text-xl font-bold">Reset {report.username ?? "Player"}&apos;s Password</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>
        {email ? (
          <p className="p-5 text-[#d8cfcf]">Password set. Send it to {email}.</p>
        ) : (
          <div className="grid gap-4 p-5">
            <label className="crud-field">
              <span>New password</span>
              <input type="text" required minLength={6} autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end">
              <button type="submit" className="secondary-action">
                Set Password
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
