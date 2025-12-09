// --- START OF REPLACEMENT CODE ---

import { Application, default as express } from 'express';
import { createServer } from 'http';
import { default as session } from 'express-session';
import { default as connectPgSimple } from 'connect-pg-simple';
import { default as passport } from 'passport';
import { default as cors } from 'cors';
import { resolve } from 'path';

// Note: registerRoutes is production-safe logic for setting up Express routes.
// We will still import it statically, but we will dynamically import Vite-related items.
import { registerRoutes } from './routes.js'; 


// --- TYPE DEFINITIONS (from your original file) ---
declare module 'http' {
  interface IncomingMessage {
    session: any;
    sessionID: string;
  }
}

// --- SERVER SETUP ---
const app: Application = express();
const port: number = parseInt(process.env.PORT || '5000', 10);
const server = createServer(app);

// Use cors in production for security, but allow all origins in development
app.use(cors({
    origin: (app.get('env') === 'production') 
        ? ['https://your-domain.com', 'https://another-domain.com'] // Replace with your actual allowed production domains
        : '*', 
    credentials: true,
}));

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup PostgreSQL Session Store
const PgStore = connectPgSimple(session);
app.use(session({
    store: new PgStore({
        // Assuming your database connection logic is handled elsewhere, 
        // e.g., via a global connection pool or environment variables.
        // Replace 'YOUR_DB_CONNECTION_STRING' with the actual connection details
        conString: process.env.DATABASE_URL, 
        tableName: 'session_table', // Or whatever your session table is named
        createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'fallback_secret', // Use your secret from Secret Manager
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: app.get('env') === 'production', 
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    } 
}));

// Initialize Passport for authentication
app.use(passport.initialize());
app.use(passport.session());


// --- DEVELOPMENT / VITE SETUP (The Critical Fix) ---

if (app.get('env') === 'development') {
    // CRITICAL FIX: Use dynamic imports for Vite and other dev tools
    // These dependencies are only loaded here, avoiding the production crash.
    console.log('Running in Development Mode: Initializing Vite...');
    
    // Dynamically import Vite and its related development dependencies
    const viteModule = await import('vite');
    const preactRenderModule = await import('preact-render-to-string');
    
    // Dynamically import the routes file again to ensure fresh copies/exports
    const devRoutes = await import('./routes.js');

    // Assuming setupVite is the function that initializes the Vite server
    const viteServer = await viteModule.createServer({
        // This should point to your vite.config.ts if it defines the server config
        configFile: resolve(__dirname, '../vite.config.ts'), 
        server: { middleware: app },
    });

    // Use Vite's middleware
    app.use(viteServer.middlewares);
    
    // Register development-only routes (if applicable) and production routes
    devRoutes.registerRoutes(app); 

} else {
    // --- PRODUCTION SETUP (Cloud Run) ---
    console.log('Running in Production Mode: Serving Static Assets...');
    
    // Register production routes (API endpoints)
    registerRoutes(app); 
    
    // Serve production static assets (assuming 'client/dist' is your built folder)
    const staticPath = resolve(__dirname, '../client/dist');
    app.use(express.static(staticPath));

    // Fallback: If no file is found, serve the main index.html for client-side routing
    app.get('*', (req, res) => {
        res.sendFile(resolve(staticPath, 'index.html'));
    });
}

// --- ERROR HANDLING ---
app.use((err: any, req: any, res: any, next: any) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ status: 500, error: 'Internal Server Error' });
});


// --- SERVER START ---
server.listen(port, () => {
    console.log(`✅ Server is serving app on port ${port}`);
    console.log(`Environment: ${app.get('env')}`);
});

// --- END OF REPLACEMENT CODE ---