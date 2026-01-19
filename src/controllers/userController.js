const { User, Complaint, OnboardingReminder } = require('../models');


async function getUserDetails(req, res) {
  try {
    // Geting user with complaints count using joins
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'name', 'email', 'onboarding_stage', 'onboarding_stage_updated_at', 'created_at'],
      include: [{
        model: Complaint,
        attributes: ['id', 'complaint_type', 'status', 'created_at'],
      }],
    });

    // console.log("User complaints count-->",user.Complaints.length);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Geting onboarding reminder stats for current user
    const reminderStats = await OnboardingReminder.findAll({
      where: { user_id: user.id },
      attributes: ['stage', 'notification_count'],
      order: [['stage', 'ASC']],
    });

    // Grouping notifications by stage
    const notificationsByStage = {};
    for (const reminder of reminderStats) {
      if (!notificationsByStage[reminder.stage]) {
        notificationsByStage[reminder.stage] = 0;
      }
      notificationsByStage[reminder.stage] += reminder.notification_count;
    }

    const complaintStats = {
      total: user.Complaints.length,
      by_status: {},
      by_type: {},
    };

    for (const complaint of user.Complaints) {
      complaintStats.by_status[complaint.status] = (complaintStats.by_status[complaint.status] || 0) + 1;
      complaintStats.by_type[complaint.complaint_type] = (complaintStats.by_type[complaint.complaint_type] || 0) + 1;
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboarding_stage: user.onboarding_stage,
        onboarding_complete: user.onboarding_stage >= 3,
        onboarding_stage_updated_at: user.onboarding_stage_updated_at,
        created_at: user.created_at,
      },
      complaint_stats: complaintStats,
      onboarding_notifications_by_stage: notificationsByStage,
      message: 'User details fetched successfully',
    });

  }
   catch (err) {
    console.error('Get user details error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error while fetching user details',
    });
  }
}


async function updateOnboardingStage(req, res) {
  try {
    const { stage } = req.body;

    if (typeof stage !== 'number' || stage < 0 || stage > 3) {
      return res.status(400).json({
        success: false,
        message: 'stage must be a number between 0 and 3',
      });
    }

    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Signup first.',
      });
    }

    const previousStage = user.onboarding_stage;

    user.onboarding_stage = stage;
    user.onboarding_stage_updated_at = new Date();
    await user.save();

    return res.json({
      success: true,
      message: 'Onboarding stage updated..',
      previous_stage: previousStage,
      current_stage: stage,
      onboarding_complete: stage >= 3,
    });
  } 
  catch (err) { 
    console.error('Update onboarding stage error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error while updating onboarding stage',
    });
  }
}

module.exports = {getUserDetails,updateOnboardingStage};
