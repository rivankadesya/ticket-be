const PushNotifications = require('@pusher/push-notifications-server');

let beamsClient = null;

const getBeamsClient = () => {
  if (beamsClient) return beamsClient;

  const instanceId = process.env.PUSHER_BEAMS_INSTANCE_ID;
  const secretKey = process.env.PUSHER_BEAMS_SECRET_KEY;

  if (!instanceId || !secretKey) {
    console.warn('Pusher Beams credentials not configured — push notifications disabled');
    return null;
  }

  beamsClient = new PushNotifications({ instanceId, secretKey });
  return beamsClient;
};

const generateToken = (userId) => {
  const client = getBeamsClient();
  if (!client) return null;
  return client.generateToken(userId);
};

const publishToUsers = async (userIds, title, body) => {
  if (!userIds || userIds.length === 0) return;

  const client = getBeamsClient();
  if (!client) return;

  try {
    await client.publishToUsers(userIds, {
      web: {
        notification: { title, body },
      },
    });
  } catch (error) {
    console.error('Pusher publish error:', error);
  }
};

module.exports = { getBeamsClient, generateToken, publishToUsers };
