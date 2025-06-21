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
// Add this route BEFORE any routes with :id parameter
router.get('/stats', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const total = yield collections_1.Product.countDocuments();
        const materialCount = yield collections_1.Product.countDocuments({ type: 'material' });
        const productCount = total - materialCount;
        const materialPercentage = total > 0 ? (materialCount / total * 100).toFixed(1) : '0.0';
        const productPercentage = total > 0 ? (productCount / total * 100).toFixed(1) : '0.0';
        res.json({
            total,
            materialPercentage: parseFloat(materialPercentage),
            productPercentage: parseFloat(productPercentage)
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
    (0, express_validator_1.body)('codice_articolo', 'Codice articolo is required').not().isEmpty(),
    (0, express_validator_1.body)('codice_fornitore', 'Codice fornitore is required').not().isEmpty(),
    (0, express_validator_1.body)('descrizione_articolo', 'Descrizione articolo is required').not().isEmpty(),
    (0, express_validator_1.body)('prezzo_listino', 'Prezzo listino is required').isNumeric(),
    (0, express_validator_1.body)('prezzo_acquisto', 'Prezzo acquisto is required').isNumeric(),
    (0, express_validator_1.body)('prezzo_concosti', 'Prezzo concosti is required').isNumeric(),
    (0, express_validator_1.body)('prezzo_cliente', 'Prezzo cliente is required').isNumeric(),
    (0, express_validator_1.body)('prezzo_iva10', 'Prezzo IVA 10 is required').isNumeric(),
    (0, express_validator_1.body)('prezzo_iva22', 'Prezzo IVA 22 is required').isNumeric(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const newProduct = new collections_1.Product(req.body);
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
        const { page = 1, searchText = '', type = '' } = req.query;
        const limit = 200;
        const skip = (Number(page) - 1) * limit;
        console.log(`[DEBUG] Fetching products. page: ${page}, limit: ${limit}, skip: ${skip}`);
        const filters = {};
        if (searchText) {
            filters.$or = [
                { codice_articolo: { $regex: searchText, $options: 'i' } },
                { codice_fornitore: { $regex: searchText, $options: 'i' } },
                { descrizione_articolo: { $regex: searchText, $options: 'i' } },
            ];
        }
        if (type) {
            filters.type = type;
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
    (0, express_validator_1.body)('item_code', 'Item code is required').optional().not().isEmpty(),
    (0, express_validator_1.body)('supplier_item_code', 'Supplier item code is required').optional().not().isEmpty(),
    (0, express_validator_1.body)('item_description', 'Item description is required').optional().not().isEmpty(),
    (0, express_validator_1.body)('diameter', 'Diameter must be a number').optional().isNumeric(),
    (0, express_validator_1.body)('length_mm', 'Length in mm must be a number').optional().isNumeric(),
    (0, express_validator_1.body)('unit_price_list', 'Unit price list must be a number').optional().isNumeric(),
    (0, express_validator_1.body)('unit_price_first_discount', 'Unit price first discount must be a number').optional().isNumeric(),
    (0, express_validator_1.body)('unit_price_net', 'Unit price net must be a number').optional().isNumeric(),
    (0, express_validator_1.body)('unit_price_markup', 'Unit price markup must be a number').optional().isNumeric(),
    (0, express_validator_1.body)('unit_price_taxable', 'Unit price taxable must be a number').optional().isNumeric(),
    (0, express_validator_1.body)('unit_price_sale', 'Unit price sale must be a number').optional().isNumeric(),
    (0, express_validator_1.body)('type', 'Type must be either product or material').optional().isIn(['product', 'material']),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const product = yield collections_1.Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
// @route   POST api/products/import
// @desc    Import multiple products
// @access  Private (Admin only)
// router.post('/import', auth, isAdmin, async (req: Request, res: Response) => {
//     // If req.body is an array, use it directly; otherwise, use its "products" property.
//     const products = Array.isArray(req.body) ? req.body : req.body.products;
//     if (!Array.isArray(products) || products.length === 0) {
//         console.error("[Import] Invalid product data:", req.body);
//         return res.status(400).json({ msg: 'Invalid product data' });
//     }
//     const BATCH_SIZE = 500;
//     let totalImported = 0;
//     let allErrors: any[] = [];
//     try {
//         for (let i = 0; i < products.length; i += BATCH_SIZE) {
//             const batch = products.slice(i, i + BATCH_SIZE);
//             try {
//                 // Use insertMany with unordered writes so errors in one record do not block the batch.
//                 const result = await Product.insertMany(batch, { ordered: false });
//                 totalImported += result.length;
//             } catch (batchError) {
//                 const errorAny = batchError as any; // cast error to any
//                 // When unordered, insertMany throws an error containing result details.
//                 if (errorAny.writeErrors) {
//                     // Count successfully inserted documents
//                     totalImported += batch.length - errorAny.writeErrors.length;
//                     // Capture error details for each failed write
//                     allErrors = allErrors.concat(errorAny.writeErrors.map((we: any) => ({
//                         product: we.err.op.name || 'Unknown',
//                         error: we.err.errmsg
//                     })));
//                 } else {
//                     console.error("[Import] Batch error:", batchError);
//                     allErrors.push({ error: errorAny.message });
//                 }
//             }
//         }
//     } catch (err) {
//         console.error("[Import] Import error:", err);
//         res.status(500).json({ msg: 'Server Error' });
//         return;
//     }
//     console.log("[Import] Import result: ", { importedCount: totalImported, errors: allErrors });
//     // Create an import log record
//     const ImportLog = (await import('../collections/ImportLog')).default;
//     const importLog = new ImportLog({
//         fileName: req.body.fileName || 'Unknown',  // you may pass fileName from client if needed
//         totalRecords: products.length,
//         importedCount: totalImported,
//         errors: allErrors
//     });
//     await importLog.save();
//     res.json({
//         success: true,
//         importedCount: totalImported,
//         errors: allErrors
//     });
// });
// @route   POST api/products/bulk-delete
// @desc    Delete multiple products
// @access  Private (Admin only)
router.post('/bulk-delete', auth_1.default, role_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ msg: 'No products specified for deletion' });
        }
        const result = yield collections_1.Product.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            return res.status(404).json({ msg: 'No products found for deletion' });
        }
        res.json({
            success: true,
            msg: `Successfully deleted ${result.deletedCount} products`,
            deletedCount: result.deletedCount
        });
    }
    catch (err) {
        console.error('Error in bulk delete:', err);
        res.status(500).send('Server Error');
    }
}));
exports.default = router;
