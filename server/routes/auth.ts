import { RequestHandler } from 'express';
import { query, isDbReady } from '../db';
import { hashPassword, comparePassword, generateToken } from '../auth';
import { memoryStore } from '../memory-store';

// Simple in-memory user store for development
const users: Map<string, { id: string; email: string; password_hash: string }> = new Map();

export const signup: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!isDbReady()) {
      // Check if user exists in memory
      for (const user of users.values()) {
        if (user.email === email) {
          return res.status(409).json({ error: 'Email already registered' });
        }
      }

      const userId = `user_${Date.now()}`;
      const passwordHash = await hashPassword(password);
      users.set(userId, { id: userId, email, password_hash: passwordHash });

      const token = generateToken(userId, email);
      return res.status(201).json({ token, userId, email });
    }

    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const userId = `user_${Date.now()}`;
    const passwordHash = await hashPassword(password);

    await query(
      'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)',
      [userId, email, passwordHash]
    );

    const token = generateToken(userId, email);
    res.status(201).json({ token, userId, email });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
};

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!isDbReady()) {
      // Check in memory store
      let user = null;
      for (const u of users.values()) {
        if (u.email === email) {
          user = u;
          break;
        }
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isPasswordValid = await comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = generateToken(user.id, email);
      return res.json({ token, userId: user.id, email });
    }

    const result = await query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id, email);
    res.json({ token, userId: user.id, email });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};
