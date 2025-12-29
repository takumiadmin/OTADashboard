// utils/messageutils.js
import { IoTDataPlaneClient, PublishCommand } from '@aws-sdk/client-iot-data-plane';

const iotClient = new IoTDataPlaneClient({
  region: 'ap-south-1'
});

// Publish MQTT message function with retain flag
export async function publishMqttMessage(topic, message, qos = 1) {
  try {
    const payload = {
      ...message, // Spread the message object to include all fields
      timestamp: new Date().toISOString() // Add timestamp
    };

    const command = new PublishCommand({
      topic,
      payload: Buffer.from(JSON.stringify(payload)),
      qos, // QoS 1 by default, ensuring "at least once" delivery
      retain: true // Retain the message on the broker
    });

    console.log('Publishing to:', command.input.topic, 'with retain: true');
    const response = await iotClient.send(command);

    return {
      success: true,
      message: 'MQTT message published',
      data: {
        topic,
        messageId: response.$metadata.requestId
      }
    };
  } catch (error) {
    console.error('Publish Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    throw {
      success: false,
      error: 'Publish failed',
      details: {
        code: error.name,
        message: error.message,
        suggestion: 'Verify AWS IoT permissions, region, and topic subscription'
      }
    };
  }
}