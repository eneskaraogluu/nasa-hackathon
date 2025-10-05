import { Link } from "react-router-dom"
import { Rocket, BookOpen, Globe2 } from "lucide-react"
import Stars from "@/components/ui/stars"   // ⭐ eklendi

export default function Home() {
  return (
    <div className="min-h-screen font-sans bg-space-bg text-slate-100 starfield relative overflow-hidden">
      {/* Yıldız efekti */}
      <Stars />

      <header className="pt-28 md:pt-36 text-center px-4 relative z-10">
        <div className="inline-flex items-center gap-3 mb-6">
          <Globe2 className="w-10 h-10 text-space-glow drop-shadow" />
          <h1 className="font-display text-4xl md:text-6xl leading-tight tracking-wide">
            A World Away: <span className="text-space-glow">Hunting for Exoplanets</span> with AI
          </h1>
        </div>

        <p className="mt-4 max-w-3xl mx-auto text-slate-300/90 text-base md:text-lg">
          NASA’nın Kepler, K2 ve TESS görevlerinden elde edilen verileri kullanarak ötegezegenleri
          otomatik tespit edin. Verinizi yükleyin, modelimizle analiz edin ve keşfinizi yapın!
        </p>

        {/* BUTONLAR */}
        <div className="mt-10 flex items-center justify-center gap-4 md:gap-6">
          {/* Hemen Başla */}
          <Link
            to="/studio"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 md:px-6 md:py-3.5
                       bg-gradient-to-r from-indigo-500 to-blue-500 text-white
                       shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-blue-400
                       transition-colors"
          >
            <Rocket className="w-5 h-5" />
            <span className="font-medium">Hemen Başla</span>
          </Link>

          {/* Ötegezegen Nedir? */}
          <Link
            to="/info"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 md:px-6 md:py-3.5
                       border border-white/15 bg-white/5 text-white
                       hover:bg-white/10 transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">Ötegezegen Nedir?</span>
          </Link>
        </div>
      </header>
    </div>
  )
}
