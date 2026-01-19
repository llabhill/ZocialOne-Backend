const AUTH = {
  SALT_ROUNDS: 12,
  TOKEN_EXPIRY: '7d',
};

const COMPLAINT_TYPES = ['live_demo', 'billing_issue', 'technical_issue', 'feedback'];
const COMPLAINT_STATUSES = ['raised', 'in_progress', 'waiting_on_user', 'resolved', 'closed'];


const VALID_STATUS_TRANSITIONS = {
  raised: ['in_progress', 'waiting_on_user'],
  in_progress: ['waiting_on_user', 'resolved'],
  waiting_on_user: ['in_progress', 'resolved'],
  resolved: ['closed'],
  closed: [], 
};


const ONBOARDING_STAGES = {
  0: {
    name: 'Initial Setup',
    maxNotifications: 3,
    reminders: [
      { key: '24h', delayMs: 24 * 60 * 60 * 1000, title: 'Complete your onboarding!', body: 'You have pending steps in Stage 0. Please continue.' },
      { key: '3d', delayMs: 3 * 24 * 60 * 60 * 1000, title: 'Reminder: Stage 0 pending', body: 'It has been 3 days. Complete Stage 0 to unlock features.' },
      { key: '5d', delayMs: 5 * 24 * 60 * 60 * 1000, title: 'Final Reminder: Stage 0', body: '5 days passed. Finish Stage 0 now!' },
    ],
  },
  1: {
    name: 'Profile Completion',
    maxNotifications: 2,
    reminders: [
      { key: '12h', delayMs: 12 * 60 * 60 * 1000, title: 'Stage 1 Awaiting', body: 'Continue Stage 1 of your onboarding.' },
      { key: '24h', delayMs: 24 * 60 * 60 * 1000, title: 'Stage 1 Reminder', body: 'A day has passed. Please complete Stage 1.' },
    ],
  },
  2: {
    name: 'Final Steps',
    maxNotifications: 4,
    reminders: [
      { key: '24h', delayMs: 24 * 60 * 60 * 1000, title: 'Stage 2 Pending', body: 'Complete Stage 2 to finish onboarding.' },
      { key: '1d', delayMs: 1 * 24 * 60 * 60 * 1000, title: 'Stage 2 Reminder', body: 'One day since Stage 2 started. Please continue.' },
      { key: '3d', delayMs: 3 * 24 * 60 * 60 * 1000, title: 'Stage 2: 3 days', body: '3 days in Stage 2. Almost there!' },
      { key: '5d', delayMs: 5 * 24 * 60 * 60 * 1000, title: 'Final Stage 2 Reminder', body: '5 days. Finish your onboarding now!' },
    ],
  },
};


const BATCH_CONFIG = {
  NOTIFICATION_BATCH_SIZE: 100, 
  USER_BATCH_SIZE: 50,
};

module.exports = {
  AUTH,
  COMPLAINT_TYPES,
  COMPLAINT_STATUSES,
  VALID_STATUS_TRANSITIONS,
  ONBOARDING_STAGES,
  BATCH_CONFIG,
};
