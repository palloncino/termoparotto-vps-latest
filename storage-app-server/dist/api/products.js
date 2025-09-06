"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const decimalUtils_1 = require("../utils/decimalUtils");
const router = express_1.default.Router();
// Add this route BEFORE any routes with :id parameter
router.get('/stats', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const total = yield collections_1.Product.countDocuments();
        res.json({
            total,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   POST api/products
// @desc    Create a new product
// @access  Private
router.post('/', auth_1.default, role_1.default, [
    (0, express_validator_1.body)('data_documento', 'Data documento is required').not().isEmpty(),
    (0, express_validator_1.body)('descrizione', 'Descrizione is required').not().isEmpty(),
    (0, express_validator_1.body)('descrizione_interna', 'Descrizione interna is required')
        .not()
        .isEmpty(),
    (0, express_validator_1.body)('fornitore', 'Fornitore is required').not().isEmpty(),
    (0, express_validator_1.body)('prezzo_acquisto', 'Prezzo acquisto is required').isNumeric(),
    (0, express_validator_1.body)('utile', 'Utile is required').isNumeric(),
    (0, express_validator_1.body)('imponibile', 'Imponibile is required').isNumeric(),
    (0, express_validator_1.body)('iva_10', 'IVA 10 is required').isNumeric(),
    (0, express_validator_1.body)('iva_22', 'IVA 22 is required').isNumeric(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const roundedProduct = (0, decimalUtils_1.roundProductDecimals)(req.body);
        const newProduct = new collections_1.Product(roundedProduct);
        const savedProduct = yield newProduct.save();
        res.json(savedProduct);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   GET api/products
// @desc    Get all products
// @access  Private
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, searchText = '' } = req.query;
        const limit = 200;
        const skip = (Number(page) - 1) * limit;
        const filters = {};
        if (searchText) {
            filters.$or = [
                { descrizione: { $regex: searchText, $options: 'i' } },
                { descrizione_interna: { $regex: searchText, $options: 'i' } },
                { fornitore: { $regex: searchText, $options: 'i' } },
            ];
        }
        const products = yield collections_1.Product.find(filters).skip(skip).limit(limit);
        const total = yield collections_1.Product.countDocuments(filters);
        res.json({
            products,
            currentPage: Number(page),
            totalPages: Math.ceil(total / limit),
            totalProducts: total,
        });
    }
    catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send('Server Error');
    }
}));
// @route   POST api/products/import
// @desc    Import multiple products
// @access  Private (Admin only)
router.post('/import', auth_1.default, role_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // If req.body is an array, use it directly; otherwise, use its "products" property.
    const products = Array.isArray(req.body) ? req.body : req.body.products;
    if (!Array.isArray(products) || products.length === 0) {
        console.error('[Import] Invalid product data:', req.body);
        return res.status(400).json({ msg: 'Invalid product data' });
    }
    const BATCH_SIZE = 500;
    let totalImported = 0;
    let allErrors = [];
    try {
        // Round decimals for all products before importing
        const roundedProducts = (0, decimalUtils_1.roundProductsDecimals)(products);
        for (let i = 0; i < roundedProducts.length; i += BATCH_SIZE) {
            const batch = roundedProducts.slice(i, i + BATCH_SIZE);
            try {
                // Use insertMany with unordered writes so errors in one record do not block the batch.
                const result = yield collections_1.Product.insertMany(batch, { ordered: false });
                totalImported += result.length;
            }
            catch (batchError) {
                const errorAny = batchError; // cast error to any
                // When unordered, insertMany throws an error containing result details.
                if (errorAny.writeErrors) {
                    // Count successfully inserted documents
                    totalImported += batch.length - errorAny.writeErrors.length;
                    // Capture error details for each failed write
                    allErrors = allErrors.concat(errorAny.writeErrors.map((we) => ({
                        product: we.err.op.name || 'Unknown',
                        error: we.err.errmsg,
                    })));
                }
                else {
                    console.error('[Import] Batch error:', batchError);
                    allErrors.push({ error: errorAny.message });
                }
            }
        }
    }
    catch (err) {
        console.error('[Import] Import error:', err);
        res.status(500).json({ msg: 'Server Error' });
        return;
    }
    console.log('[Import] Import result: ', {
        importedCount: totalImported,
        errors: allErrors,
    });
    // Create an import log record
    const ImportLog = (yield Promise.resolve().then(() => __importStar(require('../collections/ImportLog')))).default;
    const importLog = new ImportLog({
        fileName: req.body.fileName || 'Unknown', // you may pass fileName from client if needed
        totalRecords: products.length,
        importedCount: totalImported,
        errors: allErrors,
    });
    yield importLog.save();
    res.json({
        success: true,
        importedCount: totalImported,
        errors: allErrors,
    });
}));
// @route   POST api/products/bulk-delete
// @desc    Delete multiple products
// @access  Private (Admin only)
router.post('/bulk-delete', auth_1.default, role_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res
                .status(400)
                .json({ msg: 'No products specified for deletion' });
        }
        const result = yield collections_1.Product.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            return res.status(404).json({ msg: 'No products found for deletion' });
        }
        res.json({
            success: true,
            msg: `Successfully deleted ${result.deletedCount} products`,
            deletedCount: result.deletedCount,
        });
    }
    catch (err) {
        console.error('Error in bulk delete:', err);
        res.status(500).send('Server Error');
    }
}));
// @route   GET api/products/:id
// @desc    Get a product by ID
// @access  Private
router.get('/:id', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield collections_1.Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }
        res.json(product);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   PUT api/products/:id
// @desc    Update a product
// @access  Private
router.put('/:id', auth_1.default, role_1.default, [
    (0, express_validator_1.body)('data_documento', 'Data documento is required')
        .optional()
        .not()
        .isEmpty(),
    (0, express_validator_1.body)('descrizione', 'Descrizione is required').optional().not().isEmpty(),
    (0, express_validator_1.body)('descrizione_interna', 'Descrizione interna is required')
        .optional()
        .not()
        .isEmpty(),
    (0, express_validator_1.body)('fornitore', 'Fornitore is required').optional().not().isEmpty(),
    (0, express_validator_1.body)('prezzo_acquisto', 'Prezzo acquisto must be a number')
        .optional()
        .isNumeric(),
    (0, express_validator_1.body)('utile', 'Utile must be a number').optional().isNumeric(),
    (0, express_validator_1.body)('imponibile', 'Imponibile must be a number').optional().isNumeric(),
    (0, express_validator_1.body)('iva_10', 'IVA 10 must be a number').optional().isNumeric(),
    (0, express_validator_1.body)('iva_22', 'IVA 22 must be a number').optional().isNumeric(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const roundedProduct = (0, decimalUtils_1.roundProductDecimals)(req.body);
        const product = yield collections_1.Product.findByIdAndUpdate(req.params.id, roundedProduct, {
            new: true,
        });
        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }
        res.json(product);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Private
router.delete('/:id', auth_1.default, role_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield collections_1.Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }
        res.json({ msg: 'Product removed' });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
exports.default = router;
