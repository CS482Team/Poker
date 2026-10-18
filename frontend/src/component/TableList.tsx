"use client"

import type { Table } from "@shared/table"
import NewTableForm from "@/component/NewTableForm"
import { getCurrentTableId, setCurrentTableId } from "@/service/currentTableService"
import { fetchTables, joinTable, POLL_INTERVAL_MS } from "@/service/tableService"
import { CURRENT_USER_ID } from "@/service/userService"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

function isTableFull(table: Table) {
  return table.players >= table.maxPlayers
}

function actionLabel(isCurrent: boolean, isFull: boolean) {
  if (isCurrent) return "Return"
  return isFull ? "Full" : "Join"
}

export default function TableList() {
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)

  useEffect(() => {
    const load = () =>
      fetchTables()
        .then((loaded) => {
          setTables(loaded)
          setCurrentId(getCurrentTableId())
          setError(null)
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false))

    load()
    const timer = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  async function enter(table: Table, isCurrent: boolean) {
    try {
      if (!isCurrent) {
        await joinTable(table.id, CURRENT_USER_ID)
        setCurrentTableId(table.id)
      }
      router.push(`/table/${table.id}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">
          Tables <small>{tables.length} tables</small>
        </h1>
        <button type="button" onClick={() => setCreating(true)} className="primary-action">
          New table
        </button>
      </div>

      {creating && <NewTableForm onCancel={() => setCreating(false)} />}

      <div className="panel overflow-hidden">
        <div className="hidden grid-cols-[1.5fr_1fr_.8fr_.7fr_.6fr_220px] gap-4 border-b border-black/60 bg-gradient-to-b from-[#3a3535] to-[#211d1d] px-[22px] py-[15px] text-sm leading-[19px] text-[#b5a9a9] md:grid">
          <span>Table</span>
          <span>Variant</span>
          <span>Ante / Min Bet</span>
          <span>Seats</span>
          <span>Buy In</span>
          <span className="text-right">Actions</span>
        </div>

        {tables.map((table) => {
          const full = isTableFull(table)
          const current = table.id === currentId
          const variant = `${table.variant}` /* TODO need to format */
          const stakes = `$${table.ante} / $${table.minimumBet}`
          const seats = `${table.players}/${table.maxPlayers}`
          return (
            <div key={table.id} className="room-row grid gap-3 border-b border-white/10 px-[22px] py-3.5 last:border-0 md:grid-cols-[1.5fr_1fr_.8fr_.7fr_.6fr_220px] md:items-center md:gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${full ? "bg-[#6b6262]" : "bg-[#6fd099]"}`}/>
                  <strong className="text-base">{table.name}</strong>
                </div>
                <span className="mt-1 block text-sm text-[#b5a9a9] md:hidden"> {variant} · {stakes} · {seats} players</span>
              </div>
              <span className="hidden text-sm text-[#b5a9a9] md:block">{variant}</span>
              <span className="hidden text-sm md:block">{stakes}</span>
              <span className="hidden text-sm text-[#b5a9a9] md:block">{seats} players</span>
              <span className="hidden text-sm md:block">${table.buyIn}</span>
              <div className="flex flex-wrap items-center gap-2 md:flex-row-reverse md:justify-start">
                <button type="button" disabled={full && !current} onClick={() => enter(table, current)} className="secondary-action small min-w-16 disabled:cursor-not-allowed disabled:opacity-40">
                  {actionLabel(current, full)}
                </button>
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="px-6 py-14 text-center">
            <p className="text-sm text-[#a99898]">Loading tables…</p>
          </div>
        )}

        {error && (
          <div className="px-6 py-14 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        
        {!loading && !error && tables.length === 0 && (
          <div className="px-6 py-14 text-center">
            <p className="text-sm text-[#a99898]">No tables yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
