# Secure File Transfer

A simple website for sending files to a friend, classmate, or coworker. The uploaded Stitch screens are used as the visual design. Registration, login, sending, receiving, expiration, and history are real.

The complicated parts (passwords, file protection, secure links, expiration, and cleanup) happen in the background. The screens stay simple.

## What you need

- Node.js 20 or newer
- MySQL 8 (a local service such as **MySQL80** is enough)

If MySQL root already has a password, put it in `.env` as `DB_PASSWORD`. The first setup attempt in this workspace failed with `Access denied for user 'root'@'localhost'` until that password is set.

## 1. Configure the environment

From the project root:

```bash
copy .env.example .env
```

On macOS/Linux use `cp .env.example .env`.

Edit `.env`:

- `DB_USER` and `DB_PASSWORD` for your MySQL account
- `JWT_SECRET` — any long random string
- `KEY_WRAP_SECRET` — 64 hex characters (32 bytes)

Create `KEY_WRAP_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Do not commit `.env`.

## 2. Create the database

```bash
cd server
npm install
npm run db:init
```

This creates the `secure_file_transfer` database and tables.

Optional: start MySQL with Docker from the project root:

```bash
docker compose up -d
```

Then set `DB_PORT=3307` and `DB_PASSWORD=rootpassword` in `.env` if you use the included Compose file (it uses port 3307 so it does not clash with a local MySQL already on 3306).

## 3. Run the app

Terminal 1 — backend:

```bash
cd server
npm run dev
```

Terminal 2 — frontend:

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Test with two accounts

Create any two accounts on the Register page. Every registered account can send and receive files; there are no fixed sender or receiver accounts.

1. Register a first account
2. Register a second account
3. Log in as the sender
4. Choose a file on Home
5. Continue, enter the second account's email, choose an expiration time, and send
6. Copy the secure link
7. Log out, then log in as the receiver
8. Open Receive File, paste the link, and open the file
9. View or download it
10. Check Profile → Received Files
11. Wait until the file expires (use 10 minutes, or a 1-minute custom duration)
12. Confirm the file can no longer be downloaded
13. Confirm the history row is still in Profile, marked Expired

## How it works, in plain language

- The sender chooses a file, a registered receiver or a unique access code, and how long the file should stay available.
- The file is protected in the browser before it is uploaded.
- An unregistered recipient enters the private access code on the public Receive page.
- Access codes are stored as hashes and expire with the file.
- When the time is up, the server refuses access and deletes the temporary file.
- Profile history stays in MySQL even after the file is gone.

The UI does not show internal security details.

## Project layout

- `client/` — React app matching the Stitch screens
- `server/` — Express API, MySQL, expiration cleanup
- `server/sql/schema.sql` — database tables

## File size

The Home screen keeps the original Stitch copy (“Files up to 5 GB supported”). In this local app, files are limited to 50 MB so the browser can protect them in memory. Larger files show a simple error.
