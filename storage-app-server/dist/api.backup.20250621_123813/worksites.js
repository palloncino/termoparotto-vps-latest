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
const collections_1 = require("../collections");
const auth_1 = __importDefault(require("../middleware/auth"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// @route   GET api/worksites/stats
// @desc    Get worksite statistics
// @access  Private
router.get('/stats', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalWorksites = yield collections_1.Worksite.countDocuments();
        const activeWorksites = yield collections_1.Worksite.countDocuments({ is_active: true });
        const inactiveWorksites = yield collections_1.Worksite.countDocuments({ is_active: false });
        res.json({
            totalWorksites,
            activeWorksites,
            inactiveWorksites
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   GET api/worksites
// @desc    Get worksites by client_id and is_active status
// @access  Private
router.get('/', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { client_id, is_active } = req.query;
        const query = {};
        if (client_id)
            query.client_id = client_id;
        if (is_active)
            query.is_active = is_active === 'true';
        const worksites = yield collections_1.Worksite.find(query);
        res.json(worksites);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   GET api/worksites/:id
// @desc    Get worksite by ID
// @access  Private
router.get('/:id', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const worksite = yield collections_1.Worksite.findById(req.params.id);
        if (!worksite) {
            return res.status(404).json({ msg: 'Worksite not found' });
        }
        res.json(worksite);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// src/api/worksite.ts
router.put('/:id/hours', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hoursLogged } = req.body;
        yield collections_1.Worksite.updateHours(req.params.id, hoursLogged);
        res.json({ msg: 'Hours updated successfully' });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   POST api/worksites
// @desc    Create a new worksite
// @access  Private
router.post('/', auth_1.default, [
    (0, express_validator_1.body)('name', 'Name is required').not().isEmpty(),
    (0, express_validator_1.body)('address', 'Address is required').not().isEmpty(),
    (0, express_validator_1.body)('client_id', 'Client ID is required').not().isEmpty(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        console.log({ body: req.body });
        const newWorksite = new collections_1.Worksite(req.body);
        const worksite = yield newWorksite.save();
        res.json(worksite);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   PUT api/worksites/:id
// @desc    Update a worksite
// @access  Private
router.put('/:id', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const worksite = yield collections_1.Worksite.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!worksite) {
            return res.status(404).json({ msg: 'Worksite not found' });
        }
        res.json(worksite);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   DELETE api/worksites/:id
// @desc    Delete a worksite
// @access  Private
router.delete('/:id', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const worksite = yield collections_1.Worksite.findByIdAndDelete(req.params.id);
        if (!worksite) {
            return res.status(404).json({ msg: 'Worksite not found' });
        }
        res.json({ msg: 'Worksite removed' });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
exports.default = router;
