import bcrypt from 'bcryptjs';
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { User } from '../collections';
import { User as UserType } from '../types';

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
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
        is_active: false,
        status: 'pending',
      });

      await user.save();

      // Don't return a token for inactive users - they need admin approval first
      res.json({
        msg: 'User registered successfully. Please wait for admin approval before logging in.',
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

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user: UserType | null = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const isMatch = await bcrypt.compare(
        password,
        user.passwordHash as string
      );

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      // Check if user is active
      if (!(user as any).is_active) {
        return res.status(400).json({
          errors: [
            {
              msg: 'Account is not active. Please contact an administrator.',
            },
          ],
        });
      }

      const payload = { user };

      jwt.sign(
        payload,
        process.env.JWT_SECRET as string,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token, user });
        }
      );
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  }
);

export default router;
