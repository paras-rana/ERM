# ERM

Standalone Enterprise Risk Management application.

## Structure

```text
ERM/
  api/
  web/
  infra/
    ERM/
      docker-compose.yml
```

## Local Run

1. Start Postgres:

```powershell
cd infra\ERM
docker compose up -d
```

2. Configure the API:

Create `api/.env` from `api/.env.example`.

3. Start the API:

```powershell
cd api
npm install
npm run start:dev
```

4. Start the frontend:

```powershell
cd web
npm install
npm run dev
```

## Default Local Addresses

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`
- Database: `localhost:5432` (`erm`)
- Login: `http://localhost:5173/login`

## Access And Roles

The API seeds a default Admin user on startup when the users table is empty:

- Email: `admin@riskapp.local`
- Password: `Admin123!`

These defaults can be overridden with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` in the API environment.

Supported roles:

- `Admin`: full application access, including User Management.
- `Super User`: full application access except User Management.

Admins can manage users from the User Management page at `/users`. New users require full name, email, password, and a role assignment.

## Current Features

- Risk dashboard with matrix, category, and department summary visuals.
- Risk register and risk detail pages with inherent and residual risk views.
- Mitigation and assessment tracking for each risk.
- Admin-only user management with user creation and existing-user table view.
