"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./api/auth"));
const clients_1 = __importDefault(require("./api/clients"));
const products_1 = __importDefault(require("./api/products"));
const reports_1 = __importDefault(require("./api/reports"));
const users_1 = __importDefault(require("./api/users"));
const worksites_1 = __importDefault(require("./api/worksites"));
const ai_1 = __importDefault(require("./api/ai"));
const database_1 = __importDefault(require("./config/database"));
// Load environment variables
if (process.env.NODE_ENV === 'production') {
    dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env.remote') });
}
else {
    dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
}
const app = (0, express_1.default)();
// CORS configuration
const allowedOrigins = [
    'http://localhost:1671',
    'http://localhost:5173',
    'http://termoparotto.micro-cloud.it:16788',
    'http://termoparotto.micro-cloud.it',
    process.env.CLIENT_URL,
].filter(Boolean);
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
};
console.log('Allowed CORS origins:', allowedOrigins);
console.log('Current NODE_ENV:', process.env.NODE_ENV);
console.log('Using CLIENT_URL:', process.env.CLIENT_URL);
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: false, limit: '50mb' }));
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/products', products_1.default);
app.use('/api/users', users_1.default);
app.use('/api/clients', clients_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/worksites', worksites_1.default);
app.use('/api/ai', ai_1.default);
// Enhanced health check endpoint
app.get('/api/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get server uptime
        const uptime = process.uptime();
        const uptimeString = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;
        // Get memory usage
        const memUsage = process.memoryUsage();
        const memUsageMB = {
            rss: Math.round(memUsage.rss / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024)
        };
        // Test database connection
        let dbStatus = 'unknown';
        try {
            const mongoose = require('mongoose');
            if (mongoose.connection.readyState === 1) {
                dbStatus = 'connected';
            }
            else if (mongoose.connection.readyState === 2) {
                dbStatus = 'connecting';
            }
            else if (mongoose.connection.readyState === 3) {
                dbStatus = 'disconnecting';
            }
            else {
                dbStatus = 'disconnected';
            }
        }
        catch (error) {
            dbStatus = 'error';
        }
        const healthData = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: {
                server: '5.0',
                client: '5.0'
            },
            name: 'Termoparotto Server',
            author: {
                name: 'Antonio Guiotto',
                email: 'antonio@palloncino.it'
            },
            environment: process.env.NODE_ENV || 'production',
            uptime: uptimeString,
            uptimeSeconds: Math.floor(uptime),
            memory: memUsageMB,
            database: {
                status: dbStatus,
                type: 'MongoDB'
            },
            deployment: {
                lastCommit: new Date().toISOString(),
                lastDeploy: new Date().toISOString(),
                version: '5.0'
            },
            server: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            }
        };
        res.json(healthData);
    }
    catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Failed to retrieve health information',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Serve static files from client build
app.use(express_1.default.static(path_1.default.join(__dirname, '../../storage-app-client/dist')));
// Catch-all for SPA routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    const indexPath = path_1.default.join(__dirname, '../../storage-app-client/dist/index.html');
    res.sendFile(indexPath, err => {
        if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Error loading application');
        }
    });
});
const PORT = process.env.PORT || 1669;
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, database_1.default)();
            console.log('Connected to MongoDB');
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
                console.log(`Health check: http://localhost:${PORT}/api/health`);
            });
        }
        catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    });
}
startServer();
exports.default = app;
