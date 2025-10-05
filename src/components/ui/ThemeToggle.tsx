import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
const [dark, setDark] = useState<boolean>(() => {
  const saved = localStorage.getItem("theme")
  if (saved === "light") return false
  return true
})


  useEffect(() => {
    const root = document.documentElement
    if (dark) { root.classList.add("dark"); localStorage.setItem("theme","dark") }
    else { root.classList.remove("dark"); localStorage.setItem("theme","light") }
  }, [dark])

  return (
    <button
      className="fixed right-6 top-6 z-10 rounded-full border border-white/10 bg-white/10 backdrop-blur px-3 py-2 text-white hover:bg-white/20 transition"
      onClick={() => setDark(d => !d)}
      title="Toggle theme"
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
