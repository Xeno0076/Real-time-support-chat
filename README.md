# Real-Time Customer Support Chat Platform

A portfolio-quality, full-stack customer support platform featuring bi-directional, real-time messaging between customers and support agents with zero page reloads.

Built with **React**, **Node.js**, **Express**, **Socket.IO**, **MongoDB (Mongoose)**, **JWT**, and **Tailwind CSS**.

---

## Features

### Real-Time Communication (Socket.IO)
- **Live Bi-Directional Messaging**: Instant messaging without page reloads using Socket.IO room namespaces (`conversation:${id}`).
- **Typing Indicators**: Real-time broadcasts notify parties when someone is actively typing.
- **Connection Presence**: Live indicator reflects active WebSocket connection status.
- **Auto-Scroll & Unread Tracking**: Message threads automatically scroll to new incoming messages.

### Customer Portal
- **Ticket Submission**: Create support inquiries with subject, category (*Account*, *Billing*, *Technical Support*, *General*, *Other*), and initial message.
- **Conversation Management**: View conversation history, filter by status (*Open*, *In Progress*, *Resolved*, *Closed*), and search by subject.
- **Dedicated Chat Room**: Direct communication channel with assigned support agents.

### Support Agent Command Center
- **Live Ticket Queue**: Monitor all customer tickets with real-time updates as tickets are created or modified.
- **Ticket Claiming ("Assign to Me")**: Claim unassigned open inquiries with a single click.
- **Status Controls**: Update conversation status directly (*Open*, *In Progress*, *Resolved*, *Closed*).
- **Performance Analytics**: Real-time metrics tracking *Active Chats*, *Open Inquiries*, *Resolved Today*, and *Average Response Time*.

### Authentication & Security
- **JWT Authentication**: Secure stateless token issuance verified via HTTP `Authorization: Bearer <token>` headers and Socket.IO handshake auth.
- **Password Hashing**: `bcryptjs` encryption for all stored credentials.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `customer` and `agent` roles.

### Resilient Data Layer
- **Mongoose Models**: Full document schemas for `User`, `Conversation`, and `Message`.
- **Hybrid Storage Adapter**: Connects to external MongoDB via `MONGODB_URI` or seamlessly falls back to an embedded in-process database for local development and preview environments.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Tailwind CSS, Lucide React |
| **Real-Time** | Socket.IO (Client & Server) |
| **Backend** | Node.js, Express.js (REST API + WebSocket Server) |
| **Database** | MongoDB, Mongoose ODM (with in-memory fallback store) |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs |

---

## Project Structure

```text
├── server.ts                       # Unified Express + Vite dev & production server
├── server/
│   ├── config/
│   │   ├── db.ts                   # MongoDB connection & fallback store bootstrap
│   │   └── seed.ts                 # Demo customer & agent seeding
│   ├── controllers/
│   │   ├── authController.ts       # Register, login, /me, demo-login
│   │   ├── conversationController.ts # CRUD, ticket assignment, status updates, stats
│   │   └── messageController.ts    # Fetch & post conversation messages
│   ├── middleware/
│   │   └── auth.ts                 # JWT verification & role authorization middleware
│   ├── models/
│   │   ├── User.ts                 # Mongoose User schema & TypeScript interfaces
│   │   ├── Conversation.ts         # Mongoose Conversation schema
│   │   ├── Message.ts              # Mongoose Message schema
│   │   └── dbStore.ts              # Unified Mongo / in-memory repository adapter
│   ├── routes/
│   │   ├── authRoutes.ts           # /api/auth routes
│   │   └── conversationRoutes.ts   # /api/conversations routes
│   └── sockets/
│       └── chatSocket.ts           # Socket.IO handlers (rooms, messaging, typing)
├── src/
│   ├── components/
│   │   ├── Badges.tsx              # Status & Category badges
│   │   ├── Navbar.tsx              # Responsive navigation & role indicators
│   │   ├── NewConversationModal.tsx # Customer ticket creation modal
│   │   └── ProtectedRoute.tsx      # Role-based route guard
│   ├── context/
│   │   ├── AuthContext.tsx         # User state, login, register, logout
│   │   └── SocketContext.tsx       # Socket.IO lifecycle & event dispatchers
│   ├── pages/
│   │   ├── LandingPage.tsx         # Welcome landing page with feature highlights
│   │   ├── LoginPage.tsx           # Authentication with 1-click demo logins
│   │   ├── RegisterPage.tsx        # Customer account registration
│   │   ├── CustomerDashboard.tsx   # Customer ticket overview & stats
│   │   ├── CustomerConversations.tsx # Customer ticket list & filtering
│   │   ├── ChatPage.tsx            # Customer real-time chat interface
│   │   ├── AgentDashboard.tsx      # Agent queue, metrics, & quick actions
│   │   ├── AgentConversations.tsx  # Agent ticket manager & search
│   │   └── AgentChatPage.tsx       # Agent live response & resolution console
│   ├── services/
│   │   └── api.ts                  # Axios HTTP client with JWT interceptor
│   ├── types.ts                    # Shared TypeScript types & interfaces
│   ├── App.tsx                     # Route declarations
│   └── main.tsx                    # React application entry point
├── .env.example                    # Environment variable documentation
└── package.json                    # Dependencies and scripts
```

---

## Getting Started

### Prerequisites
- Node.js 18+ installed
- (Optional) MongoDB local or MongoDB Atlas connection string

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` (optional; default mock values are used automatically if not provided):
```bash
cp .env.example .env
```

Available variables:
- `MONGODB_URI`: MongoDB connection string (defaults to `mongodb://localhost:27017/support_chat`). If MongoDB is not running, an in-memory database store is used automatically.
- `JWT_SECRET`: Secret key used to sign authentication tokens.
- `PORT`: Server port (default `3000`).

### 3. Running the Application
```bash
# Start development server (runs Express API + Vite on port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit `http://localhost:3000` in your browser.

---

## Demo Credentials

The platform comes pre-seeded with accounts for immediate testing:

| Role | Email | Password |
|---|---|---|
| **Support Agent** | `agent@support.com` | `password123` |
| **Customer** | `alex@customer.com` | `password123` |
| **Customer 2** | `david@customer.com` | `password123` |

> **Tip**: Use the **"Demo Customer"** and **"Demo Agent"** buttons on the Login page for 1-click access. Open two different browser tabs (or an incognito window) to chat live between Customer and Agent!

---

## API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new customer account
- `POST /api/auth/login` — Sign in and receive a JWT token
- `POST /api/auth/demo-login` — Instant demo login by role (`customer` or `agent`)
- `GET /api/auth/me` — Retrieve currently authenticated user profile

### Conversations
- `GET /api/conversations` — List conversations (role-scoped, supports `?status`, `?category`, `?search`)
- `GET /api/conversations/stats` — Retrieve agent metrics (Active chats, Open, Resolved, SLA)
- `GET /api/conversations/:id` — Get single conversation details
- `POST /api/conversations` — Create a new conversation (Customer)
- `PATCH /api/conversations/:id/status` — Update status (`Open`, `In Progress`, `Resolved`, `Closed`)
- `PATCH /api/conversations/:id/assign` — Assign conversation to agent (Agent only)

### Messages
- `GET /api/conversations/:id/messages` — Retrieve message history for a conversation
- `POST /api/conversations/:id/messages` — Send a message in a conversation

---

## Socket.IO Real-Time Events

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `join_conversation` | Client → Server | `conversationId` | Join room for real-time conversation updates |
| `leave_conversation`| Client → Server | `conversationId` | Leave conversation room |
| `send_message` | Client → Server | `{ conversationId, message }` | Send a new message via WebSocket |
| `new_message` | Server → Client | `Message` object | Broadcast newly created message to room |
| `typing_start` | Client → Server | `{ conversationId }` | Notify room that user started typing |
| `typing_stop` | Client → Server | `{ conversationId }` | Notify room that user stopped typing |
| `user_typing` | Server → Client | `{ conversationId, userId, userName }` | Broadcast typing state to room |
| `user_stopped_typing` | Server → Client | `{ conversationId, userId }` | Broadcast stopped typing to room |
| `conversation_updated` | Server → Client | `Conversation` object | Broadcast status/assignment changes |

---

## Author

Manish Kapil

Full Stack Web Developer

Intern ID - CITS2551
