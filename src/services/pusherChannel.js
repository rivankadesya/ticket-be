const Pusher = require('pusher');

let pusherClient = null;

const getPusher = () => {
  if (pusherClient) return pusherClient;

  const { PUSHER_CHANNELS_APP_ID, PUSHER_CHANNELS_KEY, PUSHER_CHANNELS_SECRET, PUSHER_CHANNELS_CLUSTER } = process.env;

  if (!PUSHER_CHANNELS_APP_ID || !PUSHER_CHANNELS_KEY || !PUSHER_CHANNELS_SECRET || !PUSHER_CHANNELS_CLUSTER) {
    console.warn('Pusher Channels credentials not configured — real-time disabled');
    return null;
  }

  pusherClient = new Pusher({
    appId: PUSHER_CHANNELS_APP_ID,
    key: PUSHER_CHANNELS_KEY,
    secret: PUSHER_CHANNELS_SECRET,
    cluster: PUSHER_CHANNELS_CLUSTER,
    useTLS: true,
  });

  return pusherClient;
};

const trigger = async (channel, event, data) => {
  const client = getPusher();
  if (!client) return;
  try {
    await client.trigger(channel, event, data);
  } catch (error) {
    console.error('Pusher trigger error:', error);
  }
};

module.exports = { getPusher, trigger };
