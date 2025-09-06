import bcrypt from 'bcryptjs';
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../collections';
import auth from '../middleware/auth';
import isAdmin from '../middleware/role';
import { AuthRequest } from '../types';

const router = express.Router();

// @route   GET api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req: AuthRequest, res: Response) => {
  const { name, email } = req.body;

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;

    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/technicians
// @desc    Get all technicians (users)
// @access  Private
router.get('/technicians', auth, async (req: Request, res: Response) => {
  try {
    const users = await User.find({ role: 'user' }).select('_id name');
    res.json(users);
  } catch (err) {
    console.error('Error fetching technicians:', err);
    if (err instanceof Error) {
      res.status(500).json({ error: 'Server Error', details: err.message });
    } else {
      res
        .status(500)
        .json({ error: 'Server Error', details: 'An unknown error occurred' });
    }
  }
});

// @route   POST api/users
// @desc    Create a new user (Admin only)
// @access  Private (Admin only)
router.post(
  '/',
  auth,
  isAdmin,
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
    body('role', 'Role must be either admin or user').isIn(['admin', 'user']),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        name,
        email,
        role,
        passwordHash: await bcrypt.hash(password, 10),
        is_active: true, // Admin-created users are active by default
        status: 'approved',
      });

      await user.save();

      res.json({
        msg: 'User created successfully',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          status: user.status,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10; // Or any other number you prefer
    const skip = (page - 1) * limit;

    const filters: any = {};
    if (req.query.name)
      filters.name = new RegExp(req.query.name as string, 'i');
    if (req.query.email)
      filters.email = new RegExp(req.query.email as string, 'i');
    if (req.query.role) filters.role = req.query.role;

    const users = await User.find(filters)
      .select('-passwordHash')
      .skip(skip)
      .limit(limit);

    // Ensure is_active is properly set based on status
    const usersWithCorrectStatus = users.map(user => {
      const userObj = user.toObject() as any;
      // If is_active is not set, derive it from status
      if (userObj.is_active === undefined || userObj.is_active === null) {
        userObj.is_active = userObj.status === 'approved';
      }
      return userObj;
    });

    const total = await User.countDocuments(filters);

    res.json({
      users: usersWithCorrectStatus,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/stats
// @desc    Get user stats
// @access  Private (Admin only)
router.get('/stats', auth, async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = totalUsers - adminUsers;

    res.json({
      total: totalUsers,
      adminCount: adminUsers,
      userCount: regularUsers,
      adminPercentage: Math.round((adminUsers / totalUsers) * 100),
      userPercentage: Math.round((regularUsers / totalUsers) * 100),
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/:id/toggle-status
// @desc    Toggle user activation status
// @access  Private (Admin only)
router.put(
  '/:id/toggle-status',
  auth,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Prevent admin from deactivating themselves
      if (user._id.toString() === req.user?.id) {
        return res
          .status(400)
          .json({ msg: 'Cannot deactivate your own account' });
      }

      // Toggle both is_active and status
      (user as any).is_active = !(user as any).is_active;
      (user as any).status = (user as any).is_active ? 'approved' : 'pending';
      await user.save();

      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: (user as any).is_active,
          status: (user as any).status,
        },
        msg: `User ${
          (user as any).is_active ? 'activated' : 'deactivated'
        } successfully`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private (Admin only)
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put(
  '/:id',
  auth,
  isAdmin,
  [
    body('name', 'Name is required').optional().not().isEmpty(),
    body('email', 'Please include a valid email').optional().isEmail(),
    body('role', 'Role must be either admin or user')
      .optional()
      .isIn(['admin', 'user']),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
      let user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      if (name) user.name = name;
      if (email) user.email = email;
      if (role) user.role = role;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(password, salt);
      }

      await user.save();

      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', auth, isAdmin, async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

export default router;
