const amqp = require('amqplib');

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
  try {
    const rabbitMqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
    connection = await amqp.connect(rabbitMqUrl);
    channel = await connection.createChannel();
    
    // Assert required queues
    const queueOptions = { durable: true };
    await channel.assertQueue('fraud_tasks', queueOptions);
    
    console.log('🐇 Connected to RabbitMQ successfully');
    
    return { connection, channel };
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    // Determine if app should crash or retry. For now, log the error.
    setTimeout(connectRabbitMQ, 5000); // Retry connection after 5 seconds
    return null;
  }
};

const getChannel = () => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
};

const closeRabbitMQ = async () => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('RabbitMQ connection closed');
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
  }
};

module.exports = {
  connectRabbitMQ,
  getChannel,
  closeRabbitMQ
};
