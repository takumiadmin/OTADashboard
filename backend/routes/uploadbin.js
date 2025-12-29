import express from 'express';
import multer from 'multer';
import { save_file } from './utils/storageutils.js';
import { get_device_types, add_firmware_entry, get_items_by_attributes } from './utils/dbutils.js';
import { authenticateUser } from './authmiddleware.js';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Fetch device types
router.get('/device-types', authenticateUser, async (req, res) => {  
  try {
    const username = req.user?.username;
    if (!username) return res.status(401).json({ message: "Unauthorized: No username found" });

    console.log(`🔍 Fetching device types for user: ${username}`);
    const deviceTypes = await get_device_types(username);
    if (!deviceTypes.length) return res.status(400).json({ message: "No device types available" });
    res.json({ deviceTypes });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch device types", error: error.message });
  }
});

// Fetch versions based on device type, ecu type, and bin type
router.get('/versions', authenticateUser, async (req, res) => {
  try {
    const { devicetype, ecutype, bintype } = req.query;
    if (!devicetype || !ecutype || !bintype) {
      return res.status(400).json({ message: "Missing required query parameters" });
    }

    console.log(`🔍 Fetching versions for ${devicetype}/${ecutype}/${bintype}`);
    const versions = await get_items_by_attributes('tmcdevfirmwaredb', 'version', {
      devicetype,
      ecutype,
      bintype
    });
    res.json({ versions });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch versions", error: error.message });
  }
});

// MCU upload (single file)
router.post('/upload', upload.single('binaryFile'), authenticateUser, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { devicetype, version, bintype, ecutype, requiredVersion } = req.body;
    const timestamp = new Date().toISOString();
    const fileBuffer = req.file.buffer;
    const originalFileName = req.file.originalname;

    const binaryUrl = await save_file(fileBuffer, originalFileName);
    let requiredUrl = "N/A";

    if (requiredVersion !== "N/A") {
      const requiredData = await get_items_by_attributes('tmcdevfirmwaredb', 
        bintype === "Firmware" ? 'mcufwbinaryurl' : 'mcuconfigurl', 
        { devicetype, ecutype, bintype, version: requiredVersion }
      );
      requiredUrl = requiredData[0] || "N/A";
    }

    const firmwareData = {
      devicetype,
      ecutype,
      bintype,
      version,
      requiredver: requiredVersion,
      timestamp,
      mcufwbinaryurl: bintype === "Firmware" ? binaryUrl : "",
      mcuconfigurl: bintype === "Configuration" ? binaryUrl : "",
      mcufwrequiredurl: bintype === "Firmware" ? requiredUrl : "",
      mcuconfigrequiredurl: bintype === "Configuration" ? requiredUrl : "",
      vcufwbinaryurla: "",
      vcufwbinaryurlb: "",
      vcufwrequiredurla: "",
      vcufwrequiredurlb: ""
    };

    await add_firmware_entry(firmwareData);
    res.json({ message: "File uploaded successfully, and database updated", binaryUrl });
  } catch (error) {
    console.error("Error during MCU upload:", error);
    res.status(500).json({ message: "Failed to upload file", error: error.message });
  }
});

// VCU upload (two files)
router.post('/upload-vcu', upload.fields([{ name: 'binaryFile1', maxCount: 1 }, { name: 'binaryFile2', maxCount: 1 }]), authenticateUser, async (req, res) => {
  try {
    if (!req.files || !req.files.binaryFile1 || !req.files.binaryFile2) {
      return res.status(400).json({ message: 'Please upload two files' });
    }

    const { devicetype, version, bintype, ecutype, requiredVersion } = req.body;
    const timestamp = new Date().toISOString();
    const fileBuffer1 = req.files.binaryFile1[0].buffer;
    const fileBuffer2 = req.files.binaryFile2[0].buffer;
    const originalFileName1 = req.files.binaryFile1[0].originalname;
    const originalFileName2 = req.files.binaryFile2[0].originalname;

    const binaryUrlA = await save_file(fileBuffer1, originalFileName1);
    const binaryUrlB = await save_file(fileBuffer2, originalFileName2);
    let requiredUrlA = "N/A";
    let requiredUrlB = "N/A";

    if (requiredVersion !== "N/A") {
      const requiredDataA = await get_items_by_attributes('tmcdevfirmwaredb', 'vcufwbinaryurla', {
        devicetype,
        ecutype,
        bintype,
        version: requiredVersion
      });
      const requiredDataB = await get_items_by_attributes('tmcdevfirmwaredb', 'vcufwbinaryurlb', {
        devicetype,
        ecutype,
        bintype,
        version: requiredVersion
      });
      requiredUrlA = requiredDataA[0] || "N/A";
      requiredUrlB = requiredDataB[0] || "N/A";
    }

    const firmwareData = {
      devicetype,
      ecutype,
      bintype,
      version,
      requiredver: requiredVersion,
      timestamp,
      mcufwbinaryurl: "",
      mcuconfigurl: "",
      mcufwrequiredurl: "",
      mcuconfigrequiredurl: "",
      vcufwbinaryurla: binaryUrlA,
      vcufwbinaryurlb: binaryUrlB,
      vcufwrequiredurla: requiredUrlA,
      vcufwrequiredurlb: requiredUrlB
    };

    await add_firmware_entry(firmwareData);
    res.json({ message: "Files uploaded successfully, and database updated", binaryUrlA, binaryUrlB });
  } catch (error) {
    console.error("Error during VCU upload:", error);
    res.status(500).json({ message: "Failed to upload files", error: error.message });
  }
});

export default router;
