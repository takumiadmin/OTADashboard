import express from 'express';
import cors from 'cors';
import { DynamoDBClient, ScanCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

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

// Route: Get all tools from tmclistoftools table
router.get('/tools', async (req, res) => {
  try {
    const command = new ScanCommand({
      TableName:'tmclistoftools',
      ProjectionExpression: '#serialNumber, EquipmentType, #activationStatus, CHC, Customer, #dateOfManufacture, Distributor, #registeredGeoLocation, Size, #status, #underSubsidy',
      ExpressionAttributeNames: {
        '#serialNumber': 'Serial Number',
        '#activationStatus': 'Activation Status',
        '#dateOfManufacture': 'Date of Manufacture',
        '#registeredGeoLocation': 'Registered Geo Location',
        '#status': 'Status',
        '#underSubsidy': 'Under Subsidy',
      },
    });

    const result = await client.send(command);
    
    console.log('Raw DynamoDB Items:', JSON.stringify(result.Items, null, 2));

    if (!result.Items || result.Items.length === 0) {
      console.log('No items found in tmclistoftools table');
      return res.json({ tools: [] });
    }

    const tools = result.Items.map(item => ({
      serialNumber: item['Serial Number']?.N ? Number(item['Serial Number'].N) : 0,
      equipmentType: item.EquipmentType?.S || 'N/A',
      activationStatus: item['Activation Status']?.S || 'N/A',
      chc: item.CHC?.S || 'N/A',
      customer: item.Customer?.S || 'N/A',
      manufactureDate: item['Date of Manufacture']?.S || 'N/A',
      distributor: item.Distributor?.S || 'N/A',
      geoLocation: item['Registered Geo Location']?.S || 'N/A',
      size: item.Size?.S || 'N/A',
      status: item.Status?.S || 'N/A',
      underSubsidy: item['Under Subsidy']?.S || 'N/A',
    }));

    res.json({ tools });
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ error: `Failed to fetch tools: ${error.message}` });
  }
});

// Route: Add a new tool
router.post('/tools', async (req, res) => {
  const {
    serialNumber,
    equipmentType,
    activationStatus,
    chc,
    customer,
    manufactureDate,
    distributor,
    geoLocation,
    size,
    status,
    underSubsidy,
  } = req.body;

  // Validate required fields
  if (!serialNumber || !equipmentType) {
    return res.status(400).json({ error: 'Serial Number and Equipment Type are required' });
  }

  // Validate Serial Number (6 digits)
  if (!/^\d{6}$/.test(serialNumber.toString())) {
    return res.status(400).json({ error: 'Serial Number must be a 6-digit number' });
  }

  // Validate EquipmentType
  if (!['Tiller', 'Eweeder'].includes(equipmentType)) {
    return res.status(400).json({ error: 'Equipment Type must be Tiller or Eweeder' });
  }

  // Validate Status
  if (!['Plant', 'Distributor', 'Customer', 'CHC', 'Decommissioned', 'Defective'].includes(status)) {
    return res.status(400).json({ error: 'Invalid Status value' });
  }

  // Validate Activation Status
  if (!['Inactive', 'Active', 'Deactivated'].includes(activationStatus)) {
    return res.status(400).json({ error: 'Invalid Activation Status value' });
  }

  // Validate Under Subsidy
  if (!['Yes', 'No'].includes(underSubsidy)) {
    return res.status(400).json({ error: 'Under Subsidy must be Yes or No' });
  }

  try {
    const command = new PutItemCommand({
      TableName: 'tmclistoftools',
      Item: {
        'Serial Number': { N: serialNumber.toString() },
        EquipmentType: { S: equipmentType },
        'Activation Status': { S: activationStatus || 'Inactive' },
        CHC: { S: chc || 'N/A' },
        Customer: { S: customer || 'N/A' },
        'Date of Manufacture': { S: manufactureDate || 'N/A' },
        Distributor: { S: distributor || 'N/A' },
        'Registered Geo Location': { S: geoLocation || 'N/A' },
        Size: { S: size || 'N/A' },
        Status: { S: status || 'N/A' },
        'Under Subsidy': { S: underSubsidy || 'No' },
      },
      ConditionExpression: 'attribute_not_exists(#serialNumber) AND attribute_not_exists(EquipmentType)',
      ExpressionAttributeNames: {
        '#serialNumber': 'Serial Number',
      },
    });

    await client.send(command);
    res.json({ message: 'Tool added successfully' });
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      res.status(400).json({ error: 'Tool with this Serial Number and Equipment Type already exists' });
    } else {
      console.error('Error adding tool:', error);
      res.status(500).json({ error: `Failed to add tool: ${error.message}` });
    }
  }
});

// Route: Update a tool
router.put('/tools', async (req, res) => {
  const {
    serialNumber,
    equipmentType,
    activationStatus,
    chc,
    customer,
    manufactureDate,
    distributor,
    geoLocation,
    size,
    status,
    underSubsidy,
  } = req.body;

  // Validate required fields
  if (!serialNumber || !equipmentType) {
    return res.status(400).json({ error: 'Serial Number and Equipment Type are required' });
  }

  // Validate Serial Number (6 digits)
  if (!/^\d{6}$/.test(serialNumber.toString())) {
    return res.status(400).json({ error: 'Serial Number must be a 6-digit number' });
  }

  // Validate EquipmentType
  if (!['Tiller', 'Eweeder'].includes(equipmentType)) {
    return res.status(400).json({ error: 'Equipment Type must be Tiller or Eweeder' });
  }

  // Validate Status
  if (!['Plant', 'Distributor', 'Customer', 'CHC', 'Decommissioned', 'Defective'].includes(status)) {
    return res.status(400).json({ error: 'Invalid Status value' });
  }

  // Validate Activation Status
  if (!['Inactive', 'Active', 'Deactivated'].includes(activationStatus)) {
    return res.status(400).json({ error: 'Invalid Activation Status value' });
  }

  // Validate Under Subsidy
  if (!['Yes', 'No'].includes(underSubsidy)) {
    return res.status(400).json({ error: 'Under Subsidy must be Yes or No' });
  }

  try {
    const command = new UpdateItemCommand({
      TableName: 'tmclistoftools',
      Key: {
        'Serial Number': { N: serialNumber.toString() },
        EquipmentType: { S: equipmentType },
      },
      UpdateExpression: 'SET #activationStatus = :activationStatus, CHC = :chc, Customer = :customer, #dateOfManufacture = :manufactureDate, Distributor = :distributor, #registeredGeoLocation = :geoLocation, Size = :size, #status = :status, #underSubsidy = :underSubsidy',
      ExpressionAttributeNames: {
        '#activationStatus': 'Activation Status',
        '#dateOfManufacture': 'Date of Manufacture',
        '#registeredGeoLocation': 'Registered Geo Location',
        '#status': 'Status',
        '#underSubsidy': 'Under Subsidy',
      },
      ExpressionAttributeValues: {
        ':activationStatus': { S: activationStatus || 'Inactive' },
        ':chc': { S: chc || 'N/A' },
        ':customer': { S: customer || 'N/A' },
        ':manufactureDate': { S: manufactureDate || 'N/A' },
        ':distributor': { S: distributor || 'N/A' },
        ':geoLocation': { S: geoLocation || 'N/A' },
        ':size': { S: size || 'N/A' },
        ':status': { S: status || 'N/A' },
        ':underSubsidy': { S: underSubsidy || 'No' },
      },
    });

    await client.send(command);
    res.json({ message: 'Tool updated successfully' });
  } catch (error) {
    console.error('Error updating tool:', error);
    res.status(500).json({ error: `Failed to update tool: ${error.message}` });
  }
});

// Route: Delete a tool
router.delete('/tools', async (req, res) => {
  const { serialNumber, equipmentType } = req.body;

  if (!serialNumber || !equipmentType) {
    return res.status(400).json({ error: 'Serial Number and Equipment Type are required' });
  }

  try {
    const command = new DeleteItemCommand({
      TableName: 'tmclistoftools',
      Key: {
        'Serial Number': { N: serialNumber.toString() },
        EquipmentType: { S: equipmentType },
      },
    });

    await client.send(command);
    res.json({ message: 'Tool deleted successfully' });
  } catch (error) {
    console.error('Error deleting tool:', error);
    res.status(500).json({ error: `Failed to delete tool: ${error.message}` });
  }
});

export default router;
