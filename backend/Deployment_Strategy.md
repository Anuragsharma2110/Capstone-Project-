# Capstone Web App: Deployment Strategies

This document outlines the recommended deployment strategies for the Capstone Web application. The project consists of a **Django REST Framework backend**, a **React (Vite) frontend**, a **MySQL database**, and integrates an **SMTP Email System**. 

The strategy is broken down by component, prioritizing scalability, security, and cost-effectiveness.

---

## 1. Frontend Deployment (React / Vite)

The frontend is a static Single Page Application (SPA). It does not require a traditional server to run; it only needs a Content Delivery Network (CDN) to serve the static HTML, CSS, and JS files.

> [!TIP]
> Always build the frontend for production using `npm run build` to ensure the bundle is minified and optimized before deploying.

### Recommended Providers:
*   **Vercel / Netlify:** 
    *   **Pros:** Easiest setup, automatic CI/CD from GitHub, edge caching, free SSL, very generous free tiers.
    *   **Cons:** Less control over underlying infrastructure.
*   **AWS S3 + CloudFront:** 
    *   **Pros:** Enterprise-grade scalability, highly customizable, extremely cheap for low traffic.
    *   **Cons:** Steeper learning curve to configure permissions and CDN invalidations.

**Best Choice:** **Vercel** is highly recommended for this project. It integrates seamlessly with Vite and requires almost zero configuration.

---

## 2. Backend Deployment (Django + DRF)

The Django backend handles API requests, authentication (JWT), and email dispatching. It requires a compute environment capable of running Python and a WSGI/ASGI server (like Gunicorn).

> [!IMPORTANT]
> Ensure that `DEBUG = False` in your `settings.py` for production. You must also securely manage your `SECRET_KEY`, database credentials, and email API keys using environment variables.

### Recommended Providers:
*   **Platform as a Service (PaaS) - Render or Heroku:**
    *   **Pros:** Push-to-deploy, automatic SSL, handles load balancing, easy environment variable management.
    *   **Cons:** Can become expensive as you scale up compute resources.
*   **Containerized (Docker) - AWS ECS / Google Cloud Run / DigitalOcean App Platform:**
    *   **Pros:** Since the project already has a `Dockerfile` and `docker-compose.yml`, deploying containers is very straightforward. It ensures parity between development and production.
    *   **Cons:** Slightly more complex CI/CD pipeline setup.

**Best Choice:** **Render** (using the Docker environment) or **DigitalOcean App Platform**. Since you already have a Dockerfile, both platforms can build and deploy your container directly from your Git repository.

---

## 3. Database Deployment (MySQL)

Your Django application relies on a relational database. Do not use SQLite in production due to concurrency limitations.

> [!CAUTION]
> Never expose your database port (3306) directly to the public internet. Ensure your database is in a Virtual Private Cloud (VPC) and only accepts connections from your backend server.

### Recommended Providers:
*   **Managed Database Services (AWS RDS, DigitalOcean Managed DB, Render PostgreSQL/MySQL):**
    *   **Pros:** Automated daily backups, easy vertical scaling, high availability, point-in-time recovery.
    *   **Cons:** More expensive than hosting the database yourself on a VPS.

**Best Choice:** If using Render or DigitalOcean for the backend, use their native **Managed MySQL/PostgreSQL** offerings to ensure the backend and database are in the same local network, reducing latency and avoiding egress bandwidth costs.

---

## 4. Email System Integration (Crucial)

The application incorporates an email system (for cohort notifications, onboarding, etc.). Sending emails reliably from your own server IP is extremely difficult due to spam filters.

### Recommended Providers:
*   **SendGrid, Postmark, or Mailgun:**
    *   **Why:** These are dedicated Transactional Email APIs. They handle email reputation, bounce management, and DKIM/SPF signing.

### Implementation Strategy:
1.  **Use SMTP or API:** You can continue using Django's standard SMTP backend (`EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'`) configured with SendGrid/Postmark credentials.
2.  **Domain Authentication:** You *must* verify your sending domain (e.g., `@capstone.university.edu`) by adding SPF, DKIM, and DMARC records to your DNS provider. Without this, your system emails will go straight to the users' spam folders.
3.  **Background Tasks:** Currently, sending emails synchronously during an HTTP request (like user provisioning) can cause the request to hang if the email API is slow. 
    > [!TIP]
    > **Future Optimization:** Consider integrating **Celery + Redis** into the backend to handle email dispatching asynchronously in the background.

---

## 5. End-to-End Recommended Architecture

For a robust, modern deployment that balances cost, performance, and developer experience, here is the suggested stack:

| Component | Provider / Technology | Reason |
| :--- | :--- | :--- |
| **Frontend** | Vercel | Automatic CI/CD, global edge caching, free tier. |
| **Backend** | Render (Docker Web Service) | Uses existing Dockerfile, native health checks, easy env vars. |
| **Database** | Render Managed MySQL / PostgreSQL | Keeps DB close to the backend, automatic daily backups. |
| **Emails** | SendGrid or Postmark | High deliverability for transactional system emails. |
| **Media Files** | AWS S3 | (For cohort handbooks/submissions) Django's `django-storages` library should be used to upload files to an S3 bucket instead of the local server disk. |

---

## 6. Pre-Flight Checklist

Before launching, ensure you have:
- [ ] Configured `ALLOWED_HOSTS` in Django to only accept traffic from your frontend domain.
- [ ] Configured `CORS_ALLOWED_ORIGINS` to only allow your Vercel frontend URL.
- [ ] Set `AUTH_COOKIE_SECURE = True` in SimpleJWT settings since production will use HTTPS.
- [ ] Added DNS records (SPF/DKIM) for your email provider.
- [ ] Set up a `.env` file on the production server (never commit this to GitHub).
