import { RequestHandler } from 'express';
import { query, isDbReady } from '../db';
import { memoryStore } from '../memory-store';

export const getTodayRecord: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const today = new Date().toISOString().split('T')[0];
    console.log(`getTodayRecord: userId=${userId}, today=${today}, dbReady=${isDbReady()}`);

    if (!isDbReady()) {
      try {
        let record = memoryStore.getRecord(userId, today);
        if (!record) {
          const recordId = `record_${today}_${userId}`;
          record = memoryStore.insertRecord({
            id: recordId,
            user_id: userId,
            date: today,
            completion_percentage: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          const habits = memoryStore.getHabits(userId);
          console.log(`Created record ${recordId} with ${habits.length} habits`);
          for (const habit of habits) {
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
        const completions = memoryStore.getCompletions(record.id);
        console.log(`Returning record ${record.id} with ${completions.length} completions`);
        return res.json({
          id: record.id,
          date: record.date,
          habits: completions.map(c => ({
            habitId: c.habit_id,
            completed: c.completed,
            completedAt: c.completed_at,
          })),
          completionPercentage: record.completion_percentage,
        });
      } catch (memErr) {
        console.error('Error fetching from memory store:', memErr);
        throw memErr;
      }
    }

    // First try to get existing record by user_id and date
    let result = await query(
      `SELECT dr.*,
              COALESCE(
                (SELECT json_agg(json_build_object('habitId', habit_id, 'completed', completed, 'completedAt', completed_at) ORDER BY created_at)
                 FROM habit_completions
                 WHERE record_id = dr.id),
                '[]'::json
              ) as habits
       FROM daily_records dr
       WHERE dr.user_id = $1 AND dr.date = $2`,
      [userId, today]
    );

    if (result.rows.length === 0) {
      const recordId = `record_${today}_${userId}`;
      const habitResult = await query(
        'SELECT id FROM habits WHERE user_id = $1 AND archived = FALSE',
        [userId]
      );

      await query(
        `INSERT INTO daily_records (id, user_id, date, completion_percentage, created_at)
         VALUES ($1, $2, $3, 0, CURRENT_TIMESTAMP)`,
        [recordId, userId, today]
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
                COALESCE(
                  (SELECT json_agg(json_build_object('habitId', habit_id, 'completed', completed, 'completedAt', completed_at) ORDER BY created_at)
                   FROM habit_completions
                   WHERE record_id = dr.id),
                  '[]'::json
                ) as habits
         FROM daily_records dr
         WHERE dr.user_id = $1 AND dr.date = $2`,
        [userId, today]
      );
    }

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const record = result.rows[0];
    const habitsArray = Array.isArray(record.habits) ? record.habits : [];
    res.json({
      id: record.id,
      date: record.date,
      habits: habitsArray.filter(h => h !== null),
      completionPercentage: record.completion_percentage,
    });
  } catch (err) {
    console.error('Error getting today record:', err instanceof Error ? err.message : err);
    console.error('Full error:', err);
    res.status(500).json({ error: 'Failed to fetch record', details: err instanceof Error ? err.message : String(err) });
  }
};

export const toggleHabit: RequestHandler = async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { recordId, habitId } = req.params;

  try {
    if (!isDbReady()) {
      const completion = memoryStore.getCompletion(recordId, habitId);
      if (!completion) {
        return res.status(404).json({ error: 'Habit completion not found' });
      }
      const newStatus = !completion.completed;
      memoryStore.updateCompletion(recordId, habitId, {
        completed: newStatus,
        completed_at: newStatus ? new Date().toISOString() : undefined,
      });
      const stats = memoryStore.getCompletionStats(recordId);
      const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      memoryStore.updateRecord(recordId, { completion_percentage: percentage });
      return res.json({ success: true, completed: newStatus });
    }

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
    res.status(500).json({ error: 'Failed to toggle habit' });
  }
};
