import express from 'express';
import { authenticateUser } from './authmiddleware.js';
import { get_device_types, getCompanyByUsername } from './utils/dbutils.js';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

const router = express.Router();
const dynamoDBClient = new DynamoDBClient({ region: 'ap-south-1' });

const convertDMSToDecimal = (dms, direction) => {
  if (!dms || !direction) return null;
  const [degrees, minutes] = dms.split('.');
  if (!degrees || !minutes) return null;
  const deg = parseInt(degrees.slice(0, -2));
  const min = parseFloat(`${degrees.slice(-2)}.${minutes}`) / 60;
  if (isNaN(deg) || isNaN(min)) return null;
  let decimal = deg + min;
  if (direction === 'S' || direction === 'W') decimal = -decimal;
  return decimal;
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const toRadians = (deg) => deg * Math.PI / 180;
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const parseTimestampToIST = (gpsLoc) => {
  if (!gpsLoc) return 'N/A';
  const parts = gpsLoc.split(',');
  if (parts.length < 12) return 'N/A';

  const timeStr = parts[0];
  const dateStr = parts[11];
  if (!timeStr || !dateStr) return 'N/A';

  const timeParts = timeStr.split('.');
  const timeCore = timeParts[0];
  if (!timeCore || timeCore.length !== 6) return 'N/A';

  const hours = parseInt(timeCore.slice(0, 2));
  const minutes = parseInt(timeCore.slice(2, 4));
  const seconds = parseInt(timeCore.slice(4, 6));

  const day = parseInt(dateStr.slice(0, 2));
  const month = parseInt(dateStr.slice(2, 4));
  const year = parseInt(`20${dateStr.slice(4, 6)}`);

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) ||
      isNaN(day) || isNaN(month) || isNaN(year)) {
    return 'N/A';
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  if (isNaN(utcDate.getTime())) return 'N/A';

  const istDateStr = utcDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const [datePart, timePart] = istDateStr.split(', ');
  const [dd, mm, yyyy] = datePart.split('/');
  return `${dd}-${mm}-${yyyy} ${timePart}`;
};

router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No username found' });
    }

    const deviceType = req.query.deviceType?.toString();
    if (!deviceType) {
      return res.status(400).json({ success: false, message: 'Device type is required' });
    }

    console.log(`📊 Fetching stats for user: ${username}, deviceType: ${deviceType}`);

    const companyName = await getCompanyByUsername(username);
    if (!companyName) {
      return res.status(404).json({ success: false, message: 'Company not found for the user' });
    }

    const totalDevicesCommand = new ScanCommand({
      TableName: 'tmcdevdevicedb',
      FilterExpression: '#company = :companyName AND #devicetype = :deviceType',
      ExpressionAttributeNames: {
        '#company': 'company',
        '#devicetype': 'devicetype',
      },
      ExpressionAttributeValues: {
        ':companyName': { S: companyName },
        ':deviceType': { S: deviceType },
      },
      ProjectionExpression: 'vin',
    });

    const { Items: totalDevicesItems } = await dynamoDBClient.send(totalDevicesCommand);
    const totalDevices = totalDevicesItems.length;

    const deviceStatusCommand = new ScanCommand({
      TableName: 'tmcdevdevicedb',
      FilterExpression: '#company = :companyName AND #devicetype = :deviceType',
      ExpressionAttributeNames: {
        '#company': 'company',
        '#devicetype': 'devicetype',
      },
      ExpressionAttributeValues: {
        ':companyName': { S: companyName },
        ':deviceType': { S: deviceType },
      },
      ProjectionExpression: 'statuscode, mcu1lastpushedfwversion, mcu1version, vculastpushedversion, vcuversion',
    });

    const { Items: deviceStatusItems } = await dynamoDBClient.send(deviceStatusCommand);

    const onlineDevices = deviceStatusItems.filter(item => item.statuscode?.S === 'ACTIVE').length;

    const mcuUpdated = deviceStatusItems.filter(item => {
      const lastPushedVersion = item.mcu1lastpushedfwversion?.S;
      const currentVersion = item.mcu1version?.S;
      return lastPushedVersion && currentVersion && lastPushedVersion === currentVersion;
    }).length;

    const vcuUpdated = deviceStatusItems.filter(item => {
      const lastPushedVersion = item.vculastpushedversion?.S;
      const currentVersion = item.vcuversion?.S;
      return lastPushedVersion && currentVersion && lastPushedVersion === currentVersion;
    }).length;

    const firmwareUpdated = deviceStatusItems.filter(item => {
      const vcuLastPushed = item.vculastpushedversion?.S;
      const vcuCurrent = item.vcuversion?.S;
      const mcuLastPushed = item.mcu1lastpushedfwversion?.S;
      const mcuCurrent = item.mcu1version?.S;
      const vcuOk = vcuLastPushed && vcuCurrent && vcuLastPushed === vcuCurrent;
      const mcuOk = mcuLastPushed && mcuCurrent && mcuLastPushed === mcuCurrent;
      return vcuOk && mcuOk;
    }).length;

    const stats = {
      totalDevices,
      onlineDevices,
      firmwareUpdated,
      mcuUpdated,
      vcuUpdated,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
  }
});

router.get('/devices', authenticateUser, async (req, res) => {
  try {
    const username = req.user?.username;
    const deviceType = req.query.deviceType?.toString();

    if (!username) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No username found' });
    }

    if (!deviceType) {
      return res.status(400).json({ success: false, message: 'Device type is required' });
    }

    const companyName = await getCompanyByUsername(username);
    if (!companyName) {
      return res.status(404).json({ success: false, message: 'Company not found for the user' });
    }

    const devicesCommand = new ScanCommand({
      TableName: 'tmcdevdevicedb',
      FilterExpression: '#company = :companyName AND #devicetype = :deviceType',
      ExpressionAttributeNames: {
        '#company': 'company',
        '#devicetype': 'devicetype',
      },
      ExpressionAttributeValues: {
        ':companyName': { S: companyName },
        ':deviceType': { S: deviceType },
      },
      ProjectionExpression: 'deviceid, statuscode, latitude, longitude, radius, last_known_gps_loc',
    });

    const { Items } = await dynamoDBClient.send(devicesCommand);

    const devices = Items.map(item => {
      const deviceId = item.deviceid?.S || 'Unknown';
      const statusCode = item.statuscode?.S || 'NOTACTIVE';
      const latitude = parseFloat(item.latitude?.S) || null;
      const longitude = parseFloat(item.longitude?.S) || null;
      const radius = parseFloat(item.radius?.S) || 0;
      const lastKnownGpsLoc = item.last_known_gps_loc?.S || '';

      let lastLat = null, lastLon = null, googleMapsLink = 'Location not present or invalid', inGeofence = 'No';
      const lastOnline = parseTimestampToIST(lastKnownGpsLoc);
      if (lastKnownGpsLoc) {
        const parts = lastKnownGpsLoc.split(',');
        if (parts.length >= 4 && parts[1] && parts[2] && parts[3] && parts[4]) {
          lastLat = convertDMSToDecimal(parts[1], parts[2]);
          lastLon = convertDMSToDecimal(parts[3], parts[4]);
          if (lastLat !== null && lastLon !== null && !isNaN(lastLat) && !isNaN(lastLon)) {
            googleMapsLink = `https://www.google.com/maps?q=${lastLat},${lastLon}`;
            if (latitude && longitude && radius) {
              const distance = haversineDistance(latitude, longitude, lastLat, lastLon);
              inGeofence = distance <= radius ? 'Yes' : 'No';
            }
          } else {
            console.warn(`Invalid coordinates for device ${deviceId}: lat=${lastLat}, lon=${lastLon}`);
          }
        } else {
          console.warn(`Invalid GPS data format for device ${deviceId}: ${lastKnownGpsLoc}`);
        }
      } else {
        console.warn(`No GPS data for device ${deviceId}`);
      }

      return {
        deviceId,
        status: statusCode === 'ACTIVE' ? 'Online' : 'Offline',
        location: googleMapsLink,
        inGeofence,
        lastOnline,
        latitude: lastLat,
        longitude: lastLon,
      };
    });

    console.log('Processed devices:', devices);
    res.json({ success: true, data: devices });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch devices', error: error.message });
  }
});

router.get('/device-types', authenticateUser, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No username found' });
    }

    console.log(`🔍 Fetching device types for user: ${username}`);
    const deviceTypes = await get_device_types(username);
    res.json({ success: true, deviceTypes });
  } catch (error) {
    console.error('Error fetching device types:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch device types', error: error.message });
  }
});

export default router;
