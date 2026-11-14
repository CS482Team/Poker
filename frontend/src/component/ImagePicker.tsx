"use client"

import Icon, { IMAGE } from "@/component/Icon"

export default function ImagePicker({ imageUrl, onChange, className, children }: { imageUrl: string | null; onChange: (imageUrl: string) => void; className: string; children?: React.ReactNode }) {
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onChange(await readImage(file))
  }

  return (
    <label className={`grid cursor-pointer place-items-center overflow-hidden rounded-lg border border-white/10 bg-black/40 text-[#9e9393] transition-colors hover:border-white/30 hover:text-white ${className}`}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="Preview" className="size-full object-cover" />
      ) : (
        <span className="flex flex-col items-center gap-1.5 text-sm">
          <Icon d={IMAGE} size={20} />
          {children}
        </span>
      )}
      <input type="file" accept="image/*" aria-label="Image" onChange={pick} className="sr-only" />
    </label>
  )
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}
