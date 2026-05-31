import { RequestHandler } from 'express';
import { query } from '../db';
import { memoryStore } from '../memory-store';

const DEFAULT_USER_ID = 'default-user';

export const getTodayRecord: RequestHandler = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let result = await query(
      `SELECT dr.*,
              json_agg(json_build_object('habitId', hc.habit_id, 'completed', hc.completed, 'completedAt', hc.completed_at) ORDER BY hc.created_at) as habits
       FROM daily_records dr
       LEFT JOIN habit_completions hc ON dr.id = hc.record_id
       WHERE dr.user_id = $1 AND dr.date = $2
       GROUP BY dr.id`,
      [DEFAULT_USER_ID, today]
    );

    if (result.rows.length === 0) {
      const recordId = `record_${today}`;
      const habitResult = await query(
        'SELECT id FROM habits WHERE user_id = $1 AND archived = FALSE',
        [DEFAULT_USER_ID]
      );

      await query(
        `INSERT INTO daily_records (id, user_id, date, completion_percentage, created_at)
         VALUES ($1, $2, $3, 0, CURRENT_TIMESTAMP)`,
        [recordId, DEFAULT_USER_ID, today]
      );

      for (const habit of habitResult.rows) {
        await query(
          `INSERT INTO habit_completions (id, record_id, habit_id, completed, created_at)
           VALUES ($1, $2, $3, FALSE, CURRENT_TIMESTAMP)`,
          [`completion_${Date.now()}_${habit.id}`, recordId, habit.id]
        );
      }

      result = await query(
        `SELECT dr.*,
                json_agg(json_build_object('habitId', hc.habit_id, 'completed', hc.completed, 'completedAt', hc.completed_at)) as habits
         FROM daily_records dr
         LEFT JOIN habit_completions hc ON dr.id = hc.record_id
         WHERE dr.id = $1
         GROUP BY dr.id`,
        [recordId]
      );
    }

    const record = result.rows[0];
    res.json({
      id: record.id,
      date: record.date,
      habits: record.habits || [],
      completionPercentage: record.completion_percentage,
    });
  } catch (err) {
    console.error('Error getting today record:', err);
    const today = new Date().toISOString().split('T')[0];
    const recordId = `record_${today}`;

    // Try to get from memory store
    let record = memoryStore.getRecord(DEFAULT_USER_ID, today);
    if (!record) {
      record = memoryStore.insertRecord({
        id: recordId,
        user_id: DEFAULT_USER_ID,
        date: today,
        completion_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Get habits and create completions
    const habits = memoryStore.getHabits(DEFAULT_USER_ID);
    const completions = memoryStore.getCompletions(recordId);

    // Add missing habit completions
    for (const habit of habits) {
      if (!completions.find(c => c.habit_id === habit.id)) {
        memoryStore.insertCompletion({
          id: `completion_${Date.now()}_${habit.id}`,
          record_id: recordId,
          habit_id: habit.id,
          completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    const allCompletions = memoryStore.getCompletions(recordId);
    res.json({
      id: record.id,
      date: record.date,
      habits: allCompletions.map(c => ({
        habitId: c.habit_id,
        completed: c.completed,
        completedAt: c.completed_at,
      })),
      completionPercentage: record.completion_percentage,
    });
  }
};

export const toggleHabit: RequestHandler = async (req, res) => {
  const { recordId, habitId } = req.params;

  try {
    const habitResult = await query(
      'SELECT completed FROM habit_completions WHERE record_id = $1 AND habit_id = $2',
      [recordId, habitId]
    );

    if (habitResult.rows.length === 0) {
      return res.status(404).json({ error: 'Habit completion not found' });
    }

    const isCompleted = habitResult.rows[0].completed;
    const newStatus = !isCompleted;
    const completedAt = newStatus ? new Date().toISOString() : null;

    await query(
      `UPDATE habit_completions
       SET completed = $1, completed_at = $2, updated_at = CURRENT_TIMESTAMP
       WHERE record_id = $3 AND habit_id = $4`,
      [newStatus, completedAt, recordId, habitId]
    );

    const completionResult = await query(
      `SELECT COUNT(*) as total, SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed
       FROM habit_completions WHERE record_id = $1`,
      [recordId]
    );

    const { total, completed } = completionResult.rows[0];
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    await query(
      'UPDATE daily_records SET completion_percentage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [percentage, recordId]
    );

    res.json({ success: true, completed: newStatus });
  } catch (err) {
    console.error('Error toggling habit:', err);
    const completion = memoryStore.getCompletion(recordId, habitId);
    if (completion) {
      const newStatus = !completion.completed;
      const completedAt = newStatus ? new Date().toISOString() : undefined;
      memoryStore.updateCompletion(recordId, habitId, {
        completed: newStatus,
        completed_at: completedAt,
      });

      const stats = memoryStore.getCompletionStats(recordId);
      const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      memoryStore.updateRecord(recordId, { completion_percentage: percentage });

      res.json({ success: true, completed: newStatus });
    } else {
      res.status(404).json({ error: 'Habit completion not found' });
    }
  }
};
