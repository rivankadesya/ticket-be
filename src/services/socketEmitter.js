const emit = (io, channel, event, data) => {
  if (!io) return;
  io.emit(`${channel}:${event}`, data);
};

module.exports = { emit };
