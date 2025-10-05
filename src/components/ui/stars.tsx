import { useEffect, useRef } from "react"

export default function Stars() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = ref.current!
    const ctx = c.getContext("2d")!
    let w = (c.width = window.innerWidth)
    let h = (c.height = window.innerHeight)

    const onResize = () => {
      w = c.width = window.innerWidth
      h = c.height = window.innerHeight
      init()
    }
    window.addEventListener("resize", onResize)

    type Star = { x:number; y:number; r:number; s:number }
    let stars: Star[] = []
    function init() {
      const count = Math.min(350, Math.floor((w * h) / 6000))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.2,
        s: Math.random() * 0.5 + 0.1,
      }))
    }
    init()

    let raf = 0
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const g = ctx.createRadialGradient(w * 0.7, h * 0.3, 0, w * 0.7, h * 0.3, Math.max(w, h))
      g.addColorStop(0, "rgba(167,139,250,0.10)")
      g.addColorStop(1, "rgba(10,13,26,0)")
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = "rgba(255,255,255,0.9)"
      stars.forEach((st) => {
        ctx.globalAlpha = 0.4 + Math.sin(performance.now() * 0.002 * st.s + st.x) * 0.4
        ctx.beginPath()
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2)
        ctx.fill()
        st.x += st.s * 0.2
        if (st.x > w) st.x = 0
      })
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return <canvas ref={ref} className="fixed inset-0 -z-10" />
}
