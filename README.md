# Capstone Management Platform MVP
A web-based application designed to streamline the management of capstone projects for Accredian. It facilitates interaction between Learners, Professors, and Admins for team formation, task submission, and evaluation.

![MVP Interaction Flow](MVP%20Interaction%20Logic.png)

## Tech Stack

*   **Backend:** Django & Django REST Framework (DRF)
*   **Database:** MySQL
*   **Frontend:** React (Vite) + TypeScript
*   **Styling:** Vanilla CSS Modules
*   **Authentication:** JWT (HttpOnly Cookies)
*   **Infrastructure:** Docker & Docker Compose

## Project Structure

```
Capstone-Management-Platform-MVP/
├── backend/                # Django Backend (API & Business Logic)
├── frontend/               # React Frontend (UI & Client Logic)
├── docker/                 # Docker utility scripts
├── docker-compose.yml      # Orchestration for DB, Backend, Frontend
└── HANDOVER_GUIDE.md       # Detailed project documentation
```

## Quick Start (Docker)

The recommended way to run the application is using Docker.

1.  **Clone the repository.**
2.  **Start the services:**
    ```bash
    docker compose up --build
    ```
    *   Frontend: `http://localhost:5173`
    *   Backend API: `http://localhost:8000/api`

### Docker Mechanics
The `docker-compose.yml` file orchestrates three services:
*   **db**: MySQL 8.0 database.
*   **backend**: Django API, dependent on `db`.
*   **frontend**: React UI, communicates with `backend`.

### Running Only the Database
If you want to run the backend/frontend locally but use Docker for the database:
```bash
docker compose up -d db
```

## Manual Setup

### Backend
1.  Navigate to `backend/`: `cd backend`
2.  **Create and activate a virtual environment (Recommended):**
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies: `pip install -r requirements.txt`
4.  Run migrations: `python manage.py migrate`
5.  Start server: `python manage.py runserver`

### Frontend
1.  Navigate to `frontend/`: `cd frontend`
2.  Install dependencies: `npm install`
3.  Start dev server: `npm run dev`
