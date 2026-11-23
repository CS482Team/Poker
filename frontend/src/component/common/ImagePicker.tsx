"use client"

import Icon, { IMAGE } from "@/component/common/Icon"

export default function ImagePicker({ imageUrl, onChange, className, children }: { imageUrl: string | null; onChange: (imageUrl: string) => void; className: string; children?: React.ReactNode }) {
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onChange(await readImage(file))
  }

  return (
    <label className={`group relative grid cursor-pointer place-items-center overflow-hidden rounded-lg border border-white/10 bg-black/40 text-[#9e9393] transition-colors hover:border-white/30 hover:text-white focus-within:border-white/40 ${imageUrl ? "mx-auto w-fit" : className}`}>
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Preview" className="block max-h-[60vh] max-w-full" />
          <span className="absolute inset-0 grid place-items-center bg-black/60 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">Change image</span>
        </>
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
