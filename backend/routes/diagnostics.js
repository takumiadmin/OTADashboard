import express from 'express';
import cors from 'cors';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

const router = express.Router();
router.use(cors());

// Initialize DynamoDB client with AWS SDK v3
const client = new DynamoDBClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: '//put the access key id here',
    secretAccessKey: '//put the secret access key here',
  },
});

// All available diagnostic parameters
const parameters = [
  'actual_irms',
  'actual_speed',
  'actual_state',
  'actual_torque_ref',
  'advance_angle_ref',
  'alarm_flag_1',
  'current_dc',
  'current_id',
  'current_iq',
  'current_irms_ref',
  'efficiency_flag_1',
  'igbt_temp_h3',
  'int_temp',
  'speed_ref',
  'state',
  'throttle_adc',
  'torque_ref',
  'voltage_vdc',
  'voltage_vrms',
];

// Route: Get available parameters
router.get('/parameters', (req, res) => {
  res.json(parameters);
});

// Route: Get device types
router.get('/device-types', async (req, res) => {
  try {
    const command = new ScanCommand({
      TableName: 'tmcdevdevicedb',
      ProjectionExpression: 'devicetype',
    });
    const result = await client.send(command);
    const deviceTypes = [...new Set(result.Items.map(item => item.devicetype.S))];
    res.json({ deviceTypes });
  } catch (error) {
    console.error('Error fetching device types:', error);
    res.status(500).json({ error: 'Failed to fetch device types' });
  }
});

// Route: Get device IDs
router.get('/device-ids', async (req, res) => {
  try {
    const { devicetype } = req.query;
    if (!devicetype) {
      return res.status(400).json({ error: 'devicetype is required' });
    }

    const command = new ScanCommand({
      TableName: 'tmcdevdevicedb',
      FilterExpression: 'devicetype = :devicetype',
      ExpressionAttributeValues: {
        ':devicetype': { S: devicetype },
      },
      ProjectionExpression: 'deviceid',
    });
    const result = await client.send(command);
    const deviceIds = [...new Set(result.Items.map(item => item.deviceid.S))];
    res.json({ deviceIds });
  } catch (error) {
    console.error('Error fetching device IDs:', error);
    res.status(500).json({ error: 'Failed to fetch device IDs' });
  }
});

// Route: Get diagnostic data for a deviceid (VIN)
router.get('/data/:deviceid', async (req, res) => {
  const { deviceid } = req.params;
  const { params } = req.query;

  const selectedParams = params ? String(params).split(',') : parameters;

  try {
    const command = new ScanCommand({
      TableName: 'testcandata',
      FilterExpression: 'deviceid = :deviceid',
      ExpressionAttributeValues: {
        ':deviceid': { S: deviceid },
      },
    });

    const result = await client.send(command);
    const items = result.Items || [];

    if (items.length === 0) {
      console.log(`No items found for deviceid: ${deviceid}`);
    }

    const data = {};
    selectedParams.forEach((param) => {
      data[param] = items.map((item) => ({
        timestamp: item.timestamp.S, // ISO string from DynamoDB
        value: item[param] ? (item[param].N ? Number(item[param].N) : item[param].S) : null,
      }));
    });

    console.log('Sending data:', { deviceid, data }); // Debug log
    res.json({
      deviceid,
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching DynamoDB data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Route: Export diagnostic data
router.post('/export', async (req, res) => {
  const { deviceid, params } = req.body;
  const selectedParams = params || parameters;

  try {
    const command = new ScanCommand({
      TableName: 'testcandata',
      FilterExpression: 'deviceid = :deviceid',
      ExpressionAttributeValues: {
        ':deviceid': { S: deviceid },
      },
    });

    const result = await client.send(command);
    const items = result.Items || [];

    const data = {};
    selectedParams.forEach((param) => {
      data[param] = items.map((item) => ({
        timestamp: item.timestamp.S,
        value: item[param] ? (item[param].N ? Number(item[param].N) : item[param].S) : null,
      }));
    });

    res.json({
      deviceid,
      data,
      exportTimestamp: Date.now(),
      format: 'CSV',
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;
