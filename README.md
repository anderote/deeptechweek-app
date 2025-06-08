# Deep Tech Week App

Node.js backend providing core services for the Deep Tech Week platform.

## Features
- Fetch events from Luma API with caching (`GET /events`) and a simple HTML calendar (`GET /calendar`)
- Retrieve event details and attendees (`GET /events/:id`, `GET /events/:id/attendees`)
- Persistent user profile CRUD (`POST /users`, `GET/PUT /users/:id`)
- Messaging via HTTP and WebSocket (`POST /messages`, `GET /messages/:eventId`, `ws`)
- Matchmaking placeholder (`POST /match`)
- Push notification placeholder (`POST /notify`)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and set `LUMA_API_KEY` if you have one.
3. Start the server (HTTP + WebSocket):
   ```bash
   npm start
   ```
4. Open `http://localhost:3000/calendar` to see events in a browser.
5. A `db.json` file will be created for persistent data.
6. Run the simple test script:
   ```bash
   npm test
   ```
