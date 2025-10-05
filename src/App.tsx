import { useEffect, useMemo, useRef, useState } from "react"
import Papa from "papaparse"
import { Rocket, Upload } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import Stars from "@/components/ui/stars"

type Row = Record<string, string | number | null>

function sigmoid(x: number) { return 1 / (1 + Math.exp(-x)) }
function standardize(v: number[], eps = 1e-9) {
  const m = v.reduce((a, b) => a + b, 0) / Math.max(1, v.length)
  const s = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, v.length)) || eps
  return v.map(x => (x - m) / s)
}
function split<T>(arr: T[], testRatio = 0.2) {
  const n = arr.length, k = Math.max(1, Math.floor(n * testRatio))
  const sh = [...arr].sort(() => Math.random() - 0.5)
  return { train: sh.slice(0, n - k), test: sh.slice(n - k) }
}

type PredLabel = "planet" | "candidate" | "fp"
type PerRow = { i: number; prob: number; label: PredLabel }

export default function App() {
  const [rows, setRows] = useState<Row[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [fileName, setFileName] = useState<string>("")

  
  const [target, setTarget] = useState<string>("")
  const [f1, setF1] = useState<string>("")
  const [f2, setF2] = useState<string>("")
  const [f3, setF3] = useState<string>("")

  const [progress, setProgress] = useState(0)
  const [training, setTraining] = useState(false)

  const [perRows, setPerRows] = useState<PerRow[]>([])
  const [resultLabel, setResultLabel] = useState<PredLabel | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)

  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("demo") === "true" && rows.length === 0) {
      fetch("/demo_exoplanets.csv")
        .then(res => res.text())
        .then(text => {
          Papa.parse<Row>(text, {
            header: true, dynamicTyping: true, skipEmptyLines: true,
            complete: (res) => {
              const data = res.data as Row[]
              setRows(data)
              const cols = Object.keys(data[0] || {})
              setColumns(cols)
              setFileName("demo_exoplanets.csv")
              alert("Demo veri yüklendi 🚀")
            }
          })
        })
    }
  }, [])

  
  const fileRef = useRef<HTMLInputElement>(null)
  const handleFile = (file: File | null) => {
    if (!file) return
    setFileName(file.name)
    Papa.parse<Row>(file, {
      header: true, dynamicTyping: true, skipEmptyLines: true,
      complete: (res) => {
        const data = (res.data as Row[]).filter((r) => Object.keys(r).length > 0)
        setRows(data)
        const cols = Object.keys(data[0] || {})
        setColumns(cols)

        
        const lower = cols.map((c) => c.toLowerCase())
        const guessTarget =
          cols[lower.indexOf("label")] ??
          cols[lower.indexOf("y")] ??
          cols.find((c) => /^(class|target|is_.*planet|confirmed)$/i.test(c)) ?? ""
        setTarget(guessTarget || "")

        
        const pref = ["transit_depth","depth_ppm","snr","planet_radius","orbital_period","duration_hours","period"]
        const picked: string[] = []
        for (const g of pref) {
          const i = lower.indexOf(g)
          if (i>=0 && picked.length<3 && cols[i] !== guessTarget) picked.push(cols[i])
        }
        
        if (picked.length < 3) {
          for (const c of cols) {
            if (picked.length >= 3) break
            if (c !== guessTarget && typeof (data[0] as any)?.[c] === "number") {
              if (!picked.includes(c)) picked.push(c)
            }
          }
        }
        setF1(picked[0] || ""); setF2(picked[1] || ""); setF3(picked[2] || "")
      },
      error: (err) => alert("CSV okunamadı: "+err.message),
    })
  }

  const preview = useMemo(() => rows.slice(0, 8), [rows])

  const runPrediction = async () => {
    if (rows.length === 0) return alert("Önce bir CSV yükleyin.")

    
    setTraining(true); setPerRows([]); setResultLabel(null); setConfidence(null)
    setProgress(0)
    const timer = setInterval(()=> setProgress(p => (p>=100 ? 100 : p+3)), 80) // ~3.3s civarı

    try {
      
      const feats = [f1,f2,f3].filter(Boolean)
      if (feats.length < 3) return alert("Sayısal 3 özellik bulunamadı. CSV'de en az üç sayısal sütun gerekli.")

      const X1 = rows.map(r => Number((r as any)[feats[0]]))
      const X2 = rows.map(r => Number((r as any)[feats[1]]))
      const X3 = rows.map(r => Number((r as any)[feats[2]]))

      if ([X1,X2,X3].some(arr => arr.some(v => Number.isNaN(v)))) {
        return alert("Seçili sütunlarda sayısal olmayan değerler var.")
      }

      const z1 = standardize(X1), z2 = standardize(X2), z3 = standardize(X3)


      let w1=0.33, w2=0.33, w3=0.34, bias=0
      const hasTarget = target && rows.every(r => {
        const y = (r as any)[target]
        return y===0 || y===1 || y===null || y===undefined || y===""
      })
      if (hasTarget) {
        const y = rows.map(r => Number((r as any)[target] ?? 0))
        const corr = (a:number[], b:number[])=>{
          const am=a.reduce((s,v)=>s+v,0)/a.length, bm=b.reduce((s,v)=>s+v,0)/b.length
          const num=a.reduce((s,v,i)=>s+(v-am)*(b[i]-bm),0)
          const den=Math.sqrt(a.reduce((s,v)=>s+(v-am)**2,0)*b.reduce((s,v)=>s+(v-bm)**2,0))||1
          return num/den
        }
        w1 = corr(z1,y); w2 = corr(z2,y); w3 = corr(z3,y)
      } else {
        const name = (s:string)=>s.toLowerCase()
        const score = (n:string)=> /depth|ppm/.test(name(n)) ? 0.5 :
                                   /snr/.test(name(n)) ? 0.3 :
                                   /radius|duration|period/.test(name(n)) ? 0.2 : 0.1
        const weights = [score(f1), score(f2), score(f3)]
        const sum = weights.reduce((a,b)=>a+b,0) || 1
        w1 = weights[0]/sum; w2 = weights[1]/sum; w3 = weights[2]/sum
      }

      const probs = z1.map((_,i)=> sigmoid(bias + w1*z1[i] + w2*z2[i] + w3*z3[i]))

      
      const avgProb = probs.reduce((s,p)=>s+p,0)/Math.max(1,probs.length)
      const posRate = probs.filter(p=>p>=0.5).length / Math.max(1,probs.length)
      const conf = Math.max(0, Math.min(1, 0.6*avgProb + 0.4*posRate))
      let label: PredLabel
      if (conf >= 0.70) label = "planet"
      else if (conf >= 0.40) label = "candidate"
      else label = "fp"
      setResultLabel(label); setConfidence(conf)

      const rowsOut: PerRow[] = probs.map((p,i)=>{
        let lab: PredLabel
        if (p >= 0.70) lab = "planet"
        else if (p >= 0.40) lab = "candidate"
        else lab = "fp"
        return { i, prob: p, label: lab }
      })
      setPerRows(rowsOut)
    } finally {
      setTimeout(()=>{
        clearInterval(timer)
        setProgress(100)
        setTraining(false)
      }, 300) 
    }
  }

  return (
    <div className="min-h-screen font-sans bg-space-bg text-slate-100 starfield">
      <Stars />

      {/* HEADER — title güncellendi */}
      <header className="pt-14 pb-4 text-center">
        <div className="inline-flex items-center gap-2">
          <Rocket className="w-6 h-6 text-space-glow drop-shadow" />
          <h1 className="font-display text-[36px] md:text-[44px] tracking-wide">
            The exoplanet is being discovered...
          </h1>
        </div>
        <p className="mt-2 text-slate-300/90 text-base md:text-[18px]">
          Analyze & classify exoplanet transit data — Kepler · K2 · TESS
        </p>
      </header>

      <main className="px-4 pb-24 flex justify-center">
        <div className="w-full max-w-5xl rounded-2xl shadow-glow">
          <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-space.glow via-space.accent to-transparent" />
          <div className="glass rounded-b-2xl p-6 md:p-8 text-slate-100">
            <Card className="w-full shadow-none border-0 bg-transparent">
              <CardContent className="p-0">
                <Tabs defaultValue="upload" className="w-full">
                  {/* Tabs + alt çizgi */}
                  <TabsList className="grid grid-cols-2 mb-6 bg-transparent justify-items-center">
                    {["upload","results"].map((key)=>(
                      <TabsTrigger
                        key={key}
                        value={key}
                        className="relative data-[state=active]:text-white text-slate-300 px-2 py-1 text-[17px] font-semibold
                                   after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-2
                                   after:h-[3px] after:w-0 after:rounded-full after:bg-sky-400
                                   data-[state=active]:after:w-12 transition-[color,after-width]"
                      >
                        {key==="upload" ? "Upload" : "Results"}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* Upload */}
                  <TabsContent value="upload" className="space-y-5">
                    <div className="grid gap-2 place-items-center">
                      <Label htmlFor="file" className="text-[15px] text-slate-300">
                        Upload your exoplanet dataset (CSV)
                      </Label>

                      <input
                        ref={fileRef}
                        id="file"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e)=>handleFile(e.target.files?.[0] ?? null)}
                      />
                      <button
                        type="button"
                        onClick={()=>fileRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-xl px-6 py-3
                                   bg-blue-600 hover:bg-blue-500 active:bg-blue-600
                                   text-white font-semibold shadow-lg shadow-blue-900/30
                                   transition-colors"
                      >
                        <Upload className="w-5 h-5" />
                        <span>Choose File (.csv)</span>
                      </button>

                      {fileName && <p className="text-xs text-slate-300/80 mt-1">Loaded: {fileName}</p>}
                    </div>

                    {/* Önizleme */}
                    {rows.length > 0 && (
                      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
                        <div className="max-h-80 overflow-auto">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-white/10 text-slate-200">
                              <tr>
                                {Object.keys(preview[0] || {}).map((c) => (
                                  <th key={c} className="px-3 py-2 font-medium text-left whitespace-nowrap border-b border-white/10">
                                    {c}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {preview.map((r, i) => (
                                <tr key={i} className="odd:bg-white/0 even:bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                                  {Object.keys(preview[0] || {}).map((c) => {
                                    const v = (r as any)[c]
                                    const isNum = typeof v === "number"
                                    return (
                                      <td key={c} className={`px-3 py-2 border-t border-white/5 ${isNum ? "text-right tabular-nums" : "text-left"} text-slate-100/90`}>
                                        {isNum ? v : String(v ?? "")}
                                      </td>
                                    )
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="px-3 py-2 text-[11px] text-slate-300/80 border-t border-white/10">
                          Gösterilen örnek: ilk {preview.length} satır · Toplam satır: {rows.length}
                        </div>
                      </div>
                    )}

                    {/* Çalıştır butonu ve progress */}
                    <div className="mt-6 flex flex-col items-center gap-3">
                      <button
                        onClick={runPrediction}
                        disabled={training || rows.length===0}
                        className="rounded-xl px-5 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-50"
                      >
                        Run Prediction
                      </button>

                      {/* % ve bar */}
                      <div className="w-full max-w-md">
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-sky-400 transition-[width] duration-80"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Results */}
                  <TabsContent value="results" className="space-y-4">
                    {/* Özet kartı (genel güven ve sınıf) */}
                    {resultLabel && confidence!==null && (
                      <div
                        className={`rounded-xl p-4 border backdrop-blur-sm bg-gradient-to-r
                                    ${resultLabel==="planet"
                                      ? "from-emerald-500/15 to-emerald-500/5 border-emerald-500/30"
                                      : resultLabel==="candidate"
                                      ? "from-amber-500/15 to-amber-500/5 border-amber-500/30"
                                      : "from-rose-500/15 to-rose-500/5 border-rose-500/30"}`}
                      >
                        <p className="text-lg font-semibold">
                          {resultLabel==="planet" && "Gezegen"}
                          {resultLabel==="candidate" && "Aday Gezegen"}
                          {resultLabel==="fp" && "Gezegen Değil"}
                        </p>
                        <p className="text-slate-300">
                          Güven: <span className="font-semibold">{(confidence*100).toFixed(1)}%</span>
                        </p>
                      </div>
                    )}

                    {/* Her satır için sonuç listesi */}
                    {perRows.length > 0 ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                        <div className="max-h-[420px] overflow-auto divide-y divide-white/10">
                          {perRows.map(({i, prob, label}) => (
                            <div key={i} className="flex items-center justify-between px-4 py-2">
                              <div className="text-slate-200">Row #{i+1}</div>
                              <div className="flex items-center gap-4">
                                <span className="text-slate-300 text-sm">{(prob*100).toFixed(1)}%</span>
                                <span className={`px-2 py-1 rounded-md text-sm
                                  ${label==="planet" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                                     label==="candidate" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                                     "bg-rose-500/20 text-rose-300 border border-rose-500/30"}`}
                                >
                                  {label==="planet" ? "Gezegen" : label==="candidate" ? "Aday Gezegen" : "Gezegen Değil"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-slate-300">Önce Upload sekmesinden veri yükleyip “Run Prediction” çalıştırın.</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
