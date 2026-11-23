"use client"

import PasswordResetModal from "@/component/PasswordResetModal"
import ReportModal from "@/component/ReportModal"
import { fetchReports } from "@/service/AdminService"
import type { Report } from "@shared/Report"
import { useEffect, useState } from "react"

export default function ReportList() {
  const [reports, setReports] = useState<Report[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<Report | null>(null)

  useEffect(() => {
    fetchReports()
      .then(setReports)
      .catch((err: Error) => {
        setReports([])
        setError(err.message)
      })
  }, [])

  if (!reports) return null

  return (
    <section className="panel padded">
      {open?.kind === "password_reset" && <PasswordResetModal report={open} onClose={() => setOpen(null)} onDone={() => setReports(reports.map((r) => (r.id === open.id ? { ...r, status: "resolved" } : r)))} />}
      {open && open.kind !== "password_reset" && <ReportModal report={open} onClose={() => setOpen(null)} />}
      <div className="panel-head">
        <h2>Reports</h2>
      </div>

      {error && <p className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {reports.length === 0 && !error ? (
        <p className="py-10 text-center text-sm text-[#9e9393]">No reports yet.</p>
      ) : (
        <ul className="max-h-[480px] overflow-y-auto">
          {reports.map((report) => (
            <li key={report.id} className="border-b border-white/5 last:border-0">
              <button type="button" onClick={() => setOpen(report)} className="flex w-full gap-3 rounded-md px-2 py-3.5 text-left transition-colors hover:bg-white/[.04]">
                <span className="avatar-initial">{(report.username ?? "?")[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium">
                      {report.username ?? "Deleted player"}
                      {report.tableName && <span className="font-normal text-[#9e9393]"> · {report.tableName}</span>}
                      {report.kind === "password_reset" && <span className="font-normal text-[#9e9393]"> · Password reset{report.status === "resolved" && " (done)"}</span>}
                    </span>
                    <small className="whitespace-nowrap">{formatTime(report.createdAt)}</small>
                  </span>
                  <span className="mt-1 line-clamp-2 break-words text-[17px] leading-relaxed text-[#d8cfcf]">{report.body}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function formatTime(date: string) {
  return new Date(date).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}
