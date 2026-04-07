# AI-Powered Market Trend & Consumer Sentiment Forecaster

A modern, full-stack AI SaaS platform that analyzes consumer reviews using **RAG (Retrieval-Augmented Generation)**, **Sentiment Analysis**, and **Topic Clustering** to provide deep market intelligence.

---

## 🚀 Features

- **Insights Assistant (RAG)**: Chat with your data! Uses Google Gemini API and ChromaDB to answer complex questions based on thousands of consumer reviews.
- **Sentiment Distribution**: Real-time visualization of Positive, Neutral, and Negative consumer feedback.
- **Topic Clustering**: Automatically identifies key conversation drivers (e.g., "Battery Life", "Camera Quality") using BERT-based topic modeling.
- **Dynamic Dashboard**: Interactive charts and data visualizations powered by Recharts.
- **Persistent History**: Chat threads and user activity are securely persisted via Supabase.
- **Production Ready**: Full error handling, API rate-limit retries, and relative path configurations.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **AI Engine**: Google Generative AI (Gemini 1.5 Flash)
- **Vector Database**: ChromaDB (Local Persistent Storage)
- **Data Science**: Pandas, Sentence-Transformers
- **Server**: Uvicorn

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS (Dark Mode Aesthetic)
- **Icons**: Lucide-React
- **Charts**: Recharts
- **Auth & Database**: Supabase

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Python 3.9+
- Node.js 18+
- A Google AI Studio API Key (for Gemini)
- A Supabase Project (for Auth & History)

### 2. Clone the Repository
```bash
git clone https://github.com/punyapavanannapureddy/Ai_sentiment_analysis.git
cd MarketTrend
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Or 'source venv/bin/activate' on Mac/Linux
pip install -r requirements.txt
```

**Create `backend/.env`:**
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

**Create `frontend/.env`:**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🏃 Running the Application

### Start the Backend
```bash
cd backend
uvicorn main:app --reload
```
*The database will automatically initialize and ingest provided CSV data on the first startup.*

### Start the Frontend
```bash
cd frontend
npm run dev
```
*Access the dashboard at `http://localhost:5173`.*

---

## 📁 Project Structure

```text
MarketTrend/
├── backend/
│   ├── data/                 # Raw/Cleaned CSV datasets
│   ├── rag/                  # RAG logic & ChromaDB store
│   ├── pipeline/             # NLP analysis & predictions
│   ├── main.py               # FastAPI router & logic
│   ├── init_db.py            # Automatic DB initializer
│   └── chroma_db/            # Local vector storage
├── frontend/
│   ├── src/
│   │   ├── pages/            # Dashboard, RAG, Profile, etc.
│   │   ├── components/       # Reusable UI widgets
│   │   └── services/         # API & Supabase clients
│   └── tailwind.config.js    # Design system config
└── README.md
```

---

## 🛡️ Security Note
All environment variables are protected. Ensure that `.env` files are added to `.gitignore` before pushing to public repositories.

## 📄 License
MIT License - Developed by Punya Pavan Annapureddy.
