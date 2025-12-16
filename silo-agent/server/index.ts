console.log("🔥 SERVER ENTRYPOINT LOADED");

import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

// ---------- App bootstrap ----------
const app = express();
const PORT = Number(process.env.PORT) || 8080;

// ---------- Type extensions ----------
declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      role: string;
    }
  }
}

declare module "http" {
  interface IncomingMessage {
    rawBody?: unknown;
  }
}

// ---------- Middleware ----------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "tudao-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  })
);

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return done(null, false, { message: "Invalid credentials" });
      }

      return done(null, {
        id: user.id,
        username: user.username,
        role: user.role,
      });
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user: any, done) => done(null, user.id));

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) return done(null, false);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(passport.initialize());
app.use(passport.session());

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

// ---------- Health check ----------
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

// ---------- Logging ----------
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
});

// ---------- Routes ----------
registerRoutes(app).catch((err) => {
  console.error("❌ Route registration failed", err);
  process.exit(1);
});

// ---------- Error handler (DO NOT THROW) ----------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ UNHANDLED ERROR", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// ---------- Static / Vite ----------
if (process.env.NODE_ENV === "development") {
  setupVite(app).catch((err) => {
    console.error("❌ Vite setup failed", err);
    process.exit(1);
  });
} else {
  serveStatic(app);
}

// ---------- START SERVER (CRITICAL) ----------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server listening on ${PORT}`);
});

