import express from 'express';
import { get_items_by_attributes, get_item, update_item, getCompanyByUsername } from './utils/dbutils.js';
import { authenticateUser } from './authmiddleware.js';
import { publishMqttMessage } from './utils/messageutils.js'; // Adjust path if needed

const router = express.Router();
router.use(express.json());

router.get('/device-types', authenticateUser, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const company = await getCompanyByUsername(username);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    const deviceTypes = await get_items_by_attributes('tmcdevdevicedb', 'devicetype', { company });
    if (!deviceTypes || deviceTypes.length === 0) {
      return res.status(404).json({ success: false, message: 'No device types found' });
    }
    res.json({ success: true, deviceTypes: [...new Set(deviceTypes)] });
  } catch (error) {
    console.error('Error fetching device types:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch device types' });
  }
});

router.post('/link-vin-vcu', authenticateUser, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { deviceType, vcuSerialNumber, vinSerialNumber, override = false } = req.body;
    if (!deviceType || !vcuSerialNumber || !vinSerialNumber) {
      return res.status(400).json({ success: false, message: 'Device Type, VCU Serial Number, and VIN Serial Number are required' });
    }
    const company = await getCompanyByUsername(username);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    const deviceDataList = await get_item('tmcdevdevicedb', 'deviceid', vcuSerialNumber);
    if (!deviceDataList || deviceDataList.length === 0) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    const deviceData = deviceDataList.find(item => item.devicetype?.S === deviceType);
    if (!deviceData) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    if (deviceData.vehicleid && deviceData.vehicleid.S !== vinSerialNumber && !override) {
      return res.status(409).json({ success: false, message: 'VCU is already linked to a different VIN', overrideRequired: true });
    }
    await update_item(
      'tmcdevdevicedb',
      'deviceid',
      vcuSerialNumber,
      'devicetype',
      deviceType,
      'vehicleid',
      vinSerialNumber
    );
    res.json({ success: true, message: override ? 'Successfully linked new VIN' : 'Successfully linked VIN with VCU' });
  } catch (error) {
    console.error('Error linking VIN with VCU:', error);
    res.status(500).json({ success: false, message: 'Failed to link VIN with VCU' });
  }
});

router.get('/device-ids', authenticateUser, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { deviceType } = req.query;
    if (!deviceType) {
      return res.status(400).json({ success: false, message: 'Device type is required' });
    }
    const company = await getCompanyByUsername(username);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    const deviceIds = await get_items_by_attributes('tmcdevdevicedb', 'deviceid', { devicetype: deviceType });
    res.json({ success: true, deviceIds: deviceIds || [] });
  } catch (error) {
    console.error('Error fetching device IDs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch device IDs' });
  }
});

router.post('/configure-pub-frequency', authenticateUser, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const {
      deviceType,
      deviceInfoFrequency,
      deviceCanDataFrequency,
      gpsFrequency,
      updateType,
      deviceIds = [],
    } = req.body;

    if (!deviceType || !deviceInfoFrequency || !deviceCanDataFrequency || !gpsFrequency || !updateType) {
      return res.status(400).json({ success: false, message: 'All frequency fields, device type, and update type are required' });
    }

    const company = await getCompanyByUsername(username);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const message = {
      cmdtype: 'configpubfreq',
      device: deviceInfoFrequency,
      can: deviceCanDataFrequency,
      gps: gpsFrequency,
    };

    const deviceList = await get_items_by_attributes('tmcdevdevicedb', 'deviceid', { devicetype: deviceType });
    if (!deviceList || deviceList.length === 0) {
      return res.status(404).json({ success: false, message: 'No devices found for this device type' });
    }

    if (updateType === 'Configure All') {
      const topic = `cmd/${deviceType}`;
      await publishMqttMessage(topic, message);
      for (const deviceId of deviceList) {
        await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'devicedatafrequency', `${deviceInfoFrequency}s`);
        await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'gpsfrequency', `${gpsFrequency}s`);
        await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'devicecandatafrequency', `${deviceCanDataFrequency}s`);
      }
      res.json({ success: true, message: 'Frequencies configured successfully for all devices' });
    } else if (updateType === 'Configure Targeted Devices') {
      if (!deviceIds.length) {
        return res.status(400).json({ success: false, message: 'No device IDs selected' });
      }
      const validDeviceIds = deviceIds.filter(id => deviceList.includes(id));
      if (!validDeviceIds.length) {
        return res.status(400).json({ success: false, message: 'Selected device IDs are invalid' });
      }

      for (const deviceId of validDeviceIds) {
        const topic = `cmd/${deviceType}/${deviceId}`;
        await publishMqttMessage(topic, message);
        await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'devicedatafrequency', `${deviceInfoFrequency}s`);
        await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'gpsfrequency', `${gpsFrequency}s`);
        await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'devicecandatafrequency', `${deviceCanDataFrequency}s`);
      }
      res.json({ success: true, message: 'Frequencies configured successfully for targeted devices' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid update type' });
    }
  } catch (error) {
    console.error('Error configuring pub frequency:', error);
    res.status(500).json({ success: false, message: 'Failed to configure frequencies' });
  }
});

// New endpoint: Link VIN with mobile number
router.post('/link-vin-mobile', authenticateUser, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { deviceType, mobileNumber, linkOption, deviceIds = [] } = req.body;

    // Validate request body
    if (!deviceType || !mobileNumber || !linkOption) {
      return res.status(400).json({ success: false, message: 'Device type, mobile number, and link option are required' });
    }

    if (linkOption === 'Link Targeted Devices' && !deviceIds.length) {
      return res.status(400).json({ success: false, message: 'No device IDs selected for targeted linking' });
    }

    const company = await getCompanyByUsername(username);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const deviceList = await get_items_by_attributes('tmcdevdevicedb', 'deviceid', { devicetype: deviceType });
    if (!deviceList || deviceList.length === 0) {
      return res.status(404).json({ success: false, message: 'No devices found for this device type' });
    }

    const message = {
      cmdtype: 'setusersisdn',
      sisdn: mobileNumber,
    };

    if (linkOption === 'Link All Devices') {
      const topic = `cmd/${deviceType}`;
      await publishMqttMessage(topic, message);
      for (const deviceId of deviceList) {
        await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'usermsisdn', mobileNumber);
      }
      res.json({ success: true, message: 'Mobile number linked successfully to all devices' });
    } else if (linkOption === 'Link Targeted Devices') {
      const validDeviceIds = deviceIds.filter(id => deviceList.includes(id));
      if (!validDeviceIds.length) {
        return res.status(400).json({ success: false, message: 'Selected device IDs are invalid' });
      }

      for (const deviceId of validDeviceIds) {
        const topic = `cmd/${deviceType}/${deviceId}`;
        await publishMqttMessage(topic, message);
        await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'usermsisdn', mobileNumber);
      }
      res.json({ success: true, message: 'Mobile number linked successfully to targeted devices' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid link option' });
    }
  } catch (error) {
    console.error('Error linking VIN with mobile number:', error);
    res.status(500).json({ success: false, message: 'Failed to link mobile number' });
  }
});

export default router;
