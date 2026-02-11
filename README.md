# Full Stack Project: Django REST Framework + Next.js

This project contains a backend powered by Python Django REST Framework and a frontend built with Next.js (TypeScript, App Router).

---

## Backend: Django REST Framework

### Requirements
- Python 3.10+
- pip

### Setup
1. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install django djangorestframework
   ```
3. Start the Django project and API app (if not already present):
   ```bash
   django-admin startproject backend_project .
   python manage.py startapp api
   ```
4. Add `'rest_framework'` and `'api'` to `INSTALLED_APPS` in `backend_project/settings.py`.
5. Run migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the development server:
   ```bash
   python manage.py runserver
   ```

### File Overview
- **manage.py**: Django's command-line utility.
- **backend_project/**: Project settings and configuration.
  - **settings.py**: Main config.
  - **urls.py**: Root URL routing.
  - **wsgi.py/asgi.py**: Server entry points.
- **api/**: Main app for API logic.
  - **models.py**: Database models.
  - **views.py**: API endpoints.
  - **serializers.py**: Model-to-JSON conversion.
  - **admin.py**: Admin registration.
  - **migrations/**: Database migration files.

---

## Frontend: Next.js

### Requirements
- Node.js 20.9.0+
- npm or yarn

### Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### File Overview
- **package.json**: Project dependencies and scripts.
- **tsconfig.json**: TypeScript config.
- **next.config.ts**: Next.js config.
- **/app**: Main application folder (App Router).
  - **layout.tsx**: Root layout.
  - **page.tsx**: Main page.
  - **globals.css**: Global styles.
- **/public**: Static assets.

---

## Connecting Frontend and Backend
- Use `fetch` or `axios` in Next.js to call Django REST API endpoints (e.g., `http://localhost:8000/api/`).
- For production, configure CORS and environment variables as needed.

---

## Project Structure
- `backend/`: Django REST Framework API
- `frontend/`: Next.js app

---

For more, see the Django and Next.js documentation.
