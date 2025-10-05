// src/Info.tsx
import Stars from "@/components/ui/stars"

export default function Info() {
  return (
    <div className="min-h-screen font-sans bg-space-bg text-slate-100 starfield relative">
      <Stars />

      <main className="px-4 py-16 flex justify-center relative z-10">
        <div className="w-full max-w-4xl">
          {/* Başlık */}
          <header className="text-center mb-10">
            <h1 className="font-display text-4xl md:text-5xl tracking-wide">
              Ötegezegen <span className="text-space-glow">Nedir?</span>
            </h1>
            <p className="mt-3 text-slate-300/90">
              Ötegezegen (exoplanet), Güneş’ten başka bir yıldızın etrafında dönen gezegendir. 
              1990’lardan beri binlerce ötegezegen keşfedildi ve sayı her yıl artıyor.
            </p>
          </header>

          {/* Özet kutusu */}
          <section className="glass rounded-2xl p-6 md:p-8 mb-8 border border-white/10">
            <h2 className="text-2xl font-semibold mb-3">Neden Önemli?</h2>
            <ul className="list-disc ml-5 space-y-2 text-slate-200/90">
              <li>Gezegen sistemlerinin çeşitliliğini anlamamıza yardım eder: sıcak Jüpiterler, süper-Dünya’lar, mini-Neptünler…</li>
              <li>Yaşanabilir bölgede suyun sıvı kalabileceği dünyalar ararız.</li>
              <li>Atmosferlerinde su buharı, metan, karbondioksit gibi izleri inceleyerek kimyayı ve iklimi çözeriz.</li>
            </ul>
          </section>

          {/* Keşif yöntemleri */}
          <section className="glass rounded-2xl p-6 md:p-8 mb-8 border border-white/10">
            <h2 className="text-2xl font-semibold mb-4">Ötegezegenler Nasıl Keşfedilir?</h2>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                <h3 className="font-semibold mb-1">1) Transit yöntemi</h3>
                <p className="text-slate-300">
                  Gezegen, yıldızının önünden geçtiğinde yıldız ışığında küçük bir azalma (dip) olur. 
                  Işık eğrisindeki bu düşüşün <b>derinliği</b> gezegenin göreli boyutunu, 
                  <b> periyodu</b> (tekrar aralığı) yörünge süresini verir.
                </p>
              </div>

              <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                <h3 className="font-semibold mb-1">2) Radyal hız</h3>
                <p className="text-slate-300">
                  Gezegenin çekimi yıldızda ileri–geri salınım yapar; tayfta Doppler kayması ölçülür. 
                  En az kütleyi ve yörüngeyi çıkarırız. Çoğu zaman transit ile birlikte kullanılır.
                </p>
              </div>

              <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                <h3 className="font-semibold mb-1">3) Doğrudan görüntüleme</h3>
                <p className="text-slate-300">
                  Çok parlak yıldız ışığını bastırıp gezegeni doğrudan görüntülemeye çalışırız. 
                  Uzak ve büyük gezegenlerde daha etkilidir.
                </p>
              </div>

              <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                <h3 className="font-semibold mb-1">4) Mikromercek & astrometri</h3>
                <p className="text-slate-300">
                  Yerçekimsel merceklenme ile uzak olaylarda geçici parlaklaşmalar; 
                  astrometri ile yıldız konumundaki çok küçük salınımlar ölçülür.
                </p>
              </div>
            </div>
          </section>

          {/* Görevler */}
          <section className="glass rounded-2xl p-6 md:p-8 mb-8 border border-white/10">
            <h2 className="text-2xl font-semibold mb-3">Başlıca Uzay Görevleri</h2>
            <ul className="space-y-2 text-slate-300">
              <li><b>Kepler</b>: On binlerce yıldızı yıllarca izleyerek transit yöntemiyle binlerce aday keşfetti; gezegenlerin evrende yaygın olduğunu gösterdi.</li>
              <li><b>K2</b>: Kepler’in ikinci görevi; farklı gökyüzü alanlarını taradı.</li>
              <li><b>TESS</b>: Gökyüzünün büyük kısmını tarayıp yakın ve parlak yıldızlarda transit arıyor; takip gözlemlerine çok uygun hedefler sağlıyor.</li>
              <li><b>JWST</b>: Atmosfer tayflarıyla su buharı, CO<sub>2</sub>, metan gibi molekülleri ölçebiliyor; bulutlar ve ısı dağılımı hakkında bilgi veriyor.</li>
            </ul>
          </section>

          {/* Model/özellik bağlamı */}
          <section className="glass rounded-2xl p-6 md:p-8 mb-8 border border-white/10">
            <h2 className="text-2xl font-semibold mb-3">Veride Sık Görülen Özellikler</h2>
            <ul className="list-disc ml-5 space-y-2 text-slate-200/90">
              <li><b>depth_ppm / transit_depth</b>: Işık düşüşünün derinliği (ppm). Daha büyük gezegen → daha derin transit.</li>
              <li><b>snr</b>: Sinyal-gürültü oranı; tespit güvenirliğini etkiler.</li>
              <li><b>orbital_period / period</b>: Transitlerin aralığı (gün). Yıldızdan uzaklığı ve yörünge dinamiğini anlatır.</li>
              <li><b>duration_hours</b>: Bir transitin süresi; yörünge geometrisine dair ipuçları verir.</li>
              <li><b>confirmed/label</b>: 0/1 hedef sütunu; doğrulanmış gezegen mi?</li>
            </ul>
          </section>

          {/* SSS */}
          <section className="glass rounded-2xl p-6 md:p-8 border border-white/10">
            <h2 className="text-2xl font-semibold mb-3">Sık Sorulanlar</h2>
            <div className="space-y-4 text-slate-300">
              <p><b>Yaşanabilir bölge nedir?</b> Yıldız etrafında suyun sıvı kalabileceği ısı dengesi aralığıdır. Yaşam garantisi değildir; atmosfer ve manyetik alan gibi pek çok etken önemlidir.</p>
              <p><b>“Aday” ile “doğrulanmış” farkı?</b> Adaylar istatistiksel olarak güçlü olsa da henüz kesin değildir. Radyal hız veya bağımsız yöntemlerle doğrulama sonrası “confirmed” olur.</p>
              <p><b>Yapay zekâ ne yapıyor?</b> Işık eğrilerindeki transit benzeri imzaları sınıflandırır, yanlış-pozitifleri (örtüşen ikili yıldızlar, sistematik gürültü) elemekte yardımcı olur.</p>
            </div>
          </section>

          <footer className="text-center text-xs text-slate-400 mt-6">
            Bu sayfa eğitim amaçlı bir özet sunar; görev belgeleri ve yayınlar bilimsel ayrıntılar için başvurulmalıdır.
          </footer>
        </div>
      </main>
    </div>
  )
}
