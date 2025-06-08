# Deep Tech Week Web App - High Level Architecture

## Overview
This document outlines the proposed architecture for the Deep Tech Week web
application. The app will consolidate events from Luma, allow attendees to
create profiles, message one another, and opt in to matchmaking. The solution
should be modular so future features—such as investor–startup matchmaking and
advanced attendee dashboards—can be added with minimal rework.

## Key Components

1. **Frontend Web App**
   - Built with **React** (e.g., Next.js) for a modern, responsive user
     interface.
   - Presents a calendar view of events pulled from Luma and redirects users to
     Luma for registration.
   - Provides pages for profile management, event details, in-event chat, and
     matchmaking opt-in.
   - Communicates with backend services via a REST/GraphQL API.
   - Receives push notifications via a Web Push service (e.g., Firebase Cloud
     Messaging).

2. **API Gateway / Backend**
   - Exposes REST/GraphQL endpoints for the frontend.
   - Handles authentication (e.g., via Auth0) and authorizes users for profile
     access, messaging, and event data.
   - Orchestrates calls to microservices (user, event, messaging, matchmaking,
     notification).
   - May run as serverless functions (AWS Lambda/Vercel) or a containerized
     Node.js/Express application depending on scale needs.

3. **User Service**
   - Stores user profiles (name, role: startup/investor/engineer/other,
     interests, contact preferences).
   - Supports CRUD operations for profiles.
   - Persists data in a **database** (initially PostgreSQL or MongoDB).

4. **Event Service**
   - Integrates with the **Luma API** to fetch events and attendee lists.
   - Caches event data locally for performance and offline use.
   - Exposes endpoints for retrieving events and attendee information.

5. **Messaging Service**
   - Enables attendees of the same event to send messages to one another.
   - Utilizes **WebSocket** connections for real-time chat.
   - Stores conversation history in the database.

6. **Matchmaking Service**
   - Optional feature users can opt in to.
   - Uses attendee profiles and event context to suggest connections.
   - Could leverage simple rule-based matching initially, with potential for
     machine‑learning-based recommendations in the future.

7. **Notification Service**
   - Allows event organizers to push announcements to attendees via Web Push or
     email.
   - Integrates with frontend clients to display in-app alerts or browser
     notifications.

8. **Admin Dashboard** (Future)
   - Gives organizers insight into attendee lists, sorted by industry or role.
   - Provides tools to trigger push notifications and view engagement metrics.
   - Can be built as an additional frontend linked to existing backend
     services.

## Data Storage

- **Database** (PostgreSQL/MongoDB) for persistent storage of users, cached
  event details, messages, and matchmaking preferences.
- **Redis** (optional) for caching frequent queries and managing WebSocket
  sessions.

## Deployment

- Container-based deployment using **Docker** or serverless via platforms such
  as **Vercel** or **AWS Lambda**.
- CI/CD pipeline to automate testing and deployment.

## Future Extensions

The modular service-based approach allows us to extend the platform easily. New
microservices (e.g., investor–startup matchmaking) or dashboard components can
be added without rewriting existing functionality. The database schema can be
expanded to include industry tags, investment stage, or other relevant fields,
and the messaging and matchmaking services can incorporate these new fields to
provide richer user experiences.

