import express, { Request, Response } from 'express';
import { Worksite } from '../collections';
import auth from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// @route   GET api/worksites/stats
// @desc    Get worksite statistics
// @access  Private
router.get('/stats', auth, async (req: Request, res: Response) => {
  try {
    const totalWorksites = await Worksite.countDocuments();
    const activeWorksites = await Worksite.countDocuments({ is_active: true });
    const inactiveWorksites = await Worksite.countDocuments({
      is_active: false,
    });

    res.json({
      totalWorksites,
      activeWorksites,
      inactiveWorksites,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/worksites
// @desc    Get worksites by client_id and is_active status
// @access  Private
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const { client_id, is_active } = req.query;
    const query: any = {};
    if (client_id) query.client_id = client_id;
    if (is_active) query.is_active = is_active === 'true';

    const worksites = await Worksite.find(query);
    res.json(worksites);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/worksites/:id
// @desc    Get worksite by ID
// @access  Private
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const worksite = await Worksite.findById(req.params.id);
    if (!worksite) {
      return res.status(404).json({ msg: 'Worksite not found' });
    }
    res.json(worksite);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// src/api/worksite.ts
router.put('/:id/hours', auth, async (req: Request, res: Response) => {
  try {
    const { hoursLogged } = req.body;
    await Worksite.updateHours(req.params.id, hoursLogged);
    res.json({ msg: 'Hours updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/worksites
// @desc    Create a new worksite
// @access  Private
router.post(
  '/',
  auth,
  [
    body('name', 'Name is required').not().isEmpty(),
    body('address', 'Address is required').not().isEmpty(),
    body('client_id', 'Client ID is required').not().isEmpty(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log({ body: req.body });
      const newWorksite = new Worksite(req.body);
      const worksite = await newWorksite.save();
      res.json(worksite);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/worksites/:id
// @desc    Update a worksite
// @access  Private
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const worksite = await Worksite.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!worksite) {
      return res.status(404).json({ msg: 'Worksite not found' });
    }
    res.json(worksite);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/worksites/:id
// @desc    Delete a worksite
// @access  Private
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const worksite = await Worksite.findByIdAndDelete(req.params.id);
    if (!worksite) {
      return res.status(404).json({ msg: 'Worksite not found' });
    }
    res.json({ msg: 'Worksite removed' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

export default router;
