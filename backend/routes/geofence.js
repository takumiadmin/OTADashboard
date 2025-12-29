import express from 'express';
import { get_items_by_attributes, update_item, getCompanyByUsername } from './utils/dbutils.js';
import { authenticateUser } from './authmiddleware.js';
import { publishMqttMessage } from './utils/messageutils.js';

const router = express.Router();
router.use(express.json());

router.post('/configure-geofence', authenticateUser, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const {
      deviceType,
      geofenceOption,
      latitude,
      longitude,
      radius,
      gpsCheckFrequency,
      geofenceType,
      deviceIds = [],
    } = req.body;

    // Validate required fields
    if (!deviceType || !geofenceOption || !geofenceType) {
      return res.status(400).json({ success: false, message: 'Device type, geofence option, and geofence type are required' });
    }

    // Fetch company based on username
    const company = await getCompanyByUsername(username);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Fetch devices by device type
    const deviceList = await get_items_by_attributes('tmcdevdevicedb', 'deviceid', { devicetype: deviceType });
    if (!deviceList || deviceList.length === 0) {
      return res.status(404).json({ success: false, message: 'No devices found for this device type' });
    }

    // Prepare MQTT message
    let message;
    if (geofenceOption === 'Enable') {
      if (!latitude || !longitude || !radius || !gpsCheckFrequency) {
        return res.status(400).json({ success: false, message: 'Latitude, longitude, radius, and GPS check frequency are required to enable geofencing' });
      }
      message = {
        cmdtype: 'setgeofence',
        lat: latitude,
        lon: longitude,
        radius: radius, // Number for MQTT
        checkfrq: gpsCheckFrequency, // Number for MQTT
      };
    } else if (geofenceOption === 'Disable') {
      message = {
        cmdtype: 'disablegeofence',
        lat: null,
        lon: null,
        radius: null,
        checkfrq: null,
      };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid geofence option' });
    }

    // Function to update geofence attributes in the database
    const updateGeofenceAttributes = async (deviceId, enable) => {
      try {
        if (enable) {
          await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'latitude', String(latitude));
          await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'longitude', String(longitude));
          await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'radius', String(radius));
          await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'gpscheckfrq', `${gpsCheckFrequency}s`);
          await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'geofence_enabled', 'true');
        } else {
          await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'latitude', "");
          await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'longitude', "");
          await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'radius', "");
          await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'gpscheckfrq', "");
          await update_item('tmcdevdevicedb', 'deviceid', deviceId, 'devicetype', deviceType, 'geofence_enabled', 'false');
        }
      } catch (error) {
        console.error(`Failed to update geofence attributes for device ${deviceId}:`, error);
        throw new Error('Database update failed');
      }
    };

    // Handle "All" or "Targeted" geofencing
    if (geofenceType === 'Geofence All' || geofenceType === 'Disable Geofence All') {
      const topic = `cmd/${deviceType}`;
      await publishMqttMessage(topic, message);
      for (const deviceId of deviceList) {
        await updateGeofenceAttributes(deviceId, geofenceOption === 'Enable');
      }
      res.json({ success: true, message: geofenceOption === 'Enable' ? 'Geofencing configured successfully' : 'Geofencing disabled successfully' });
    } else if (geofenceType === 'Geofence Targeted Devices' || geofenceType === 'Disable Geofence Targeted Devices') {
      if (!deviceIds.length) {
        return res.status(400).json({ success: false, message: 'No device IDs selected' });
      }
      const validDeviceIds = deviceIds.filter((id) => deviceList.includes(id));
      if (!validDeviceIds.length) {
        return res.status(400).json({ success: false, message: 'Selected device IDs are invalid' });
      }

      for (const deviceId of validDeviceIds) {
        const topic = `cmd/${deviceType}/${deviceId}`;
        await publishMqttMessage(topic, message);
        await updateGeofenceAttributes(deviceId, geofenceOption === 'Enable');
      }
      res.json({ success: true, message: geofenceOption === 'Enable' ? 'Geofencing configured successfully' : 'Geofencing disabled successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid geofence type' });
    }
  } catch (error) {
    console.error('Error configuring geofence:', error);
    res.status(500).json({ success: false, message: 'Failed to configure geofencing' });
  }
});

export default router;
