import { RequestHandler } from 'express';
import { query } from '../db';
import { memoryStore } from '../memory-store';

export const getHabits: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query(
      'SELECT * FROM habits WHERE user_id = $1 AND archived = FALSE ORDER BY "order"',
      [userId]
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error('Error fetching habits:', err);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
};

export const addHabit: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let { id, name, icon, color, notes, order } = req.body;

    if (!id) {
      id = `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const result = await query(
      `INSERT INTO habits (id, user_id, name, icon, color, notes, "order", archived, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, userId, name, icon, color, notes || null, order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding habit:', err);
    res.status(500).json({ error: 'Failed to add habit' });
  }
};

export const updateHabit: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { habitId } = req.params;
    const { name, icon, color, notes } = req.body;
    const result = await query(
      `UPDATE habits
       SET name = $1, icon = $2, color = $3, notes = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [name, icon, color, notes || null, habitId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating habit:', err);
    res.status(500).json({ error: 'Failed to update habit' });
  }
};

export const deleteHabit: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { habitId } = req.params;
    const result = await query(
      'DELETE FROM habits WHERE id = $1 AND user_id = $2 RETURNING *',
      [habitId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting habit:', err);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
};
