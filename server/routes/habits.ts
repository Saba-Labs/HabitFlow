import { RequestHandler } from 'express';
import { query } from '../db';
import { memoryStore } from '../memory-store';

const DEFAULT_USER_ID = 'default-user';

export const getHabits: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM habits WHERE user_id = $1 AND archived = FALSE ORDER BY "order"',
      [DEFAULT_USER_ID]
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error('Error fetching habits:', err);
    const habits = memoryStore.getHabits(DEFAULT_USER_ID);
    res.json(habits);
  }
};

export const addHabit: RequestHandler = async (req, res) => {
  try {
    let { id, name, icon, color, notes, order } = req.body;

    if (!id) {
      id = `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const result = await query(
      `INSERT INTO habits (id, user_id, name, icon, color, notes, "order", archived, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, DEFAULT_USER_ID, name, icon, color, notes || null, order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding habit:', err);
    let { id, name, icon, color, notes, order } = req.body;

    if (!id) {
      id = `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const habit = memoryStore.insertHabit({
      id,
      user_id: DEFAULT_USER_ID,
      name,
      icon,
      color,
      notes: notes || undefined,
      order: order || 0,
      archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    res.status(201).json(habit);
  }
};

export const updateHabit: RequestHandler = async (req, res) => {
  try {
    const { habitId } = req.params;
    const { name, icon, color, notes } = req.body;
    const result = await query(
      `UPDATE habits
       SET name = $1, icon = $2, color = $3, notes = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [name, icon, color, notes || null, habitId, DEFAULT_USER_ID]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating habit:', err);
    const habit = memoryStore.updateHabit(habitId, { name, icon, color, notes: notes || undefined });
    if (habit) {
      res.json(habit);
    } else {
      res.status(404).json({ error: 'Habit not found' });
    }
  }
};

export const deleteHabit: RequestHandler = async (req, res) => {
  try {
    const { habitId } = req.params;
    const result = await query(
      'DELETE FROM habits WHERE id = $1 AND user_id = $2 RETURNING *',
      [habitId, DEFAULT_USER_ID]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting habit:', err);
    const { habitId } = req.params;
    const deleted = memoryStore.deleteHabit(habitId);
    res.json({ success: deleted });
  }
};
