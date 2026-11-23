"use client"

/* Forgot password: asks an admin to reset it (story S24). The answer never says whether the email has an account. */
import { requestPasswordReset } from "@/service/ReportService"
import { useState, type FormEvent } from "react"

interface Props {
  /** whatever was typed in the sign-in form's email field */
  email: string
  onClose: () => void
}

export default function ResetRequestModal({ email: typed, onClose }: Props) {
  const [email, setEmail] = useState(typed)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await requestPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send your request")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <form role="dialog" aria-label="Reset your password" onSubmit={submit} className="w-full max-w-[420px] rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-xl font-bold">Reset your password</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>

        <div className="grid gap-4 p-5">
          {sent ? (
            <p role="status" className="text-[15px] leading-relaxed">
              If that email has an account, an admin will reset its password and get in touch.
            </p>
          ) : (
            <>
              <p className="text-sm text-[#b5a9a9]">An admin will set a new password for you.</p>
              <label className="grid gap-1.5 text-sm text-[#b5a9a9]">
                Your email
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[#f5f2ef]" />
              </label>
              {error && (
                <p role="alert" className="text-sm text-red-400">
                  {error}
                </p>
              )}
            </>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="secondary-action" onClick={onClose}>
              {sent ? "Done" : "Cancel"}
            </button>
            {!sent && (
              <button type="submit" className="primary-action" disabled={sending}>
                {sending ? "Sending…" : "Request reset"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}