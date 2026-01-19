const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { COMPLAINT_TYPES, COMPLAINT_STATUSES, VALID_STATUS_TRANSITIONS } = require('../constants');

const Complaint = sequelize.define('Complaint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  complaint_type: {
    type: DataTypes.ENUM(...COMPLAINT_TYPES),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(...COMPLAINT_STATUSES),
    defaultValue: 'raised',
  },
  status_updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'complaints',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Complaint.TYPES = COMPLAINT_TYPES;
Complaint.STATUSES = COMPLAINT_STATUSES;
Complaint.VALID_TRANSITIONS = VALID_STATUS_TRANSITIONS;

Complaint.isValidTransition = function(fromStatus, toStatus) {
  const allowed = VALID_STATUS_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
};


Complaint.getAllowedTransitions = function(status) {
  return VALID_STATUS_TRANSITIONS[status] || [];
};

module.exports = Complaint;
