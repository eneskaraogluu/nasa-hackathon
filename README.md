# 🪐 A World Away: Yapay Zekâ ile Ötegezegen Avı

> **NASA Space Apps Challenge 2025**  
> Görev: [A World Away – Hunting for Exoplanets with AI](https://www.spaceappschallenge.org/2025/challenges/a-world-away-hunting-for-exoplanets-with-ai/)  
> Takım: **Enes Karaoğlu & Takım Arkadaşları**

---

## 🌌 Proje Hakkında

**“A World Away”** görevinin amacı, **yapay zekâ** kullanarak **ötegezegenleri (exoplanet)** tespit etmektir — yani Güneş Sistemi dışındaki yıldızların etrafında dönen gezegenleri keşfetmek.

Bu proje, **Kepler** ve **TESS** görevlerinden elde edilen ışık eğrisi (light curve) verilerini analiz ederek, olası gezegen geçişlerini belirleyen **makine öğrenimi tabanlı bir web platformu** geliştirmeyi amaçlar.  

Uygulama iki katmandan oluşur:  
- **Backend (FastAPI)** → Yapay zekâ modeliyle tahmin yapan API.  
- **Frontend (React + TypeScript)** → Kullanıcıların veri yükleyip sonucu görselleştirebildiği arayüz.

---

## 🚀 Projenin Özellikleri

✅ **Yapay zekâ tabanlı tespit** – Kepler ve TESS verileriyle eğitilmiş rastgele orman (Random Forest) modelleri.  
✅ **Etkileşimli web arayüzü** – React, TypeScript ve TailwindCSS ile geliştirilmiş modern UI.  
✅ **Gerçek zamanlı API** – FastAPI altyapısı sayesinde hızlı tahmin ve veri iletişimi.  
✅ **Veri görselleştirme** – Model sonuçlarını ve güven oranlarını kullanıcıya grafiklerle sunar.  
✅ **Modüler mimari** – Frontend ve backend tamamen ayrı çalışabilir şekilde tasarlanmıştır.

---

## 🧠 Mimari Yapı

```
root/
│
├── backend/
│   ├── server.py                   # FastAPI sunucusu (AI tahmin API’si)
│   ├── flexible_exoplanet_model.pkl # Genel model
│   ├── random_forest_kepler_model.pkl
│   ├── tess_random_forest_model.pkl
│   ├── kepler_X_aligned.csv        # Eğitim verisi
│   ├── requirements.txt            # Python bağımlılıkları
│
├── src/                            # Frontend (React + TypeScript)
│   ├── components/
│   ├── pages/
│   ├── App.tsx
│   ├── main.tsx
│
├── public/                         # Statik dosyalar
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## ⚙️ Kurulum ve Çalıştırma

### 🖥️ Frontend (React + Vite)
```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

### 🧩 Backend (FastAPI + ML)
```bash
cd backend

# Sanal ortam oluştur
python -m venv .venv
source .venv/Scripts/activate   # Windows için
# veya
source .venv/bin/activate       # macOS / Linux için

# Gerekli kütüphaneleri yükle
pip install -r requirements.txt

# API sunucusunu başlat
python server.py
```

---

## 🧬 Yapay Zekâ Modelleri

| Model Dosyası | Açıklama |
|---------------|-----------|
| `random_forest_kepler_model.pkl` | Kepler verileriyle eğitilmiş model |
| `tess_random_forest_model.pkl` | TESS verileriyle eğitilmiş model |
| `flexible_exoplanet_model.pkl` | Genel amaçlı birleşik model |
| `kepler_X_aligned.csv` | Ön işlenmiş eğitim verisi |

Modeller, yıldız parlaklığındaki değişimleri analiz ederek olası gezegen geçişlerini tahmin eden **Random Forest Sınıflandırıcıları** kullanır.

---

## 💻 Arayüz (Frontend)

- **Kullanılan teknolojiler:** React, TypeScript, TailwindCSS, Vite  
- **Özellikler:**
  - Veri yükleme ve tahmin isteği gönderme  
  - API’den gelen sonuçların gerçek zamanlı gösterimi  
  - Model güven oranlarının görselleştirilmesi  

---

## 🌍 Teknoloji Yığını

| Katman | Teknolojiler |
|--------|---------------|
| **Frontend** | React, TypeScript, TailwindCSS, Vite |
| **Backend** | FastAPI, Python |
| **Yapay Zekâ** | scikit-learn, pandas, joblib, numpy |
| **Dağıtım** | (opsiyonel) Render, Vercel veya Hugging Face Spaces |

---

## 🧩 API Kullanım Örneği

```python
POST /predict
Content-Type: application/json

{
  "flux_values": [0.98, 1.01, 0.97, 1.02, ...]
}
```

**Yanıt:**
```json
{
  "prediction": "Exoplanet Detected",
  "confidence": 0.93
}
```

---

## 🎯 Gelecek Geliştirmeler

- Daha yüksek doğruluk için **derin öğrenme (CNN / LSTM)** entegrasyonu  
- **Grafiksel ışık eğrisi** gösterimleri (Plotly, Chart.js)  
- **Kullanıcı verisi yükleme** özelliğiyle topluluk modeli oluşturma  
- Projenin **bulut ortamında dağıtımı** (NASA uyumlu bulut servisi)

---

## 👥 Takım ve Katkılar

| Üye | Rol | Sorumluluk |
|------|-----|-------------|
| **Enes Karaoğlu** | AI & Full Stack Developer | Backend modeli, API ve arayüz geliştirme |
| Zehra Nur Bayav | Veri Bilimci | Model eğitimi ve veri ön işleme |
| Resul Ekrem Altıntaş| Frontend Geliştirici | Arayüz ve kullanıcı deneyimi tasarımı |
| Elif Gülneva Kara| Sunum hazırlama | Arayüz ve kullanıcı deneyimi tasarımı |

---

## 📜 Lisans

Bu proje **MIT Lisansı** ile açık kaynak olarak paylaşılmıştır.  
İsteyen herkes kodu inceleyebilir, düzenleyebilir ve geliştirebilir.

---

## 🪐 Teşekkürler

- **NASA Exoplanet Archive**  
- **Kepler ve TESS görevleri**  
- **NASA Space Apps Challenge ekibi**

> “Sadece gezegenleri bulmuyoruz — hayal gücünün ötesinde dünyaları keşfediyoruz.”

---


