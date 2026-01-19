const User = require('./User');
const Complaint = require('./Complaint');
const Notification = require('./Notification');
const OnboardingReminder = require('./OnboardingReminder');

User.hasMany(Complaint, { foreignKey: 'user_id' });
Complaint.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(OnboardingReminder, { foreignKey: 'user_id' });
OnboardingReminder.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { User, Complaint, Notification, OnboardingReminder };
