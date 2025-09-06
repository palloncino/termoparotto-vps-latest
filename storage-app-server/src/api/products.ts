import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Product } from '../collections';
import auth from '../middleware/auth';
import isAdmin from '../middleware/role';
import { roundProductDecimals, roundProductsDecimals } from '../utils/decimalUtils';

const router = express.Router();

// Add this route BEFORE any routes with :id parameter
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const total = await Product.countDocuments();

    res.json({
      total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/products
// @desc    Create a new product
// @access  Private
router.post(
  '/',
  auth,
  isAdmin,
  [
    body('data_documento', 'Data documento is required').not().isEmpty(),
    body('descrizione', 'Descrizione is required').not().isEmpty(),
    body('descrizione_interna', 'Descrizione interna is required')
      .not()
      .isEmpty(),
    body('fornitore', 'Fornitore is required').not().isEmpty(),
    body('prezzo_acquisto', 'Prezzo acquisto is required').isNumeric(),
    body('utile', 'Utile is required').isNumeric(),
    body('imponibile', 'Imponibile is required').isNumeric(),
    body('iva_10', 'IVA 10 is required').isNumeric(),
    body('iva_22', 'IVA 22 is required').isNumeric(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const roundedProduct = roundProductDecimals(req.body);
      const newProduct = new Product(roundedProduct);
      const savedProduct = await newProduct.save();
      res.json(savedProduct);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/products
// @desc    Get all products
// @access  Private
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, searchText = '' } = req.query;

    const limit = 200;
    const skip = (Number(page) - 1) * limit;

    const filters: any = {};
    if (searchText) {
      filters.$or = [
        { descrizione: { $regex: searchText, $options: 'i' } },
        { descrizione_interna: { $regex: searchText, $options: 'i' } },
        { fornitore: { $regex: searchText, $options: 'i' } },
      ];
    }

    const products = await Product.find(filters).skip(skip).limit(limit);
    const total = await Product.countDocuments(filters);

    res.json({
      products,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/products/import
// @desc    Import multiple products
// @access  Private (Admin only)
router.post('/import', auth, isAdmin, async (req: Request, res: Response) => {
  // If req.body is an array, use it directly; otherwise, use its "products" property.
  const products = Array.isArray(req.body) ? req.body : req.body.products;
  if (!Array.isArray(products) || products.length === 0) {
    console.error('[Import] Invalid product data:', req.body);
    return res.status(400).json({ msg: 'Invalid product data' });
  }

  const BATCH_SIZE = 500;
  let totalImported = 0;
  let allErrors: any[] = [];

  try {
    // Round decimals for all products before importing
    const roundedProducts = roundProductsDecimals(products);
    
    for (let i = 0; i < roundedProducts.length; i += BATCH_SIZE) {
      const batch = roundedProducts.slice(i, i + BATCH_SIZE);
      try {
        // Use insertMany with unordered writes so errors in one record do not block the batch.
        const result = await Product.insertMany(batch, { ordered: false });
        totalImported += result.length;
      } catch (batchError) {
        const errorAny = batchError as any; // cast error to any
        // When unordered, insertMany throws an error containing result details.
        if (errorAny.writeErrors) {
          // Count successfully inserted documents
          totalImported += batch.length - errorAny.writeErrors.length;
          // Capture error details for each failed write
          allErrors = allErrors.concat(
            errorAny.writeErrors.map((we: any) => ({
              product: we.err.op.name || 'Unknown',
              error: we.err.errmsg,
            }))
          );
        } else {
          console.error('[Import] Batch error:', batchError);
          allErrors.push({ error: errorAny.message });
        }
      }
    }
  } catch (err) {
    console.error('[Import] Import error:', err);
    res.status(500).json({ msg: 'Server Error' });
    return;
  }

  console.log('[Import] Import result: ', {
    importedCount: totalImported,
    errors: allErrors,
  });

  // Create an import log record
  const ImportLog = (await import('../collections/ImportLog')).default;
  const importLog = new ImportLog({
    fileName: req.body.fileName || 'Unknown', // you may pass fileName from client if needed
    totalRecords: products.length,
    importedCount: totalImported,
    errors: allErrors,
  });
  await importLog.save();

  res.json({
    success: true,
    importedCount: totalImported,
    errors: allErrors,
  });
});

// @route   POST api/products/bulk-delete
// @desc    Delete multiple products
// @access  Private (Admin only)
router.post(
  '/bulk-delete',
  auth,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res
          .status(400)
          .json({ msg: 'No products specified for deletion' });
      }

      const result = await Product.deleteMany({ _id: { $in: ids } });

      if (result.deletedCount === 0) {
        return res.status(404).json({ msg: 'No products found for deletion' });
      }

      res.json({
        success: true,
        msg: `Successfully deleted ${result.deletedCount} products`,
        deletedCount: result.deletedCount,
      });
    } catch (err) {
      console.error('Error in bulk delete:', err);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/products/:id
// @desc    Get a product by ID
// @access  Private
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Private
router.put(
  '/:id',
  auth,
  isAdmin,
  [
    body('data_documento', 'Data documento is required')
      .optional()
      .not()
      .isEmpty(),
    body('descrizione', 'Descrizione is required').optional().not().isEmpty(),
    body('descrizione_interna', 'Descrizione interna is required')
      .optional()
      .not()
      .isEmpty(),
    body('fornitore', 'Fornitore is required').optional().not().isEmpty(),
    body('prezzo_acquisto', 'Prezzo acquisto must be a number')
      .optional()
      .isNumeric(),
    body('utile', 'Utile must be a number').optional().isNumeric(),
    body('imponibile', 'Imponibile must be a number').optional().isNumeric(),
    body('iva_10', 'IVA 10 must be a number').optional().isNumeric(),
    body('iva_22', 'IVA 22 must be a number').optional().isNumeric(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const roundedProduct = roundProductDecimals(req.body);
      const product = await Product.findByIdAndUpdate(req.params.id, roundedProduct, {
        new: true,
      });
      if (!product) {
        return res.status(404).json({ msg: 'Product not found' });
      }
      res.json(product);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Private
router.delete('/:id', auth, isAdmin, async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

export default router;
