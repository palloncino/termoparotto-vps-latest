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
const collections_1 = require("../collections");
const auth_1 = __importDefault(require("../middleware/auth"));
const role_1 = __importDefault(require("../middleware/role"));
const router = express_1.default.Router();
// @route   GET api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'User not authenticated' });
        }
        const user = yield collections_1.User.findById(req.user.id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email } = req.body;
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'User not authenticated' });
        }
        let user = yield collections_1.User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.name = name || user.name;
        user.email = email || user.email;
        yield user.save();
        res.json(user);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   GET api/users/technicians
// @desc    Get all technicians (users)
// @access  Private
router.get('/technicians', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield collections_1.User.find({ role: 'user' }).select('_id name');
        res.json(users);
    }
    catch (err) {
        console.error('Error fetching technicians:', err);
        if (err instanceof Error) {
            res.status(500).json({ error: 'Server Error', details: err.message });
        }
        else {
            res.status(500).json({ error: 'Server Error', details: 'An unknown error occurred' });
        }
    }
}));
// @route   GET api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Or any other number you prefer
        const skip = (page - 1) * limit;
        const filters = {};
        if (req.query.name)
            filters.name = new RegExp(req.query.name, 'i');
        if (req.query.email)
            filters.email = new RegExp(req.query.email, 'i');
        if (req.query.role)
            filters.role = req.query.role;
        const users = yield collections_1.User.find(filters)
            .select('-passwordHash')
            .skip(skip)
            .limit(limit);
        const total = yield collections_1.User.countDocuments(filters);
        res.json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   GET api/users/stats
// @desc    Get user stats
// @access  Private (Admin only)
router.get('/stats', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalUsers = yield collections_1.User.countDocuments();
        const adminUsers = yield collections_1.User.countDocuments({ role: 'admin' });
        const regularUsers = totalUsers - adminUsers;
        res.json({
            total: totalUsers,
            adminCount: adminUsers,
            userCount: regularUsers,
            adminPercentage: Math.round((adminUsers / totalUsers) * 100),
            userPercentage: Math.round((regularUsers / totalUsers) * 100)
        });
    }
    catch (err) {
        console.error('Error fetching user stats:', err);
        res.status(500).send('Server Error');
    }
}));
// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private (Admin only)
router.get('/:id', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield collections_1.User.findById(req.params.id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   PUT api/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/:id', auth_1.default, role_1.default, [
    (0, express_validator_1.body)('name', 'Name is required').optional().not().isEmpty(),
    (0, express_validator_1.body)('email', 'Please include a valid email').optional().isEmail(),
    (0, express_validator_1.body)('role', 'Role must be either admin or user').optional().isIn(['admin', 'user']),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password, role } = req.body;
    try {
        let user = yield collections_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (name)
            user.name = name;
        if (email)
            user.email = email;
        if (role)
            user.role = role;
        if (password) {
            const salt = yield bcryptjs_1.default.genSalt(10);
            user.passwordHash = yield bcryptjs_1.default.hash(password, salt);
        }
        yield user.save();
        res.json(user);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', auth_1.default, role_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield collections_1.User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({ msg: 'User removed' });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
exports.default = router;
