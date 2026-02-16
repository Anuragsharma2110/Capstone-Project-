# Project History

## [2026-02-06] Initial Setup

### Feature: Project Initialization
- **Logic**: Initialized the project structure with a Django backend and React (TypeScript) frontend.
- **Reason**: Setting up the foundation for the Capstone Management Platform.
- **Changes**: Created `feature/user-schema-logins` branch.

### Feature: Schema Implementation
- **Logic**: Implemented Custom User model with roles (Learner, Professor, Admin) and core entities: Cohort, Team, Task, Submission, Evaluation.
- **Reason**: To support the logical interactions defined in the system design.
- **Changes**: 
    - Moved `core` app to root.
    - Configured `AUTH_USER_MODEL`.
    - Created models in `core/models.py`.

### Feature: Authentication System
- **Logic**: Implemented JWT-based authentication with role-based registration.
- **Reason**: To allow Learner, Professor, and Admin to register and login securely.
- **Changes**:
    - Installed `djangorestframework-simplejwt`.
    - Created `serializers.py` for each role.
    - Created `views.py` for registration and login.
    - Configured `core/permissions.py` for access control.
    - Configured URLs in `core/urls.py`.

### Feature: Frontend Implementation
- **Logic**: Created a React app with Login, Register, and Dashboard pages using Context API for Auth state management.
- **Reason**: To provide a user interface for testing the authentication and user roles.
- **Changes**:
    - Initialized Vite + React + TS project.
    - Implemented `AuthContext`.
    - Created `Login`, `Register` (with role selection), `Dashboard` pages.
    - Configured `axios` interceptors for JWT.

### Feature: Structural Refactor
- **Logic**: Moved all backend-related files (`manage.py`, `core/`, etc.) into a dedicated `backend/` subdirectory and moved the virtual environment there.
- **Reason**: To match user expectations and improve project organization.
- **Changes**:
    - Moved `manage.py`, `core/`, and `db.sqlite3` into `backend/`.
    - Created `.venv` inside `backend/`.
    - Updated project structure references.

### Feature: Premium UI Theme Integration
- **Logic**: Implemented a comprehensive design system using Vanilla CSS variables.
- **Reason**: To provide a professional, premium user experience based on the "Capstone Portal" reference.
- **Changes**:
    - Created `frontend/src/index.css` with dark theme design tokens.
    - Built reusable `Card`, `Input`, and `Button` components in `frontend/src/components/ui/`.
    - Created a shared `AuthLayout` for consistent header/footer across auth pages.
    - Updated `Home`, `Login`, and `Dashboard` pages with the new theme.
    - Refactored `LearnerRegister`, `ProfessorRegister`, and `AdminRegister` for visual consistency.
    - Added missing Admin registration card to the `Home` page.
    - Fixed field overflow in registration grids by applying `width: 100%` to inputs.
    - Simplified Login page by removing all registration paths to prevent role confusion.
