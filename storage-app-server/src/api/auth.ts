import bcrypt from 'bcryptjs';
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { User } from '../collections';
import { User as UserType } from '../types';
import { sendAdminNotification } from '../services/emailService';

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register user (requires admin approval)
// @access  Public
router.post(
  '/register',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
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
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        name,
        email,
        role,
        passwordHash: await bcrypt.hash(password, 10),
        status: 'pending', // Default status
      });

      await user.save();

      // Invia notifica email all'admin
      try {
        const adminUser = await User.findOne({ role: 'admin', status: 'approved' });
        if (adminUser && adminUser.email) {
          await sendAdminNotification(adminUser.email, { name, email });
        }
      } catch (emailError) {
        console.error('Errore invio email notifica:', emailError);
        // Non bloccare la registrazione se l'email fallisce
      }

      res.json({ 
        message: 'Registration successful. Your account is pending admin approval. You will receive an email when approved.' 
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token (only approved users)
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
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      // Verifica che l'utente sia approvato
      if (user.status !== 'approved') {
        return res.status(403).json({ 
          errors: [{ 
            msg: user.status === 'pending' 
              ? 'Account pending approval. Please wait for admin approval.' 
              : 'Account has been rejected. Contact administrator.' 
          }] 
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash as string);

      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
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

// @route   GET api/auth/status
// @desc    Check user registration status
// @access  Public
router.get('/status/:email', async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      status: user.status,
      message: user.status === 'pending' 
        ? 'Account pending approval' 
        : user.status === 'approved' 
        ? 'Account approved' 
        : 'Account rejected'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

export default router;