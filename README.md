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
