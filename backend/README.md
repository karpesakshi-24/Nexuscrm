# 🚀 NexusCRM — Full-Stack CRM Backend

A production-ready Django REST Framework CRM backend with JWT auth, role-based access, a full sales pipeline, async email, in-app notifications, and interactive API docs.

---

## ✨ What's Included

| Module | Features |
|---|---|
| **Auth** | JWT login/refresh/logout, rate limiting (5 req/min), role-based (Admin/Manager/Agent) |
| **Contacts** | CRUD, search, filters, tags, activity logs, CSV import/export |
| **Tasks** | CRUD, overdue/today/upcoming views, contact link, priority/status filters |
| **Calendar** | Events, attendees, date range filter |
| **Pipeline** | Multi-pipeline, stages, deals, kanban view, win/loss tracking, deal notes |
| **Emails** | Threads, compose, HTML email, async sending (threading), templates with variables |
| **Notifications** | In-app notifications, mark read/all-read, unread count, async creation |
| **Reports** | Dashboard stats, pipeline funnel, monthly revenue, agent leaderboard |
| **API Docs** | Swagger UI + ReDoc auto-generated from code |

---

## ⚡ Quick Start (Local)

### 1. Clone / Unzip the project

```bash
unzip nexuscrm.zip
cd crm_project
```

### 2. Create & activate virtual environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env with your values (EMAIL, SECRET_KEY, etc.)
```

### 5. Run migrations

```bash
python manage.py migrate
```

### 6. Create superuser + default pipeline

```bash
python manage_setup.py
```

This creates:
- **Admin user**: `admin` / `Admin@1234`
- A default sales pipeline with 5 stages

### 7. Start the server

```bash
python manage.py runserver
```

---

## 📚 API Documentation

Once running, visit:

| URL | Description |
|---|---|
| http://localhost:8000/api/docs/ | **Swagger UI** — interactive docs |
| http://localhost:8000/api/redoc/ | **ReDoc** — clean reference docs |
| http://localhost:8000/admin/ | Django Admin panel |

---

## 🔑 Authentication

All endpoints (except register/login) require a Bearer token.

**Login:**
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@1234"
}
```

**Response:**
```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": { "id": 1, "username": "admin", "role": "admin", ... }
}
```

**Use token in subsequent requests:**
```http
Authorization: Bearer eyJ...
```

---

## 📡 Key API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login (rate limited: 5/min) |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| POST | `/api/auth/token/refresh/` | Get new access token |
| GET/PUT | `/api/auth/me/` | View/update own profile |
| POST | `/api/auth/me/change-password/` | Change password |
| GET | `/api/auth/users/` | List all users (Admin only) |

### Contacts
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/contacts/?search=john&status=lead` | List & search contacts |
| POST | `/api/contacts/` | Create contact |
| GET/PUT/DELETE | `/api/contacts/{id}/` | Retrieve/update/delete |
| POST | `/api/contacts/{id}/add_activity/` | Log a call/note/meeting |
| GET | `/api/contacts/export_csv/` | Download CSV |
| POST | `/api/contacts/import_csv/` | Bulk import via CSV |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks/?status=todo&priority=high&contact=5` | Filter tasks |
| POST | `/api/tasks/` | Create task |
| POST | `/api/tasks/{id}/complete/` | Mark complete |
| POST | `/api/tasks/{id}/reopen/` | Reopen task |
| GET | `/api/tasks/overdue/` | Overdue tasks |
| GET | `/api/tasks/today/` | Due today |
| GET | `/api/tasks/upcoming/` | Due in next 7 days |

### Pipeline
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/pipeline/pipelines/` | List pipelines |
| GET | `/api/pipeline/pipelines/{id}/kanban/` | Kanban board view |
| GET | `/api/pipeline/deals/?status=open&pipeline=1` | Filter deals |
| POST | `/api/pipeline/deals/` | Create deal |
| POST | `/api/pipeline/deals/{id}/move_stage/` | Move to a different stage |
| POST | `/api/pipeline/deals/{id}/mark_won/` | Close as won |
| POST | `/api/pipeline/deals/{id}/mark_lost/` | Close as lost |
| POST | `/api/pipeline/deals/{id}/add_note/` | Add deal note |
| GET | `/api/pipeline/deals/summary/` | Deal count & value summary |

### Emails
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/emails/threads/compose/` | Send new email (async) |
| POST | `/api/emails/threads/{id}/send_reply/` | Reply to thread (async) |
| POST | `/api/emails/threads/{id}/mark_read/` | Mark as read |
| GET | `/api/emails/templates/` | List email templates |
| POST | `/api/emails/templates/{id}/preview/` | Preview template with variables |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications/` | All notifications |
| GET | `/api/notifications/?is_read=false` | Unread only |
| GET | `/api/notifications/unread_count/` | Badge count |
| POST | `/api/notifications/{id}/mark_read/` | Mark one read |
| POST | `/api/notifications/mark_all_read/` | Mark all read |
| DELETE | `/api/notifications/{id}/dismiss/` | Dismiss |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/dashboard/` | Contact & task stats |
| GET | `/api/reports/pipeline/` | Pipeline funnel, revenue |
| GET | `/api/reports/agents/` | Per-agent performance (manager+) |

---

## 👥 Roles & Permissions

| Role | Access |
|---|---|
| **Agent** | Own contacts, own tasks, own deals |
| **Manager** | All contacts, all tasks, all deals, all reports |
| **Admin** | Everything + user management |

---

## 🗂️ Project Structure

```
crm_project/
├── accounts/          # Auth, User model, JWT, roles
├── contacts/          # Contacts, Tags, ActivityLog
├── tasks/             # Tasks, CalendarEvents
├── pipeline/          # Pipeline, Stage, Deal, DealNote  ← NEW
├── emails/            # EmailThread, EmailMessage, EmailTemplate
├── notifications/     # Notification model & utils        ← NEW
├── reports/           # Dashboard, pipeline & agent reports
├── crm_backend/       # Settings, URLs, middleware, pagination, exception handler
├── manage.py
├── manage_setup.py    # One-time setup: admin + default pipeline  ← NEW
├── requirements.txt
├── Procfile           # Railway deploy
├── railway.toml       # Railway config
└── .env.example       # Environment variable template
```

---

## 🚂 Deploy to Railway

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial NexusCRM commit"
git remote add origin https://github.com/yourname/nexuscrm.git
git push -u origin main
```

### 2. Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select your repo
3. Add a **PostgreSQL** plugin from the Railway dashboard

### 3. Set environment variables in Railway

```
DJANGO_SECRET_KEY=your-super-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-app.railway.app
CORS_ALLOWED_ORIGINS=https://yourfrontend.vercel.app
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=NexusCRM <noreply@nexuscrm.com>
```

> `DATABASE_URL` is set automatically by Railway's PostgreSQL plugin.

### 4. Deploy

Railway runs the `startCommand` from `railway.toml` automatically:
```
python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn ...
```

Then run the setup script once via Railway's shell:
```bash
python manage_setup.py
```

---

## 📧 Email Setup (Gmail)

1. Enable **2-Factor Authentication** on your Google account
2. Go to **Google Account → Security → App Passwords**
3. Generate an app password for "Mail"
4. Set in `.env`:
   ```
   EMAIL_HOST_USER=your@gmail.com
   EMAIL_HOST_PASSWORD=xxxx-xxxx-xxxx-xxxx
   ```

---

## 🔧 Useful Commands

```bash
# Run development server
python manage.py runserver

# Create a superuser manually
python manage.py createsuperuser

# Make and apply migrations
python manage.py makemigrations
python manage.py migrate

# Export API schema (OpenAPI YAML)
python manage.py spectacular --file schema.yaml

# Collect static files
python manage.py collectstatic
```

---

## 📦 Dependencies

- `Django 4.2` — web framework
- `djangorestframework` — REST API
- `djangorestframework-simplejwt` — JWT auth
- `django-cors-headers` — CORS
- `drf-spectacular` — API docs (Swagger/ReDoc)
- `django-filter` — queryset filtering
- `dj-database-url` — DATABASE_URL support
- `whitenoise` — static file serving
- `gunicorn` — production WSGI server
- `psycopg2-binary` — PostgreSQL driver
- `Pillow` — image uploads

---

## 📝 License

MIT — use freely.
