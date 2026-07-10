# Capstone Management Platform - Handover Guide

**Version:** 2.0 (Production & Feature Complete)
**Last Updated:** July 10, 2026

---

## 1. Project Overview

The **Capstone Management Platform** is a robust, web-based application designed to streamline the management of capstone projects for Accredian. It facilitates interaction between three key user roles:
- **Learners**: Manage their team formation, submit project tasks, view milestones, and access feedback.
- **Professors**: Create cohorts, assign tasks, evaluate submissions, and manage program timelines.
- **Admins**: Oversee user management, bulk enroll learners via CSV, manage teams (auto-generation and assignment), dispatch credentials via email, and handle system-wide notifications.

This platform has moved beyond its MVP phase and now includes comprehensive functional flows: User Authentication (with JWT), Role-Based Access Control (RBAC), Cohort & Milestone Planning, Advanced Team Management (including bulk CSV uploads and auto-assignment algorithms), Real-time Notifications, and robust Task Submissions.

---

## 2. Environment Setup & Prerequisites

Before running the project, ensure your development environment is set up correctly. This guide covers installation for **Linux (Ubuntu/Debian)**, **Windows**, and **macOS**.

### 2.1. Git (Version Control)
Required to clone the repository.
*   **Linux (Ubuntu)**: `sudo apt update && sudo apt install git`
*   **Windows**: Download and install [Git for Windows](https://git-scm.com/download/win).
*   **macOS**: `brew install git` (requires [Homebrew](https://brew.sh/)).

### 2.2. Docker & Docker Compose (Recommended & Primary)
This is the **preferred** way to run the application in all environments (Dev, Staging, Production). It isolates the backend, frontend, and database into containers.
*   **Linux**:
    1.  Install Docker: `sudo apt install docker.io`
    2.  Install Docker Compose (if not included): `sudo apt install docker-compose-plugin` or `docker-compose`.
*   **Windows**:
    1.  Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
    2.  Ensure WSL 2 (Windows Subsystem for Linux) is enabled during installation.
*   **macOS**:
    1.  Install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/).

### 2.3. Local Environment Scripts (Optional)
If running outside of Docker:
*   **Python**: Version 3.12+ (for Django Backend)
*   **Node.js**: LTS Version 20.x+ (for React Frontend)

---

## 3. Tech Stack & Reasoning

### Backend: Django & Django REST Framework (DRF)
*   **Why?**: Django provides a "batteries-included" approach with a robust ORM, built-in Admin interface, and excellent security features. DRF exposes scalable RESTful APIs.
*   **Database**: MySQL 8.0 (Production-ready relational database).
*   **Authentication**: `djangorestframework-simplejwt` provides stateless JWT (JSON Web Token) authentication stored in HttpOnly cookies, essential for modern SPAs.
*   **Testing**: Python `unittest` framework for core business logic (enrollments, milestones, authentication).

### Frontend: React (Vite) + TypeScript
*   **Why?**: React offers a component-based architecture perfect for dynamic dashboards. Vite provides extremely fast hot-reloading. TypeScript ensures type safety, drastically reducing runtime errors.
*   **Styling**: **Vanilla CSS Modules** (Variables). We utilize a custom, high-end "Premium" design system using CSS variables for theming without relying on heavy frameworks.

---

## 4. Project Structure

```text
Capstone-Management-Platform-MVP/
├── backend/                # Django Backend
│   ├── core/               # Main application logic (models, views, serializers, tests, emails)
│   ├── backend/            # Project configuration (settings.py, urls.py)
│   ├── manage.py           # Django entry point
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Backend container definition
│   ├── Deployment_Strategy.md # Production deployment guidelines
│   └── setup_data.py       # Helper scripts for bootstrapping data
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── api/            # API Client & Axios config
│   │   ├── components/     # Reusable UI (Admin grids, Modals, Planners)
│   │   ├── context/        # Global state (AuthContext)
│   │   ├── pages/          # Page components (Notifications, Admin Dashboards)
│   │   └── App.tsx         # Root component & Routing
│   ├── package.json        # JS dependencies
│   ├── tsconfig.json       # TypeScript configuration
│   └── vite.config.ts      # Vite configuration
├── docker-compose.yml      # Orchestration for DB, Backend, Frontend
├── verify_docker.sh        # Startup verification script
└── .env.template           # Template for required environment variables
```

---

## 5. Configuration Deep Dive

### Backend Configuration (`backend/backend/settings.py`)
*   **`SECRET_KEY`**: A hash used for cryptographic signing. *CHANGE THIS IN PRODUCTION*.
*   **`DEBUG`**: Set to `True` for development. *MUST BE `False` IN PRODUCTION*.
*   **`ALLOWED_HOSTS`**: Defines which domains can serve this app.
*   **`CORS_ALLOWED_ORIGINS`**: Essential for the React frontend to talk to the Backend (e.g., `http://localhost:5173`).
*   **`SIMPLE_JWT`**:
    *   `ACCESS_TOKEN_LIFETIME`: 30 minutes.
    *   `AUTH_COOKIE_HTTP_ONLY`: `True` (Prevents XSS).

### Frontend Configuration
*   **`frontend/vite.config.ts`**: Configures the build tool and dev server.
*   **`frontend/src/api/axios.ts`**: The central networking client with `withCredentials: true` to ensure secure cookie transmission.

---

## 6. Key System Workflows

### Authentication Internals (Dual-Token Pattern)
1.  **Login**: User posts credentials to `/api/auth/login/`. Backend sets `HttpOnly` cookies (`access_token`, `refresh_token`).
2.  **Protected Requests**: Browser automatically attaches the `access_token` cookie.
3.  **Token Refresh**: If the Access Token expires (401), the Axios Interceptor silently requests `/api/auth/refresh/` using the `refresh_token` cookie, sets a new token, and retries the request without logging the user out.

### Team & Cohort Management
*   **Bulk Learner Enrollment**: Admins upload CSVs. The system automatically creates accounts and assigns them to the cohort.
*   **Auto-Generation of Teams**: Algorithms assign unassigned learners to teams evenly or group late-joiners.
*   **Credential Dispatching**: Once teams or learners are generated, the system can bulk-email credentials securely.

### Milestones & Notifications
*   **Milestone Planner**: Professors/Admins can set up sequential milestones for cohorts.
*   **System Notifications**: Real-time broadcast and targeted notifications to cohorts, teams, or specific roles.

---

## 7. API Reference (Key Endpoints)

Base URL: `http://localhost:8000/api`

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/login/` | Login & set cookies | No |
| **POST** | `/auth/refresh/` | Refresh access token | Yes (Refresh Cookie) |
| **GET**  | `/auth/me/` | Get current user details | Yes |
| **POST** | `/cohorts/{id}/upload_learners/` | Bulk enroll learners via CSV | Yes (Admin) |
| **POST** | `/cohorts/{id}/auto_generate_teams/`| Auto-generate teams for cohort | Yes (Admin) |
| **POST** | `/cohorts/{id}/dispatch_credentials_emails/` | Email generated credentials | Yes (Admin) |
| **GET**  | `/notifications/` | Retrieve user notifications | Yes |

---

## 8. Deployment Strategy

A complete deployment strategy is now documented in `backend/Deployment_Strategy.md`. Key considerations for production:
*   Switch from SQLite/Local MySQL to a managed RDS MySQL instance.
*   Implement Nginx/Gunicorn for serving the Django backend securely.
*   Serve the Frontend via a CDN or Nginx container.
*   Enforce HTTPS (TLS/SSL) for all cookie and API transmissions.

---

## 9. Troubleshooting & Common Issues

| Issue | Possible Cause | Solution |
| :--- | :--- | :--- |
| **Docker: Port 3306/8000/5173 occupied** | Another service is using these ports. | Stop other services or change ports in `docker-compose.yml`. |
| **Backend: "Can't connect to MySQL server"** | DB container isn't ready yet. | Wait 30s. Check `docker logs <db-container-id>`. Ensure `.env` matches `docker-compose.yml`. |
| **Frontend: "Network Error" / CORS** | Backend isn't running or CORS config is wrong. | Check `CORS_ALLOWED_ORIGINS` in `settings.py`. Ensure Backend is up. |
| **Login: 401 Unauthorized immediately** | Cookies are blocked or time drift. | Check browser "Block Third Party Cookies" settings. Ensure system time is synced. |
| **"Module not found"** | Missing dependencies. | Run `verify_docker.sh` to cleanly rebuild containers. |

---

**End of Guide**
