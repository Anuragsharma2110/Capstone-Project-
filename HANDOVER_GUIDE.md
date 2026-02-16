# Capstone Management Platform - Handover Guide

**Version:** 1.1 (Expanded)
**Last Updated:** February 13, 2026

---

## 1. Project Overview

The **Capstone Management Platform** is a web-based application designed to streamline the management of capstone projects for Accredian. It facilitates the interaction between three key user roles:
- **Learners**: Manage their team formation, submit project tasks, and view feedback.
- **Professors**: Create cohorts, assign tasks, and evaluate submissions.
- **Admins**: oversee user management and system-wide settings.

This MVP (Minimum Viable Product) focuses on the core functional flows: User Authentication, Role-Based Access Control (RBAC), Team Management, and Task Submission.

---

## 2. Environment Setup & Prerequisites

Before running the project, ensure your development environment is set up correctly. This guide covers installation for **Linux (Ubuntu/Debian)**, **Windows**, and **macOS**.

### 2.1. Git (Version Control)
Required to clone the repository.

*   **Linux (Ubuntu)**: `sudo apt update && sudo apt install git`
*   **Windows**: Download and install [Git for Windows](https://git-scm.com/download/win).
*   **macOS**: `brew install git` (requires [Homebrew](https://brew.sh/)).

### 2.2. Docker & Docker Compose (Recommended)
This is the **preferred** way to run the application as it isolates the backend, frontend, and database in containers.

*   **Linux**:
    1.  Install Docker: `sudo apt install docker.io`
    2.  Start Docker: `sudo systemctl start docker`
    3.  Enable on boot: `sudo systemctl enable docker`
    4.  Add user to group (avoids sudo): `sudo usermod -aG docker $USER` (Log out and back in).
    5.  Install Docker Compose (if not included): `sudo apt install docker-compose-plugin` or `docker-compose`.

*   **Windows**:
    1.  Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
    2.  Ensure WSL 2 (Windows Subsystem for Linux) is enabled during installation for best performance.

*   **macOS**:
    1.  Install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/) (Apple Silicon or Intel chip depending on your machine).

### 2.3. Python (For Local Backend Dev)
Required only if you plan to run the Django backend *outside* of Docker.

*   **Linux**: `sudo apt install python3 python3-pip python3-venv`
*   **Windows**: Download [Python 3.12+](https://www.python.org/downloads/). **Important**: Check "Add Python to PATH" during installation.
*   **macOS**: `brew install python`

### 2.4. Node.js & npm (For Local Frontend Dev)
Required only if you plan to run the React frontend *outside* of Docker.

*   **Linux**:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    ```
*   **Windows**: Download [Node.js (LTS version)](https://nodejs.org/).
*   **macOS**: `brew install node`

---

## 3. Tech Stack & Reasoning

### Backend: Django & Django REST Framework (DRF)
*   **Why?**: We chose Django for its "batteries-included" approach. It provides a robust ORM (Object-Relational Mapping), a built-in Admin interface for easy data management, and excellent security features out of the box. DRF is used to expose RESTful APIs for the frontend.
*   **Database**: MySQL (Production-ready relational database).
*   **Authentication**: `djangorestframework-simplejwt` provides stateless JWT (JSON Web Token) authentication, which is the standard for modern Single Page Applications (SPAs).

### Frontend: React (Vite) + TypeScript
*   **Why?**: React offers a component-based architecture perfect for dynamic dashboards. Vite is used as the build tool for its extremely fast hot-reloading. TypeScript is enforced to ensure type safety, drastically reducing runtime errors.
*   **Styling**: **Vanilla CSS Modules** (Variables). We avoided heavy frameworks like Tailwind to maintain full control over the "Premium" design system, using CSS variables for theming (colors, spacing, typography).

---

## 4. Project Structure

```
Capstone-Management-Platform-MVP/
├── backend/                # Django Backend
│   ├── core/               # Main application logic (models, views, serializers)
│   ├── backend/            # Project configuration (settings.py, urls.py)
│   ├── manage.py           # Django entry point
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend container definition
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── api/            # API Client & Axios config
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Global state (AuthContext)
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Root component & Routing
│   ├── package.json        # JS dependencies
│   ├── tsconfig.json       # TypeScript configuration
│   └── vite.config.ts      # Vite configuration
├── docker/                 # Docker utility scripts/configs
├── docker-compose.yml      # Orchestration for DB, Backend, Frontend
└── .env.example            # Environment variable template
```

---

## 5. Configuration Deep Dive

This section explains the critical configuration files that control the application's behavior.

### Backend Configuration (`backend/backend/settings.py`)
*   **`SECRET_KEY`**: A hash used for cryptographic signing. *CHANGE THIS IN PRODUCTION*.
*   **`DEBUG`**: Set to `True` for development. *MUST BE `False` IN PRODUCTION*.
*   **`ALLOWED_HOSTS`**: Defines which domains can serve this app. Currently set to allow localhost and Docker internal names.
*   **`CORS_ALLOWED_ORIGINS`**: Essential for the React frontend to talk to the Backend. Lists explicitly allowed origins (e.g., `http://localhost:5173`).
*   **`SIMPLE_JWT`**: Configures the JWT behavior.
    *   `ACCESS_TOKEN_LIFETIME`: 30 minutes.
    *   `AUTH_COOKIE`: Name of the cookie storing the access token (`access_token`).
    *   `AUTH_COOKIE_HTTP_ONLY`: `True` (Prevents XSS attacks by hiding the cookie from JavaScript).

### Frontend Configuration
*   **`frontend/vite.config.ts`**: Configures the build tool.
    *   Plugins: Uses `@vitejs/plugin-react` for React support.
    *   Server: Configures the dev server port (default 5173).
*   **`frontend/src/api/axios.ts`**: The central networking client.
    *   `baseURL`: Pulled from environment or defaults to backend URL.
    *   `withCredentials: true`: **Crucial**. Tells the browser to send cookies (session/JWT) with every request.

---

## 6. Authentication Internals

The authentication system uses a **Dual-Token pattern** (Access + Refresh) stored in **HttpOnly Cookies**.

1.  **Login**:
    *   User posts credentials to `/api/auth/login/`.
    *   Backend verifies user.
    *   Backend sets two `HttpOnly` cookies: `access_token` and `refresh_token`.
    *   Backend returns user details (but *not* the tokens in the body).

2.  **Protected Requests**:
    *   React (via `axios`) sends a request.
    *   Browser automatically attaches the `access_token` cookie.
    *   Backend middleware validates the cookie.

3.  **Token Refresh (Auto-Magic)**:
    *   If the Access Token expires, the backend returns `401 Unauthorized`.
    *   The **Axios Interceptor** (`frontend/src/api/axios.ts`) catches this error.
    *   It silently requests `/api/auth/refresh/` using the `refresh_token` cookie.
    *   If successful, the backend sets a *new* `access_token` cookie.
    *   Axios retries the original failed request.
    *   **Result**: The user never gets logged out while active.

---

## 7. API Reference

Base URL: `http://localhost:8000/api`

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/login/` | Login & set cookies | No |
| **POST** | `/auth/register/learner/` | Register a new Learner | No |
| **POST** | `/auth/register/professor/` | Register a new Professor | No |
| **POST** | `/auth/register/admin/` | Register a new Admin | No |
| **POST** | `/auth/refresh/` | Refresh access token | Yes (Refresh Cookie) |
| **GET** | `/auth/me/` | Get current user details | Yes |

*(More endpoints for Teams, Tasks, and Submissions exist in `core/urls.py` but are role-gated)*

---

## 8. File-by-File Guide

A breakdown of file types and specific key files in the repository.

### File Types
*   **`.tsx` (TypeScript JSX)**: React components. Contains HTML-like syntax + logic + types.
*   **`.ts` (TypeScript)**: Pure logic files (helpers, API clients, types interfaces).
*   **`.py` (Python)**: Backend logic.
*   **`.css` (Cascading Style Sheets)**: Styling rules. We use standard CSS, not a preprocessor like SASS.
*   **`.yml` / `.yaml`**: Docker Compose configuration.
*   **`.json`**: Data files or configuration (e.g., `package.json` for deps, `tsconfig.json` for TS compiler settings).

### Key Files Explained

#### Root
*   **`.env`**: Stores secrets (DB password, API keys). **NEVER COMMIT THIS**.
*   **`docker-compose.yml`**: The recipe for spinning up the whole stack. Defines services (`db`, `backend`, `frontend`), networks, and volumes.

#### Backend (`/backend`)
*   **`manage.py`**: The command center for Django. Used to run servers, make migrations, create superusers.
*   **`requirements.txt`**: Lists all python libraries needed (Django, DRF, mysqlclient, etc.).
*   **`backend/settings.py`**: The "Control Panel". Controls DB connections, installed apps, security settings, and middleware.
*   **`core/models.py`**: **The most important file**. Defines the database structure (User, Team, Task tables).
*   **`core/views.py`**: The logic layer. Receives HTTP requests, talks to the DB (via Models), and returns responses.
*   **`core/serializers.py`**: Converts complex Model objects into JSON (serialization) and validates incoming JSON (deserialization).

#### Frontend (`/frontend`)
*   **`package.json`**: The manifest. Lists all npm libraries (React, axios, etc.) and available scripts (`npm run dev`).
*   **`tsconfig.json`**: Tells TypeScript how strict to be (we use "strict" mode).
*   **`vite.config.ts`**: Configures the development server and build process.
*   **`src/main.tsx`**: The entry point. Mounts the React app to the DOM.
*   **`src/App.tsx`**: The main Layout file. Handles Routing (which page to show based on URL).
*   **`src/context/AuthContext.tsx`**: Manages "Who is logged in?". Provides `user` object to all other components.
*   **`src/components/ui/*.tsx`**: Reusable UI bits (Buttons, Inputs, Cards) to ensure consistent design.

---

## 9. Troubleshooting & Common Issues

| Issue | Possible Cause | Solution |
| :--- | :--- | :--- |
| **Docker: Port 3306/8000/5173 occupied** | Another service is using these ports. | Stop other services or change ports in `docker-compose.yml`. |
| **Backend: "Can't connect to MySQL server"** | DB container isn't ready yet. | Wait 30s. Check `docker logs <db-container-id>`. Ensure `.env` matches `docker-compose.yml`. |
| **Frontend: "Network Error" / CORS** | Backend isn't running or CORS config is wrong. | Check `CORS_ALLOWED_ORIGINS` in `settings.py`. Ensure Backend is up. |
| **Login: 401 Unauthorized immediately** | Cookies are blocked or time drift. | Check browser "Block Third Party Cookies" settings. Ensure system time is synced. |
| **"Module not found"** | Missing dependencies. | Run `npm install` (Frontend) or `pip install -r requirements.txt` (Backend). |

---

**End of Guide**
For further questions, refer to the official [Django Documentation](https://docs.djangoproject.com/) or [React Documentation](https://react.dev/).
