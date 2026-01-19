const { Complaint, User } = require('../models');
const { sendNotification, getComplaintNotificationContent } = require('../services/notificationService');
const { formatStatusTransitionError, getTimeDifferenceMinutes } = require('../utils/helpers');
const { COMPLAINT_TYPES, VALID_STATUS_TRANSITIONS } = require('../constants');


async function raiseTicket(req, res) {
  try {

    const { complaint_type, description } = req.body;
    
    if (!complaint_type) {
      return res.status(400).json({
        success: false,
        message: 'complaint_type is required',
        valid_types: COMPLAINT_TYPES,
      });
    }
    
    if (!COMPLAINT_TYPES.includes(complaint_type)) {
      return res.status(400).json({
        success: false,
        message: `complaint_type must be one of: ${COMPLAINT_TYPES.join(', ')}`,
        valid_types: COMPLAINT_TYPES,
      });
    }

    const initialStatus = complaint_type === 'live_demo' ? 'in_progress' : 'raised';

    const complaint = await Complaint.create({
      user_id: req.userId,
      complaint_type,
      description: description || null,
      status: initialStatus,
      status_updated_at: new Date(),
    });
    
    if (initialStatus === 'in_progress') {
      const content = getComplaintNotificationContent('in_progress', complaint.id);
      if (content) {
        await sendNotification(req.userId, content.title, content.body);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Complaint created successfully',
      complaint: {
        id: complaint.id,
        user_id: complaint.user_id,
        complaint_type: complaint.complaint_type,
        description: complaint.description,
        status: complaint.status,
        created_at: complaint.created_at,
        updated_at: complaint.updated_at,
        status_updated_at: complaint.status_updated_at,
      },
    });
  } 
  catch (err) {
    console.error('Raise ticket error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error while raising complaint..',
    });
  }
}


async function updateStatus(req, res) {
  try {
    const { id } = req.params;

    const { status: newStatus } = req.body;

    if (!newStatus || !Complaint.STATUSES.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${Complaint.STATUSES.join(', ')}`,
      });
    }

    //finding complaint associated with user
    const complaint = await Complaint.findOne({
      where: { id, user_id: req.userId },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email'],
      }],
    });
    //console.log("User joined complaint-->",complaint);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found',
      });
    }

    const currentStatus = complaint.status;
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status transition..',
        error: formatStatusTransitionError(currentStatus, newStatus, allowedTransitions),
        current_status: currentStatus,
        allowed_transitions: allowedTransitions,
      });
    }

    complaint.status = newStatus;
    complaint.status_updated_at = new Date();
    await complaint.save();

    //sending nortification to user for status update
    const content = getComplaintNotificationContent(newStatus, complaint.id);
    if (content) {
      await sendNotification(req.userId, content.title, content.body);
    }

    return res.json({
      success: true,
      message: `Status updated from '${currentStatus}' to '${newStatus}'`,
      complaint: {
        id: complaint.id,
        complaint_type: complaint.complaint_type,
        status: complaint.status,
        previous_status: currentStatus,
        status_updated_at: complaint.status_updated_at,
      },
    });
  } 
  catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error while updating status..',
    });
  }
}


async function getMetrics(req, res) {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findOne({
      where: { id, user_id: req.userId },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email'],
      }],
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found',
      });
    }

    const now = new Date();
    const totalTimeMinutes = getTimeDifferenceMinutes(complaint.created_at, now);
    const timeInCurrentStatusMinutes = getTimeDifferenceMinutes(complaint.status_updated_at, now);

    return res.json({
      success: true,
      message: 'Complaint metrics fetched successfully..',
      complaint_id: complaint.id,
      complaint_type: complaint.complaint_type,
      current_status: complaint.status,
      time_in_current_status_minutes: timeInCurrentStatusMinutes,
      total_time_minutes: totalTimeMinutes,
      user: complaint.User,
    });
  } 
  catch (err) {
    console.error('Get metrics error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error while fetching complaint metrics..',
    });
  }
}

//getting all complaints of a user with filters and pagination
async function getUserComplaints(req, res) {
  try {
    const { status, complaint_type, page = 1, limit = 10 } = req.query;

    
    const where = { user_id: req.userId };
    if (status) where.status = status;
    if (complaint_type) where.complaint_type = complaint_type;

    
    const { rows: complaints, count: total } = await Complaint.findAndCountAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'name', 'email'],
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    return res.json({
      success: true,
      complaints,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get user complaints error:', err);
    return res.status(500).json({
      success: false,
      error: 'Error while fetching user complaints..',
    });
  }
}

module.exports = {
  raiseTicket,
  updateStatus,
  getMetrics,
  getUserComplaints,
};
