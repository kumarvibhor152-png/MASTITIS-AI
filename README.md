# 🐄 Mastitis AI — Pashu Swasthya Dashboard
### Smart India Hackathon 2026 | Problem Statement #109
### AI-Based Predictive Modelling for Early Forecasting of Bovine Mastitis

---

## 🌟 Project Overview

Mastitis AI is a farmer-friendly, multilingual web dashboard that uses Artificial Intelligence to predict the risk of **Bovine Mastitis** early — before symptoms become severe. It empowers Indian dairy farmers with actionable insights to protect their cattle and maximize milk yield.

### Key Features
- 🤖 **AI Risk Prediction** — XGBoost model with 3-tier risk classification (Low/Medium/High)
- 🌐 **10 Indian Languages** — Hindi, English, Marathi, Punjabi, Gujarati, Tamil, Telugu, Bengali, Kannada, Odia
- 📱 **Mobile-First PWA** — Works offline, installable on Android home screen
- 🔐 **OTP Login** — Phone number + SMS OTP (no passwords needed)
- 📊 **Smart Dashboard** — Herd overview, milk trends, economic savings
- 🔔 **Real-time Alerts** — Immediate notifications for high-risk cattle
- 📚 **Pashu Gyaan** — Knowledge base with prevention tips & government schemes

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MastiTrack AI Stack                       │
├──────────────┬──────────────────┬───────────────────────────┤
│  Frontend    │    Backend       │      AI Service           │
│  React+Vite  │  Node.js+Express │  Python FastAPI           │
│  Tailwind    │  MongoDB Atlas   │  XGBoost Model            │
│  Vercel      │  Railway         │  Railway                  │
└──────────────┴──────────────────┴───────────────────────────┘
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB Atlas account (free tier)
  

### 1. Clone & Setup

```bash
git clone <your-repo>
cd mastai-dashboard
```

### 2. AI Service Setup

```bash
cd ai-service
pip3 install -r requirements.txt
python3 generate_and_train.py  # Trains & saves the ML model
uvicorn main:app --reload --port 8000
```

### 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, MSG91 keys
npm run dev
```

### 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed
npm run dev
```

Open http://localhost:5173 🎉

---

## 🌐 Deployment Guide

### Frontend → Vercel (Free)

1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set root directory: `frontend`
4. Add env var: `VITE_API_URL=your-railway-backend-url`
5. Deploy!

### Backend → Railway (Free)

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select `backend` folder
4. Add all env variables from `.env.example`
5. Deploy! Railway auto-detects Node.js

### AI Service → Railway (Free)

1. New service in same Railway project
2. Select `ai-service` folder
3. Add env variables
4. **Important**: Add start command: `python generate_and_train.py && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Deploy!

### Database → MongoDB Atlas (Free)

1. Create account at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free M0 cluster
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (allow all for Railway)
5. Get connection string → add to backend `.env`

---

## 📁 Project Structure

```
mastai-dashboard/
├── frontend/           # React + Vite + Tailwind (Vercel)
│   ├── src/
│   │   ├── pages/      # 9 main pages
│   │   ├── components/ # Reusable components
│   │   ├── locales/    # 10 language JSON files
│   │   ├── store/      # Zustand state management
│   │   └── api/        # API service calls
│   └── package.json
├── backend/            # Node.js + Express (Railway)
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── middleware/     # Auth, validation
│   ├── services/       # OTP service
│   └── server.js
├── ai-service/         # Python FastAPI (Railway)
│   ├── model/          # Trained model files
│   ├── main.py         # FastAPI endpoints
│   ├── generate_and_train.py  # Training script
│   └── requirements.txt
└── README.md
```

---

## 🤖 AI Model Details

### Features Used
| Feature | Type | Description |
|---|---|---|
| milk_yield | Float | Liters per day |
| scc | Integer | Somatic Cell Count |
| body_temp | Float | Temperature in °C |
| conductivity | Float | Milk electrical conductivity (mS/cm) |
| udder_swelling | Boolean | Physical examination result |
| behavior_change | Integer | 0=Normal to 3=Severe |
| days_in_milk | Integer | Current lactation day |
| previous_mastitis | Integer | Historical count |
| quarter_affected | Integer | 0=None, 1-4=Quarter |
| milk_color_score | Integer | 0=Normal to 3=Very abnormal |

### Model Performance
- **Algorithm**: XGBoost Classifier
- **Dataset**: 1,500 synthetic samples (clinically validated parameters)
- **Accuracy**: ~92-95% on test set
- **Output**: Low / Medium / High risk + SHAP explanations

---

## 🌐 API Reference

### Auth Endpoints
```
POST /api/auth/send-otp     { phone: "9876543210" }
POST /api/auth/verify-otp   { phone: "9876543210", otp: "123456" }
GET  /api/auth/me           (requires JWT)
PUT  /api/auth/profile      (requires JWT)
```

### Cattle Endpoints
```
GET    /api/cattle          Get all cattle
POST   /api/cattle          Add new cattle
GET    /api/cattle/:id      Get cattle details
PUT    /api/cattle/:id      Update cattle
DELETE /api/cattle/:id      Delete cattle
```

### Prediction Endpoints
```
POST /api/predictions       Run AI prediction
GET  /api/predictions       Get history
GET  /api/predictions/stats Get analytics data
```

### AI Service Endpoints
```
POST /predict               Single prediction
POST /batch-predict         Multiple predictions
GET  /feature-importance    Model feature weights
GET  /health                Service health check
```

---

## 👥 Team

Built for Smart India Hackathon 2024 | Problem Statement #109

---

## 📄 License

MIT License — Free to use and modify
