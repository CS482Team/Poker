"use client"

import Icon, { CHECK, COPY, EYE, EYE_OFF } from "@/component/Icon"
import { resetPassword } from "@/service/AdminService"
import type { PlayerSummary } from "@shared/PlayerHistory"
import { useState } from "react"

export default function ResetPasswordModal({ player, onClose }: { player: PlayerSummary; onClose: () => void }) {
  const [result, setResult] = useState<{ password: string; email: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [shown, setShown] = useState(false)

  async function reset() {
    const password = Array.from(crypto.getRandomValues(new Uint32Array(10)), (n) => "abcdefghjkmnpqrstuvwxyz23456789"[n % 31]).join("")
    try {
      const { email } = await resetPassword(player.id, password)
      setResult({ password, email: email ?? "" })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(result!.password)
    setCopied(true)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div role="dialog" aria-label="Reset password" className="w-full max-w-[420px] rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="truncate text-xl font-bold">Reset {player.username}&apos;s Password</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>
        <div className="grid gap-4 p-5">
          {result ? (
            <>
              <div className="flex items-center gap-1 rounded-md border border-white/10 bg-black/40 py-1.5 pl-3 pr-1.5">
                <code className="flex-1 font-mono text-lg tracking-wider">{shown ? result.password : "•".repeat(result.password.length)}</code>
                <button type="button" aria-label={shown ? "Hide password" : "Show password"} title={shown ? "Hide" : "Show"} onClick={() => setShown(!shown)} className="grid size-8 place-items-center rounded-md text-[#b5a9a9] transition-colors hover:bg-white/10 hover:text-white">
                  <Icon d={shown ? EYE_OFF : EYE} size={18} />
                </button>
                <button type="button" aria-label="Copy password" title={copied ? "Copied" : "Copy"} onClick={copy} className="grid size-8 place-items-center rounded-md text-[#b5a9a9] transition-colors hover:bg-white/10 hover:text-white">
                  <Icon d={copied ? CHECK : COPY} size={18} />
                </button>
              </div>
              <p className="text-sm text-[#9e9393]">Send this to {result.email}</p>
            </>
          ) : (
            <>
              <p className="text-[#d8cfcf]">This gives {player.username} a new temporary password</p>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end">
                <button type="button" onClick={reset} className="secondary-action">
                  Reset
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
