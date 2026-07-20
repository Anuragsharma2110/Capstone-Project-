# Capstone Management Platform - Codebase Structure & File Overview

This document provides a directory-by-directory breakdown of the codebase, detailing the purpose and functional role of each file in the project.

---

## 1. Backend Codebase Overview (`/backend`)

The backend is built with **Django** and **Django REST Framework (DRF)**.

### 1.1. Root Level Scripts
*   [manage.py](file:///d:/Projects/Capstone/backend/manage.py): Standard Django administrative command-line utility.
*   [setup_data.py](file:///d:/Projects/Capstone/backend/setup_data.py): Seeds initial database records. Creates the default admin superuser (`admin`/`admin`), a sample Capstone Program, and a sample Cohort.
*   [provision_test_learners.py](file:///d:/Projects/Capstone/backend/provision_test_learners.py): Seeds mock students from the test CSV file into the database with a default password of `Welcome123!`.
*   [reset_passwords.py](file:///d:/Projects/Capstone/backend/reset_passwords.py): Development utility to batch reset all user passwords to `Welcome123!`.
*   [smoke_test_team_creds.py](file:///d:/Projects/Capstone/backend/smoke_test_team_creds.py): Verifies team password generation formatting and models.
*   [test_auth_script.py](file:///d:/Projects/Capstone/backend/test_auth_script.py): Validates backend authentication logic and email/username resolution.
*   [test_login_http.py](file:///d:/Projects/Capstone/backend/test_login_http.py): Sanity check script for API endpoint authentication.
*   [check_stats.py](file:///d:/Projects/Capstone/backend/check_stats.py): Utility to query and count records in the database.

### 1.2. Core App Core Logic (`/backend/core`)
*   [models.py](file:///d:/Projects/Capstone/backend/core/models.py): Defines the relational database models:
    *   `User`: Extended abstract user supporting roles (`LEARNER`, `PROFESSOR`, `ADMIN`).
    *   `Program` & `Cohort`: Organizes educational programs and cohorts.
    *   `CohortMembership` & `TeamMember`: Manages student rosters and team assignments.
    *   `Team`: Holds team identifiers and the shared team account credentials hook.
    *   `Task`, `Submission` & `Evaluation`: Houses project milestones, team uploads, and grade reviews.
    *   `Notification` & `NotificationRead`: Tracks global and targeted message broadcasts.
    *   `CohortMilestone`: Sequential planning milestones.
*   [urls.py](file:///d:/Projects/Capstone/backend/core/urls.py): Maps the REST API endpoints and registers viewset routes.
*   [permissions.py](file:///d:/Projects/Capstone/backend/core/permissions.py): Custom DRF permission classes enforcing role-based access control (RBAC).
*   [authentication.py](file:///d:/Projects/Capstone/backend/core/authentication.py): Extends JWT authentication to read tokens securely from HttpOnly browser cookies.
*   [authentication_backends.py](file:///d:/Projects/Capstone/backend/core/authentication_backends.py): Case-insensitive custom auth backend resolving user lookups by either email or username.
*   [emails.py](file:///d:/Projects/Capstone/backend/core/emails.py): Builds and dispatches HTML-formatted email credentials to team members.
*   [admin.py](file:///d:/Projects/Capstone/backend/core/admin.py): Registers backend database models with the standard Django Admin interface.

### 1.3. API Layer (`/backend/core/api`)
*   **Serializers (`/serializers`):**
    *   [auth.py](file:///d:/Projects/Capstone/backend/core/api/serializers/auth.py): Serializers for user registration inputs.
    *   [core.py](file:///d:/Projects/Capstone/backend/core/api/serializers/core.py): Serializers converting core models (Cohorts, Teams, Tasks, etc.) into structured JSON payloads.
*   **Views (`/views`):**
    *   [auth.py](file:///d:/Projects/Capstone/backend/core/api/views/auth.py): Implements registration views for roles, login (cookie injection), logout (cookie clearing), and password adjustments.
    *   [users.py](file:///d:/Projects/Capstone/backend/core/api/views/users.py): User retrieval and query views.
    *   [core.py](file:///d:/Projects/Capstone/backend/core/api/views/core.py): The main business viewset logic containing custom actions for CSV processing, team partition generators, late-joiner scheduling, and handbook files.

---

## 2. Frontend Codebase Overview (`/frontend`)

The frontend is a single-page application built with **React**, **TypeScript**, and **Vite**.

### 2.1. Configurations & Entry Points
*   [main.tsx](file:///d:/Projects/Capstone/frontend/src/main.tsx): React application mount point.
*   [App.tsx](file:///d:/Projects/Capstone/frontend/src/App.tsx): Root layout mapping out public and private pages, routing structures, and route permissions.
*   [types.ts](file:///d:/Projects/Capstone/frontend/src/types.ts): Shared TypeScript interfaces representing backend models.
*   [index.css](file:///d:/Projects/Capstone/frontend/src/index.css): Baseline global styles, CSS resets, and system variables for the dark/light UI.

### 2.2. API Client (`/frontend/src/api`)
*   [axios.ts](file:///d:/Projects/Capstone/frontend/src/api/axios.ts): Custom configured HTTP client specifying the base URL, enabling cookies (`withCredentials: true`), and hosting interceptors for silent token refreshes.

### 2.3. Context Providers (`/frontend/src/context`)
*   [AuthContext.tsx](file:///d:/Projects/Capstone/frontend/src/context/AuthContext.tsx): Context managing login requests, authentication state, current user roles, and logout cleanses.
*   [ThemeContext.tsx](file:///d:/Projects/Capstone/frontend/src/context/ThemeContext.tsx): Manages user preference tracking and toggling for Light/Dark modes.

### 2.4. Core UI Components (`/frontend/src/components`)
*   [ProtectedRoute.tsx](file:///d:/Projects/Capstone/frontend/src/components/ProtectedRoute.tsx): Route filter restricting page render based on authentication status and user roles.
*   **Administrative UI Components (`/components/admin`):**
    *   [Sidebar.tsx](file:///d:/Projects/Capstone/frontend/src/components/admin/Sidebar.tsx): Admin navigation panel.
    *   [Header.tsx](file:///d:/Projects/Capstone/frontend/src/components/admin/Header.tsx): Top header containing user summary and theme toggles.
    *   [TeamsManagement.tsx](file:///d:/Projects/Capstone/frontend/src/components/admin/TeamsManagement.tsx): Interface for team operations (creation, auto-generation, credential dispatching).
    *   [LearnerRoster.tsx](file:///d:/Projects/Capstone/frontend/src/components/admin/LearnerRoster.tsx): Displays student roster, bulk uploads, and access permissions.
    *   [CohortMilestonePlanner.tsx](file:///d:/Projects/Capstone/frontend/src/components/admin/CohortMilestonePlanner.tsx): Interface for setting up milestone timelines.

### 2.5. Pages (`/frontend/src/pages`)
*   [Login.tsx](file:///d:/Projects/Capstone/frontend/src/pages/Login.tsx): The unified portal login page.
*   [Dashboard.tsx](file:///d:/Projects/Capstone/frontend/src/pages/Dashboard.tsx): The home dashboard page redirecting users based on their active role.
*   [Submissions.tsx](file:///d:/Projects/Capstone/frontend/src/pages/Submissions.tsx): Student page for uploading project files or providing repo links.
*   [Feedback.tsx](file:///d:/Projects/Capstone/frontend/src/pages/Feedback.tsx): Allows learners to view milestone scores and evaluation notes.
*   [WeeklyMode.tsx](file:///d:/Projects/Capstone/frontend/src/pages/WeeklyMode.tsx): Interface for teams to submit weekly text updates and blockers.
*   [ProfessorSubmissions.tsx](file:///d:/Projects/Capstone/frontend/src/pages/ProfessorSubmissions.tsx) & [ProfessorSubmissionReview.tsx](file:///d:/Projects/Capstone/frontend/src/pages/ProfessorSubmissionReview.tsx): Pages for professors to review team deliverables and submit milestone evaluations.
*   [AdminCohortDetails.tsx](file:///d:/Projects/Capstone/frontend/src/pages/AdminCohortDetails.tsx): Centralized portal page containing stats, roster lists, teams management, and cohort configuration controls.
