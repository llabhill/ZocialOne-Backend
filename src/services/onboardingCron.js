const cron = require('node-cron');
const { Op } = require('sequelize');
const { User, OnboardingReminder } = require('../models');
const { sendNotificationsBatch } = require('./notificationService');
const { chunkArray } = require('../utils/helpers');
const { ONBOARDING_STAGES, BATCH_CONFIG } = require('../constants');


//Procesess onboarding reminders with batch processing
 //Fetches users in batches to reduce memory usage
 //Sends notifications in batches to reduce DB load
  //Tracks notification count per stage
 
async function processOnboardingReminders() {
  const now = Date.now();
  let offset = 0;
  let totalProcessed = 0;
  let totalNotificationsSent = 0;

  console.log('[CRON] Starting onboarding reminder processing...');

  while (true) {
    
    const users = await User.findAll({
      where: { onboarding_stage: { [Op.lt]: 3 } },
      limit: BATCH_CONFIG.USER_BATCH_SIZE,
      offset,
      order: [['id', 'ASC']],
    });

    if (users.length === 0) break;

 
    const notificationsToSend = [];
    const remindersToCreate = [];

    for (const user of users) {
      const stage = user.onboarding_stage;
      const stageConfig = ONBOARDING_STAGES[stage];

      if (!stageConfig) continue;

      const stageStartedAt = new Date(user.onboarding_stage_updated_at).getTime();

      // Get existing reminders for this users current stage
      const existingReminders = await OnboardingReminder.findAll({
        where: { user_id: user.id, stage },
        attributes: ['reminder_key', 'notification_count'],
      });

      const sentReminderKeys = new Set(existingReminders.map(r => r.reminder_key));

     
      for (const reminder of stageConfig.reminders) {
        const dueTime = stageStartedAt + reminder.delayMs;

       
        if (now < dueTime) continue;

      
        if (sentReminderKeys.has(reminder.key)) continue;

        
        const currentNotificationCount = existingReminders.reduce(
          (sum, r) => sum + r.notification_count, 0
        );

        if (currentNotificationCount >= stageConfig.maxNotifications) {
          console.log(`[CRON] User ${user.id} reached max notifications (${stageConfig.maxNotifications}) for stage ${stage}`);
          continue;
        }

     
        notificationsToSend.push({
          user_id: user.id,
          title: reminder.title,
          body: reminder.body,
        });

     
        remindersToCreate.push({
          user_id: user.id,
          stage,
          reminder_key: reminder.key,
          notification_count: 1,
        });
      }
    }


    if (notificationsToSend.length > 0) {
      await sendNotificationsBatch(notificationsToSend);
      totalNotificationsSent += notificationsToSend.length;
    }


    if (remindersToCreate.length > 0) {
      await OnboardingReminder.bulkCreate(remindersToCreate, {
        ignoreDuplicates: true,
      });
    }

    totalProcessed += users.length;
    offset += BATCH_CONFIG.USER_BATCH_SIZE;

    console.log(`[CRON] Processed batch: ${users.length} users, ${notificationsToSend.length} notifications queued`);
  }

  console.log(`[CRON] Completed: ${totalProcessed} users processed, ${totalNotificationsSent} notifications sent`);
}


async function incrementReminderCount(userId, stage, reminderKey) {
  const reminder = await OnboardingReminder.findOne({
    where: { user_id: userId, stage, reminder_key: reminderKey },
  });

  if (reminder) {
    reminder.notification_count += 1;
    await reminder.save();
    return reminder;
  }

  return null;
}

function startOnboardingCron() {
  cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Processing onboarding reminders...');
    try {
      await processOnboardingReminders();
    } catch (err) {
      console.error('[CRON] Error:', err);
    }
  });
  console.log('[CRON] Onboarding reminder job scheduled (every 5 min).');
}

module.exports = { startOnboardingCron, processOnboardingReminders, incrementReminderCount };
