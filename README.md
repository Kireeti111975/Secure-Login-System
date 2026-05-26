# Secure Login System (Full-Stack Authentication)

A highly polished, modern, and minimal full-stack authentication system focusing strictly on security best practices, clean light-themed design, and a production-ready containerized pipeline.

## 🚀 Key Security Implementations

This system goes far beyond elementary tutorials to include production-level security measures:

1. **Cryptographic Storage (bcryptjs)**: Passwords are encrypted server-side using multiple digest rounds (`genSalt(12)`) before being written to persistence. Plain text is never stored in any form.
2. **Two-Factor Authentication (TOTP)**: Built-in support for standard authenticators (Google Authenticator, Microsoft Authenticator, Authy).
   - Generates dynamic, authenticated QR Code graphics via Vector charts.
   - Saves Base32 secrets. Supports prompt and rollback cycles to prevent users locking their profiles on failed registrations.
   - Forces dual-step authorization challenge steps when 2FA is active.
3. **Session Cookies (HTTP-only & Secure)**: JWT session tokens are enclosed within `httpOnly`, `sameSite: "lax"`, and conditionally `secure` cookies. Scripts cannot read these containers, locking out cross-site scripting (XSS) extraction.
4. **Brute Force Defense**: Real-time logging of failed credential matching. If an identity experiences 5 consecutive mismatches, the database locks the account for 15 minutes, neutralizing automated dictionaries and brute-force sweeps.
5. **Helmet & CORS Protections**: Integrated security headers including X-Content-Type, frameguard clickjacking defenses, and highly specific CSP rules mapped between Vite development environments and production outputs.
6. **Authentication Rate Limiting**: Global request limiting enforced on registration, login, and token validation handlers.
7. **Timing-Attack Protection**: Standard dummy hashing compares to defend against execution timing analysis, preventing hackers from discovering registered emails through backend latency.

---

## 📂 Project Architecture

```
├── .data/               # Persistent atomic database storage (Simulated MongoDB)
├── server/
│   ├── controllers/     # MVC Authentication, Logout, & 2FA handlers
│   ├── middlewares/     # Authentication filters & Rate limit controllers
│   ├── routes/          # Express REST API specifications
│   └── db.ts            # Atomic file storage database engine (behaves like Mongoose)
├── src/
│   ├── components/      # Modular frontend UI pages (Login, Register, Dashboard, Verification)
│   ├── App.tsx          # Session orchestrator and client-side page loader
│   ├── index.css        # Color schemes & custom fonts mapping
│   └── main.tsx         # React bootstrap hooks
├── server.ts            # Main application setup integrating Vite middleware
├── metadata.json        # Unified app details
└── package.json         # Package requirements & bundle commands
```

---

## 🛠️ Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (installed automatically with Node)

---

### Step 1: Install Dependencies
Run the following terminal command from the workspace directory:
```bash
npm install
```

---

### Step 2: Configure Environment Variables
Copy and rename the template `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Provide your custom values if desired:
- `JWT_SECRET`: A long secure private phrase for verifying JSON Web Tokens.
- `NODE_ENV`: Set to `development` or `production`. Under `production`, cookies will explicitly enforce HTTPS contexts.

---

### Step 3: Run the Development Server
Power up the combined full-stack hot-reloading development environment:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live dashboard!

---

### Step 4: Build for Production
To bundle, minify, and package the frontend while compiling the Express server into a highly optimized, flat CommonJS output:
```bash
npm run build
```

---

### Step 5: Start Production Server
Launch the compiled, self-contained system on port 3000:
```bash
npm run start
```
