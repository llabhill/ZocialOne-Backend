const { Notification } = require('../models');
const { chunkArray } = require('../utils/helpers');
const { BATCH_CONFIG } = require('../constants');


async function sendNotification(userId, title, body) {
  const notification = await Notification.create({
    user_id: userId,
    title,
    body,
    is_sent: true,
  });
  console.log(`[NOTIFICATION] To user ${userId}: ${title} - ${body}`);
  return notification;
}


async function sendNotificationsBatch(notifications) {
  if (!notifications || notifications.length === 0) {
    return [];
  }

  const results = [];
  const batches = chunkArray(notifications, BATCH_CONFIG.NOTIFICATION_BATCH_SIZE);

  for (const batch of batches) {

    const batchData = batch.map(n => ({
      user_id: n.user_id,
      title: n.title,
      body: n.body,
      is_sent: true,
      created_at: new Date(),
    }));

    const created = await Notification.bulkCreate(batchData, {
      returning: true,
    });

    results.push(...created);

    console.log(`[NOTIFICATION BATCH] Sent ${batch.length} notifications`);
    for (const n of batch) {
      console.log(`  -> User ${n.user_id}: ${n.title}`);
    }
  }

  return results;
}


function getComplaintNotificationContent(status, complaintId) {
  const templates = {
    in_progress: {
      title: 'Complaint In Progress',
      body: `Your complaint #${complaintId} is now being worked on.`,
    },
    resolved: {
      title: 'Complaint Resolved',
      body: `Your complaint #${complaintId} has been resolved. Thank you for your patience!`,
    },
    waiting_on_user: {
      title: 'Action Required',
      body: `Your complaint #${complaintId} requires your response. Please check and respond.`,
    },
    closed: {
      title: 'Complaint Closed',
      body: `Your complaint #${complaintId} has been closed. Thank you for using our support!`,
    },
  };
  return templates[status] || null;
}

module.exports = {
  sendNotification,
  sendNotificationsBatch,
  getComplaintNotificationContent,
};
