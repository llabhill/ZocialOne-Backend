

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function formatStatusTransitionError(currentStatus, newStatus, allowedTransitions) {
  if (allowedTransitions.length === 0) {
    return `Cannot change status from '${currentStatus}' - this is a terminal state`;
  }
  return `Invalid status transition: '${currentStatus}' → '${newStatus}'. Allowed transitions from '${currentStatus}': [${allowedTransitions.join(', ')}]`;
}

function getTimeDifferenceMinutes(startDate, endDate = new Date()) {
  return Math.floor((new Date(endDate) - new Date(startDate)) / 60000);
}

module.exports = {
  chunkArray,
  formatStatusTransitionError,
  getTimeDifferenceMinutes,
};
