import express from 'express';
import { get_device_types, get_items_by_attributes, update_item, getCompanyByUsername } from './utils/dbutils.js';
import { authenticateUser } from './authmiddleware.js';
import { publishMqttMessage } from './utils/messageutils.js';

const router = express.Router();
router.use(express.json());

// Fetch device types
router.get('/device-types', authenticateUser, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No username found' });
    }

    console.log(`🔍 Fetching device types for user: ${username}`);
    const deviceTypes = await get_device_types(username);
    res.json({ success: true, deviceTypes: [...new Set(deviceTypes)] });
  } catch (error) {
    console.error('Error fetching device types:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch device types', error: error.message });
  }
});

// Fetch versions
router.get('/versions', authenticateUser, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No username found' });
    }

    const { devicetype, ecutype, bintype } = req.query;
    if (!devicetype || !ecutype || !bintype) {
      return res.status(400).json({ success: false, message: 'devicetype, ecutype, and bintype are required' });
    }

    console.log(`🔍 Fetching versions for user: ${username} with filters: ${devicetype}, ${ecutype}, ${bintype}`);
    const versions = await get_items_by_attributes('tmcdevfirmwaredb', 'version', { devicetype, ecutype, bintype });
    res.json({ success: true, versions: [...new Set(versions)].sort() });
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch versions', error: error.message });
  }
});

// Fetch device IDs
router.get('/device-ids', authenticateUser, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No username found' });
    }

    const { devicetype } = req.query;
    if (!devicetype) {
      return res.status(400).json({ success: false, message: 'devicetype is required' });
    }

    console.log(`🔍 Fetching device IDs for devicetype: ${devicetype}`);
    const deviceIds = await get_items_by_attributes('tmcdevdevicedb', 'deviceid', { devicetype });
    res.json({ success: true, deviceIds: [...new Set(deviceIds)] });
  } catch (error) {
    console.error('Error fetching device IDs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch device IDs', error: error.message });
  }
});

// Schedule firmware update
router.post('/schedule-update', authenticateUser, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No username found' });
    }

    const { devicetype, ecutype, bintype, version, updateType, deviceIds = [] } = req.body;
    if (!devicetype || !ecutype || !bintype || !version || !updateType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    console.log(`🔍 Scheduling update for user: ${username}, device: ${devicetype}`);

    const company = await getCompanyByUsername(username);
    if (!company) {
      return res.status(400).json({ success: false, message: 'Company not found for user' });
    }

    const availableDeviceTypes = await get_device_types(username);
    if (!availableDeviceTypes.includes(devicetype)) {
      return res.status(400).json({ success: false, message: 'Device type not found for this company' });
    }

    const firmwareAttributes = { devicetype, ecutype, bintype, version };
    let message = {};

    if (ecutype === 'MCU') {
      if (bintype === 'Firmware') {
        const [mcufwbinaryurl] = await get_items_by_attributes('tmcdevfirmwaredb', 'mcufwbinaryurl', firmwareAttributes);
        const mcufwrequiredurl = await get_items_by_attributes('tmcdevfirmwaredb', 'mcufwrequiredurl', firmwareAttributes);
        const requiredver = await get_items_by_attributes('tmcdevfirmwaredb', 'requiredver', firmwareAttributes);
        message = {
          ecutype,
          bintype,
          version,
          mcufwbinaryurl,
          requiredver: requiredver[0] || 'N/A',
          mcufwrequiredurl: mcufwrequiredurl[0] || 'N/A',
          forced: 'yes'
        };
      } else if (bintype === 'Configuration') {
        const [mcucfgbinaryurl] = await get_items_by_attributes('tmcdevfirmwaredb', 'mcuconfigurl', firmwareAttributes);
        const mcucfgrequiredurl = await get_items_by_attributes('tmcdevfirmwaredb', 'mcuconfigrequiredurl', firmwareAttributes);
        const requiredver = await get_items_by_attributes('tmcdevfirmwaredb', 'requiredver', firmwareAttributes);
        message = {
          ecutype,
          bintype,
          version,
          mcucfgbinaryurl,
          requiredver: requiredver[0] || 'N/A',
          mcucfgrequiredurl: mcucfgrequiredurl[0] || 'N/A',
          forced: 'yes'
        };
      }
    } else if (ecutype === 'VCU') {
      const [vcufwbinaryurla] = await get_items_by_attributes('tmcdevfirmwaredb', 'vcufwbinaryurla', firmwareAttributes);
      const [vcufwbinaryurlb] = await get_items_by_attributes('tmcdevfirmwaredb', 'vcufwbinaryurlb', firmwareAttributes);
      const vcufwrequiredurla = await get_items_by_attributes('tmcdevfirmwaredb', 'vcufwrequiredurla', firmwareAttributes);
      const vcufwrequiredurlb = await get_items_by_attributes('tmcdevfirmwaredb', 'vcufwrequiredurlb', firmwareAttributes);
      const requiredver = await get_items_by_attributes('tmcdevfirmwaredb', 'requiredver', firmwareAttributes);
      message = {
        ecutype,
        bintype,
        version,
        binaryurla: vcufwbinaryurla,
        binaryurlb: vcufwbinaryurlb,
        requiredver: requiredver[0] || 'N/A',
        requiredverurla: vcufwrequiredurla[0] || 'N/A',
        requiredverurlb: vcufwrequiredurlb[0] || 'N/A',
        forced: 'yes'
      };
    }

    let targetDeviceIds = deviceIds;
    if (updateType === 'Update All') {
      targetDeviceIds = await get_items_by_attributes('tmcdevdevicedb', 'deviceid', { devicetype });
    }

    if (!targetDeviceIds || targetDeviceIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No devices found for the selected criteria' });
    }

    const publishResults = [];
    if (updateType === 'Update All') {
      const topic = `/upgrade/${devicetype}`;
      const result = await publishMqttMessage(topic, message);
      publishResults.push(result);
    } else {
      for (const deviceId of targetDeviceIds) {
        const topic = `/upgrade/${devicetype}/${deviceId}`;
        const result = await publishMqttMessage(topic, message);
        publishResults.push(result);
      }
    }

    for (const deviceId of targetDeviceIds) {
      if (ecutype === 'MCU') {
        if (bintype === 'Firmware') {
          await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', devicetype, 'mcu1lastpushedfwversion', version);
        } else if (bintype === 'Configuration') {
          await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', devicetype, 'mcu1lastpushedcfgchecksum', version);
        }
      } else if (ecutype === 'VCU') {
        await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', devicetype, 'vculastpushedversion', version);
      }
    }

    res.json({
      success: true,
      message: `Firmware update scheduled for version ${version} on devices: ${targetDeviceIds.join(', ')}`,
      data: { publishResults }
    });
  } catch (error) {
    console.error('Error scheduling update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule firmware update',
      error: error.message || 'Unknown error'
    });
  }
});

export default router;
