# Announcement Africa Ltd Backend

This is the Express and MongoDB backend for the Announcement Africa Ltd marketplace project.

Use the root [README.md](/home/tmmethode/projects/ANNOUNCEMENT-AFRICA-LTD/README.md) for the full handover and deployment process. This file only keeps backend-specific notes.

## Responsibilities

- serves `/api/*`
- serves uploaded files from `/uploads/*`
- serves the built frontend in production
- connects to MongoDB
- sends signed contract emails when email env vars are configured

## Setup

```bash
cd backend
cp .env.example .env
npm install
```

Required variables in `backend/.env`:

- `MONGODB_URI`
- `JWT_SECRET`

Common optional variables:

- `PORT`
- `NODE_ENV`
- `FRONTEND_URL`
- `MAX_FILE_SIZE`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `CONTRACT_OWNER_EMAIL`
- `ADMIN_NOTIFICATION_EMAIL`

Optional Google Cloud Storage variables:

- `GCS_BUCKET_NAME`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `GCS_SERVICE_ACCOUNT_JSON`
- `GCS_FOLDER_PREFIX`

## Commands

```bash
npm run dev
npm start
npm run seed
npm run backup:mongodb
npm run restore:mongodb -- ../../backups/mongodb/<timestamp>
```

## Uploaded Files

The active upload directory is:

```text
backend/uploads/
```

The server exposes it at:

```text
/uploads/<type>/<filename>
```

If `backend/uploads/` is missing on a new server, listing images and uploaded user files will break.
