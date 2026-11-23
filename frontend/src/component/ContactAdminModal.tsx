"use client"

import Icon, { CHECK } from "@/component/Icon"
import { sendReport } from "@/service/ReportService"
import { MAX_REPORT_LENGTH } from "@shared/Rules"
import { useState } from "react"

export default function ContactAdminModal({ tableId, onClose }: { tableId: string; onClose: () => void }) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      await sendReport(message.trim(), tableId)
      setSent(true)
    } catch (err) {
      setError((err as Error).message)
    }
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <form
        role="dialog"
        aria-label="Contact Admin"
        onSubmit={submit}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="w-full max-w-[460px] rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-xl font-bold">Contact Admin</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>

        {sent ? (
          <div className="grid justify-items-center gap-2 px-5 py-8 text-center">
            <span className="mb-2 grid size-12 place-items-center rounded-full bg-[#3f9e68]/20 text-[#6fd099]">
              <Icon d={CHECK} size={24} />
            </span>
            <p className="text-lg font-semibold">Message sent</p>
            <p className="text-sm text-[#b5a9a9]">Thanks for letting us know. An admin will take a look.</p>
            <button type="button" autoFocus onClick={onClose} className="primary-action small mt-4">
              Close
            </button>
          </div>
        ) : (
          <div className="grid gap-3 p-5">
            <p className="text-sm text-[#b5a9a9]">Report a problem to an admin.</p>
            <div className="relative">
              <textarea
                aria-label="Message"
                autoFocus
                rows={5}
                maxLength={MAX_REPORT_LENGTH}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the problem…"
                className="block w-full resize-none rounded-lg border border-white/10 bg-black/40 px-3 py-2 pb-6 text-[17px] text-[#f5f2ef] outline-none placeholder:text-[#7d7373] focus:border-white/30"
              />
              <span className="absolute bottom-2 right-3 text-xs text-[#7d7373]">
                {message.length}/{MAX_REPORT_LENGTH}
              </span>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="mt-1 flex justify-end">
              <button type="submit" disabled={sending || !message.trim()} className="primary-action small disabled:cursor-not-allowed disabled:opacity-50">
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
