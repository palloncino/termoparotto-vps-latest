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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const collections_1 = require("../collections");
const emailService_1 = require("../services/emailService");
const router = express_1.default.Router();
// @route   POST api/auth/register
// @desc    Register user (requires admin approval)
// @access  Public
router.post('/register', [
    (0, express_validator_1.body)('name', 'Name is required').not().isEmpty(),
    (0, express_validator_1.body)('email', 'Please include a valid email').isEmail(),
    (0, express_validator_1.body)('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    (0, express_validator_1.body)('role', 'Role must be either admin or user').isIn(['admin', 'user']),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password, role } = req.body;
    try {
        let user = yield collections_1.User.findOne({ email });
        if (user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
        }
        user = new collections_1.User({
            name,
            email,
            role,
            passwordHash: yield bcryptjs_1.default.hash(password, 10),
            status: 'pending', // Default status
        });
        yield user.save();
        // Invia notifica email all'admin
        try {
            const adminUser = yield collections_1.User.findOne({ role: 'admin', status: 'approved' });
            if (adminUser && adminUser.email) {
                yield (0, emailService_1.sendAdminNotification)(adminUser.email, { name, email });
            }
        }
        catch (emailError) {
            console.error('Errore invio email notifica:', emailError);
            // Non bloccare la registrazione se l'email fallisce
        }
        res.json({
            message: 'Registration successful. Your account is pending admin approval. You will receive an email when approved.'
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}));
// @route   POST api/auth/login
// @desc    Authenticate user & get token (only approved users)
// @access  Public
router.post('/login', [
    (0, express_validator_1.body)('email', 'Please include a valid email').isEmail(),
    (0, express_validator_1.body)('password', 'Password is required').exists(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        let user = yield collections_1.User.findOne({ email });
        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }
        // Verifica che l'utente sia approvato
        if (user.status !== 'approved') {
            return res.status(403).json({
                errors: [{
                        msg: user.status === 'pending'
                            ? 'Account pending approval. Please wait for admin approval.'
                            : 'Account has been rejected. Contact administrator.'
                    }]
            });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }
        const payload = { user };
        jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err)
                throw err;
            res.json({ token, user });
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}));
// @route   GET api/auth/status
// @desc    Check user registration status
// @access  Public
router.get('/status/:email', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield collections_1.User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            status: user.status,
            message: user.status === 'pending'
                ? 'Account pending approval'
                : user.status === 'approved'
                    ? 'Account approved'
                    : 'Account rejected'
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}));
exports.default = router;
