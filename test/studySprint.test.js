const assert = require('assert');
const test = require('node:test');

const {
  generateSchedule,
  updateTaskStatus,
  shiftSprintForExams,
  resumeSprint,
  generateICalendar
} = require('../services/studySprintService');

test('generates study schedule with 45-min micro-tasks for Web Developer track', () => {
  const result = generateSchedule({
    careerGoal: 'Web Developer',
    dailyStudyHours: 2,
    startDate: new Date('2026-09-01T09:00:00Z')
  });

  assert.ok(Array.isArray(result.schedule));
  assert.ok(result.schedule.length > 0);
  assert.strictEqual(result.sessionsPerDay, 2);

  const firstTask = result.schedule[0];
  assert.strictEqual(firstTask.durationMinutes, 45);
  assert.strictEqual(firstTask.completed, false);
  assert.ok(firstTask.dateStr);
  assert.ok(firstTask.topicName);
});

test('updates task status and increments streak', () => {
  const initial = generateSchedule({
    careerGoal: 'Web Developer',
    dailyStudyHours: 2
  });

  const sprintData = {
    schedule: initial.schedule,
    completedTasks: 0,
    totalTasks: initial.schedule.length,
    progressPercent: 0,
    streakCount: 0,
    lastActiveDate: null
  };

  const taskId = initial.schedule[0].id;
  const updated = updateTaskStatus(sprintData, taskId, true);

  assert.strictEqual(updated.completedTasks, 1);
  assert.ok(updated.progressPercent > 0);
  assert.strictEqual(updated.streakCount, 1);
  assert.ok(updated.lastActiveDate);
});

test('shifts uncompleted future tasks when exam pause mode is activated', () => {
  const initial = generateSchedule({
    careerGoal: 'Software Engineer',
    dailyStudyHours: 2,
    startDate: new Date()
  });

  const sprintData = {
    schedule: initial.schedule,
    isPaused: false,
    pausedUntil: null
  };

  const paused = shiftSprintForExams(sprintData, 7);

  assert.strictEqual(paused.isPaused, true);
  assert.ok(paused.pausedUntil);
});

test('resumes a paused study sprint', () => {
  const pausedSprint = {
    isPaused: true,
    pausedUntil: '2026-09-10'
  };

  const resumed = resumeSprint(pausedSprint);
  assert.strictEqual(resumed.isPaused, false);
  assert.strictEqual(resumed.pausedUntil, null);
});

test('generates valid RFC 5545 iCalendar (.ics) string', () => {
  const initial = generateSchedule({
    careerGoal: 'Data Scientist',
    dailyStudyHours: 2
  });

  const sprintData = {
    schedule: initial.schedule
  };

  const icsStr = generateICalendar(sprintData, 'Test Student');

  assert.ok(icsStr.includes('BEGIN:VCALENDAR'));
  assert.ok(icsStr.includes('END:VCALENDAR'));
  assert.ok(icsStr.includes('PRODID:-//CampusCompass//StudySprint 1.0//EN'));
  assert.ok(icsStr.includes('BEGIN:VEVENT'));
});
