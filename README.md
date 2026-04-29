# NexusCRM — Full Stack

```
nexuscrm-complete/
├── backend/   → Django REST API (original, untouched)
└── frontend/  → React + Vite frontend (new)
```

## 🚀 Live Demo  
🔗 [Click here to view the project](https://nexuscrm-production.up.railway.app/)

## Quick Start

### Backend (Django)
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your values
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
# → http://localhost:8000
```

### Frontend (React)
```bash
cd frontend
npm install
# For local dev, vite.config.js proxies /api → localhost:8000
npm run dev
# → http://localhost:3000
```

## Production Deployment

| Service | What |
|---|---|
| **Railway** | Django backend (backend/) |
| **Vercel** | React frontend (frontend/) |

Set `VITE_API_URL=https://your-app.railway.app/api` in Vercel env vars.
