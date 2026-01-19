const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OnboardingReminder = sequelize.define('OnboardingReminder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  stage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Onboarding stage (0, 1, 2)',
  },
  reminder_key: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Unique key for the reminder type (e.g., 24h, 3d, 5d)',
  },
  notification_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Number of notifications sent for this stage+reminder combination',
  },
}, {
  tableName: 'onboarding_reminders',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['user_id', 'stage', 'reminder_key'] },
    { fields: ['user_id', 'stage'] },// for quering notification by stage..
  ],
});

//counting total noticfications sent for a user at a particular stage
OnboardingReminder.getStageNotificationCount = async function(userId, stage) {
  const result = await this.findAll({
    where: { user_id: userId, stage },
    attributes: [[sequelize.fn('SUM', sequelize.col('notification_count')), 'total']],
    raw: true,
  });
  return result[0]?.total || 0;
};


//notification counts for all stages of a user

OnboardingReminder.getUserNotificationStats = async function(userId) {
  const results = await this.findAll({
    where: { user_id: userId },
    attributes: [
      'stage',
      [sequelize.fn('SUM', sequelize.col('notification_count')), 'total_notifications'],
      [sequelize.fn('COUNT', sequelize.col('reminder_key')), 'unique_reminders'],
    ],
    group: ['stage'],
    raw: true,
  });
  
  const stats = {};
  for (const row of results) {
    stats[row.stage] = {
      total_notifications: parseInt(row.total_notifications) || 0,
      unique_reminders: parseInt(row.unique_reminders) || 0,
    };
  }
  return stats;
};

module.exports = OnboardingReminder;
