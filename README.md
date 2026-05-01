# Announcement Africa Ltd Marketplace

This repository contains the Announcement Africa Ltd web application and API. It is a React frontend served by an Express backend, with MongoDB as the main database.

This README is written as a handover guide for the next person who will deploy or maintain the project.

## What Is In This Repo

- `src/`: React frontend
- `backend/`: Express API, MongoDB models, upload handling
- `backend/uploads/`: active uploaded files used by the app
- `build/`: current frontend production build output

## Important Handover Notes

- Uploaded files that were previously stored on Google Cloud have already been restored into `backend/uploads/`.
- The backend serves these files from `/uploads/*`, so `backend/uploads/` must be kept when deploying or moving the project.
- MongoDB is still the source of truth for listings, users, jobs, signed contracts, and related data.
- A repo-native MongoDB backup script is included in this handover so future backups can be created without relying on `mongodump`.

## Prerequisites

- Node.js 18+
- npm
- Access to the MongoDB database configured in `backend/.env`

## Environment Files

### Frontend

Create a root `.env` only if you need to override the API URL during frontend development.

```bash
cp .env.example .env
```

Available frontend variable:

- `REACT_APP_API_URL`: optional explicit API base URL. In local development the frontend already falls back to `http://localhost:5000`.

### Backend

Create the backend env file before starting the API:

```bash
cp backend/.env.example backend/.env
```

Required backend variables:

- `MONGODB_URI`
- `JWT_SECRET`

Common backend variables:

- `PORT`
- `NODE_ENV`
- `FRONTEND_URL`
- `MAX_FILE_SIZE`
- email variables for signed contract notifications

Optional backend variables:

- `GCS_BUCKET_NAME`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `GCS_SERVICE_ACCOUNT_JSON`
- `GCS_FOLDER_PREFIX`

Google Cloud Storage is optional now. The application can run fully from local files in `backend/uploads/`.

## First-Time Setup

1. Install root dependencies:

```bash
npm install
```

2. Install backend dependencies if needed separately:

```bash
npm --prefix backend install
```

3. Create environment files:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

4. Edit `backend/.env` with the real MongoDB URI, JWT secret, and email settings if contract emails should work.

5. Confirm the uploaded assets are present:

```bash
find backend/uploads -maxdepth 2 -type d
```

You should see folders such as `houses`, `cars`, `plots`, and `profiles`.

## Running The Project

### Development

Run frontend and backend together:

```bash
npm run dev
```

This starts:

- frontend on `http://localhost:3000`
- backend on `http://localhost:5000`

If you only need one side:

```bash
npm run dev:frontend
npm run dev:backend
```

### Production

This project is designed to serve the built React app from the Express backend on one origin.

1. Build the frontend:

```bash
npm run build
```

2. Start the backend:

```bash
npm run start:prod
```

3. Verify the API:

```bash
curl http://localhost:5000/api/health
```

The backend serves:

- frontend assets from `build/`
- API routes from `/api/*`
- uploaded files from `/uploads/*`

## Deploy Checklist

Before calling the deployment complete, confirm all of the following:

- `backend/.env` is present with the correct production values
- `backend/uploads/` is present on the server
- MongoDB is reachable from the deployed server
- `npm run build` completed successfully
- `http://<server>/api/health` returns `status: OK`
- opening a listing in the browser loads its images correctly from `/uploads/...`

## Uploaded Files Guidance

The application expects uploaded files to exist under:

```text
backend/uploads/
```

Examples:

- `backend/uploads/houses/...`
- `backend/uploads/cars/...`
- `backend/uploads/plots/...`
- `backend/uploads/profiles/...`

The API exposes that directory here:

```text
/uploads/<type>/<filename>
```

That means:

- if you move the project to another server, copy `backend/uploads/` with it
- if you back up the server, include `backend/uploads/`
- if you restore the project on a fresh machine, restore `backend/uploads/` before starting production

If someone still has the old backup archive that originally lived under `files/buyandsell/uploads`, its contents belong inside `backend/uploads/` with the same folder structure.

## MongoDB Backup And Restore

### Create a backup

Run:

```bash
npm run backup:mongodb
```

This writes a timestamped export into:

```text
backups/mongodb/<timestamp>/
```

Each backup folder contains:

- one JSON file per collection
- `metadata.json` with collection counts and backup timestamp

Latest backup already created for this handover:

- `backups/mongodb/2026-05-01T15-06-41-644Z/`

### Restore a backup

To restore a backup folder into the configured database:

```bash
npm run restore:mongodb -- backups/mongodb/<timestamp>
```

Notes:

- restore is upsert-based by `_id`
- it recreates or updates documents from the backup
- it does not automatically delete documents that exist in the target database but not in the backup
- if you need an exact clone, restore into a clean database

## Useful Commands

```bash
npm run dev
npm run build
npm run start:prod
npm run backup:mongodb
npm run restore:mongodb -- backups/mongodb/<timestamp>
```

## Backend Reference

Backend-specific notes are in [backend/README.md](/home/tmmethode/projects/ANNOUNCEMENT-AFRICA-LTD/backend/README.md).
