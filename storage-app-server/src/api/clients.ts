import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Client } from '../collections';
import auth from '../middleware/auth';
import isAdmin from '../middleware/role';

const router = express.Router();

// Place this route BEFORE any routes with :id parameter
router.get('/count', async (req: Request, res: Response) => {
  try {
    const count = await Client.countDocuments();
    res.json({ count });
  } catch (err: unknown) {
    console.error('Error fetching client count:', err);
    res.status(500).send('Server Error');
  }
});

// Add this route BEFORE any routes with :id parameter
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const count = await Client.countDocuments();
    res.json({ count });
  } catch (err: any) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/clients
// @desc    Create a new client
// @access  Private
router.post(
  '/',
  auth,
  isAdmin,
  [
    body('name', 'Name is required').not().isEmpty(),
    body('address', 'Address is required').not().isEmpty(),
    body('contact_info', 'Contact information is required').not().isEmpty(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const newClient = new Client(req.body);
      const savedClient = await newClient.save();
      res.json(savedClient);
    } catch (err: unknown) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/clients
// @desc    Get all clients
// @access  Private
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10; // Or any other number you prefer
    const skip = (page - 1) * limit;

    const filters: any = {};
    if (req.query.name)
      filters.name = new RegExp(req.query.name as string, 'i');
    if (req.query.address)
      filters.address = new RegExp(req.query.address as string, 'i');
    if (req.query.contact_info)
      filters.contact_info = new RegExp(req.query.contact_info as string, 'i');

    const clients = await Client.find(filters).skip(skip).limit(limit);

    const total = await Client.countDocuments(filters);

    res.json({
      clients,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/clients/:id
// @desc    Get client by ID
// @access  Private
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }
    res.json(client);
  } catch (err: unknown) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/clients/:id
// @desc    Update client
// @access  Private
router.put(
  '/:id',
  auth,
  isAdmin,
  [
    body('name', 'Name is required').optional().not().isEmpty(),
    body('address', 'Address is required').optional().not().isEmpty(),
    body('contact_info', 'Contact information is required')
      .optional()
      .not()
      .isEmpty(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (!client) {
        return res.status(404).json({ msg: 'Client not found' });
      }
      res.json(client);
    } catch (err: unknown) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/clients/:id
// @desc    Delete client
// @access  Private
router.delete('/:id', auth, isAdmin, async (req: Request, res: Response) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }
    res.json({ msg: 'Client removed' });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

export default router;
