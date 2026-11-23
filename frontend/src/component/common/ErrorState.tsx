import Icon, { BACK } from "@/component/common/Icon"
import Link from "next/link"

export default function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="page-shell">
      <h1 className="page-title">{title}</h1>
      <p className="mt-2 text-lg text-[#d8cfcf]">{message}</p>
      <Link href="/dashboard" className="secondary-action mt-6 gap-2">
        <Icon d={BACK} size={18} />
        Lobby
      </Link>
    </div>
  )
}
