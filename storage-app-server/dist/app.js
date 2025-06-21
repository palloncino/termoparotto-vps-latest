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
const users_1 = __importDefault(require("./api/users")); // Adjust the import path as needed
const worksites_1 = __importDefault(require("./api/worksites")); // Import the worksite routes
const database_1 = __importDefault(require("./config/database")); // import { initDatabase } from './seeds';
// import { initDatabase } from './seeds';
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
    process.env.CLIENT_URL,
].filter(Boolean); // This removes any undefined or null values
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
console.log('Allowed CORS origins:', allowedOrigins);
console.log('Current NODE_ENV:', process.env.NODE_ENV);
console.log('Using CLIENT_URL:', process.env.CLIENT_URL);
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: false, limit: '50mb' }));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/products', products_1.default);
app.use('/api/users', users_1.default);
app.use('/api/clients', clients_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/worksites', worksites_1.default); // Use the worksite routes
// Serve static files from the client dist folder
app.use(express_1.default.static(path_1.default.join(__dirname, '../../storage-app-client/dist')));
// Catch-all for any other route: serve index.html for your SPA
app.get('*', (req, res) => {
    res.sendFile(path_1.default.resolve(__dirname, '../../storage-app-client/dist', 'index.html'));
});
const PORT = process.env.PORT || 1669;
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, database_1.default)();
            console.log('Connected to MongoDB');
            // if (process.env.NODE_ENV === 'development') {
            //   await initDatabase();
            //   console.log('Database initialized with seed data');
            // }
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
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
