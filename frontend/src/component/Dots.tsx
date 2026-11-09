"use client"

import { useEffect, useState } from "react"

export default function Dots() {
  const [count, setCount] = useState(1)

  useEffect(() => {
    const timer = setInterval(() => setCount((n) => (n % 3) + 1), 500)
    return () => clearInterval(timer)
  }, [])

  return <span className="inline-block w-[1.2em] text-left">{".".repeat(count)}</span>
}
