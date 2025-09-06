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
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const collections_1 = require("../collections");
const auth_1 = __importDefault(require("../middleware/auth"));
const role_1 = __importDefault(require("../middleware/role"));
const router = express_1.default.Router();
// Place this route BEFORE any routes with :id parameter
router.get('/count', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const count = yield collections_1.Client.countDocuments();
        res.json({ count });
    }
    catch (err) {
        console.error('Error fetching client count:', err);
        res.status(500).send('Server Error');
    }
}));
// Add this route BEFORE any routes with :id parameter
router.get('/stats', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const count = yield collections_1.Client.countDocuments();
        res.json({ count });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   POST api/clients
// @desc    Create a new client
// @access  Private
router.post('/', auth_1.default, role_1.default, [
    (0, express_validator_1.body)('name', 'Name is required').not().isEmpty(),
    (0, express_validator_1.body)('address', 'Address is required').not().isEmpty(),
    (0, express_validator_1.body)('contact_info', 'Contact information is required').not().isEmpty(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const newClient = new collections_1.Client(req.body);
        const savedClient = yield newClient.save();
        res.json(savedClient);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   GET api/clients
// @desc    Get all clients
// @access  Private
router.get('/', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Or any other number you prefer
        const skip = (page - 1) * limit;
        const filters = {};
        if (req.query.name)
            filters.name = new RegExp(req.query.name, 'i');
        if (req.query.address)
            filters.address = new RegExp(req.query.address, 'i');
        if (req.query.contact_info)
            filters.contact_info = new RegExp(req.query.contact_info, 'i');
        const clients = yield collections_1.Client.find(filters).skip(skip).limit(limit);
        const total = yield collections_1.Client.countDocuments(filters);
        res.json({
            clients,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   GET api/clients/:id
// @desc    Get client by ID
// @access  Private
router.get('/:id', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = yield collections_1.Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }
        res.json(client);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   PUT api/clients/:id
// @desc    Update client
// @access  Private
router.put('/:id', auth_1.default, role_1.default, [
    (0, express_validator_1.body)('name', 'Name is required').optional().not().isEmpty(),
    (0, express_validator_1.body)('address', 'Address is required').optional().not().isEmpty(),
    (0, express_validator_1.body)('contact_info', 'Contact information is required')
        .optional()
        .not()
        .isEmpty(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const client = yield collections_1.Client.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }
        res.json(client);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   DELETE api/clients/:id
// @desc    Delete client
// @access  Private
router.delete('/:id', auth_1.default, role_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = yield collections_1.Client.findByIdAndDelete(req.params.id);
        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }
        res.json({ msg: 'Client removed' });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
exports.default = router;
