"use client"

import { requestPasswordReset } from "@/service/ReportService"
import { useState, type FormEvent } from "react"

export default function ResetRequestModal({ email, onClose }: { email: string; onClose: () => void }) {
  const [address, setAddress] = useState(email)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      await requestPasswordReset(address.trim())
      setSent(true)
    } catch (err) {
      setError((err as Error).message)
    }
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <form role="dialog" aria-label="Reset password" onSubmit={submit} className="w-full max-w-[420px] rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-xl font-bold">Reset Password</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>
        {sent ? (
          <p className="p-5 text-[#d8cfcf]">Request sent. An admin will set a new password and let you know.</p>
        ) : (
          <div className="grid gap-4 p-5">
            <label className="crud-field">
              <span>Email</span>
              <input type="email" required autoFocus value={address} onChange={(e) => setAddress(e.target.value)} />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={sending} className="secondary-action">
                {sending ? "Sending…" : "Send Request"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
