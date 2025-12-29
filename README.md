# OTA Dashboard

OTA Dashboard is a full-stack web application designed to manage, monitor, and control Over-The-Air (OTA) firmware updates for connected devices. The platform provides a centralized interface for device management, firmware deployment, update scheduling, and real-time diagnostics, ensuring reliable and scalable OTA operations in production environments.

The dashboard is built with a modern frontend and a robust backend architecture, following industry-standard practices for security, maintainability, and scalability.
---

## 🔐 Authentication – Login Screen

The Login screen serves as the secure entry point to the OTA Dashboard. Users must authenticate using valid credentials to access the platform. This ensures that only authorized personnel can manage devices, firmware updates, and system configurations.
<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/b6372ecd-6615-43c1-8ac8-7266064e2d10" />

Key capabilities:
- Secure user authentication
- Session-based access control
- Protection against unauthorized access

---

## 📊 Dashboard Overview

The Dashboard provides a high-level overview of the system state and device fleet. It presents key metrics and statuses that allow users to quickly assess ongoing OTA activities and device health.
<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/375dacc3-f4e3-4bb7-bf5c-bd699d8b9acd" />
<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/09de1391-a1f1-4bbc-92df-c53cf69c711e" />


Key capabilities:
- Summary of connected devices
- OTA update status overview
- Locations of the devices 

---

## 🧾 List of Tools

The List of Tools page provides a centralized and structured view of all registered equipment within the OTA system. It enables administrators and operators to monitor device metadata, ownership, operational status, and geographical registration details at a glance.

Each entry represents a unique tool or equipment unit, identified by its serial number and associated attributes.
<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/8e3f2bda-e1d1-46b3-afa5-f365d390b7a2" />


---

## ⏫ Upload Binary(Binary Management)

The Firmware Upload module allows users to upload firmware binary files to the system. These binaries can later be selected for OTA deployment across one or more devices.
<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/5fa3f9ef-80d4-4385-a5af-e9150f011777" />

Key capabilities:
- Upload firmware binaries
- Version management
- Validation before deployment

---

## ⏰ Schedule Update (OTA Update Scheduling)

The Update Scheduling feature enables controlled OTA deployments. Users can schedule firmware updates at specific times to minimize downtime and operational risk.
<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/9d82c8d8-392d-4ce6-a329-6d3328017b1d" />

Key capabilities:
- Schedule OTA updates
- Select target devices
- Controlled rollout strategy

---

## 📈 Diagnostic Data (Diagnostic Data Monitoring)

The Diagnostic Data section provides visibility into device-level telemetry and health parameters. This helps in identifying issues early and ensures devices are operating within expected limits.
<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/7233d8cf-f9e0-4522-a81a-76b87a0c9db7" />
<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/66922891-6589-49dc-b4f1-ef9ed74354fe" />

Key capabilities:
- View real-time or recent diagnostic data
- Monitor device health parameters
- Support troubleshooting and analysis

---

## ⚙️ Device Settings – Device Management Console

The Device Settings page serves as a centralized **Device Management Console**, enabling administrators to configure and associate hardware identifiers required for OTA operations and data communication.

This module ensures proper linkage between vehicle identifiers, control units, and mobile devices, which is essential for reliable OTA updates and telemetry publishing.

---

### 🔗 Link VIN with VCU

This section allows users to associate a **Vehicle Identification Number (VIN)** with a **Vehicle Control Unit (VCU)**. Establishing this link ensures that firmware updates and diagnostic data are correctly routed to the intended device.
<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/bf1ecba6-ab92-4cea-9c67-889f7c9554fc" />

**Configuration Fields:**
- **Device Type** – Select the category of device being configured
- **VCU Serial Number** – Unique identifier of the Vehicle Control Unit
- **VIN Serial Number** – Vehicle Identification Number associated with the device

**Action:**
- **Link Devices** – Binds the VIN and VCU together within the system

---

### 📡 Configure Publish Frequency

This module allows configuration of the data publishing interval from devices to the backend system. It helps balance real-time data requirements with network and power constraints.
<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/7949057d-9dce-4c73-a901-4b41f9d1e41c" />

**Key capabilities:**
- Define data publish intervals
- Optimize bandwidth usage
- Control telemetry frequency for diagnostics and monitoring

---

### 📱 Link VIN with Mobile

This section enables linking a VIN to a mobile device or mobile application instance. This association supports mobile-based monitoring, control, and OTA status visibility.
<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/f9bf489c-ca97-4f55-a152-14cbf02dab5f" />

**Key capabilities:**
- Associate VIN with mobile clients
- Enable secure mobile-device communication
- Support mobile-based device management workflows

---

## 🗺️ Geofence Settings

The Geofence Settings feature allows users to define geographical boundaries for devices. This can be used for location-based restrictions, monitoring, or alerts.
<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/0b28f1fc-f7ea-4077-892f-7de468695568" />
<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/7058c6a1-49aa-46e3-8c80-9adcf8c945b5" />

Key capabilities:
- Define geofence regions
- Assign geofences to devices
- Enable location-based logic

---

## ⚙️ Account Settings

The Settings section contains user-specific actions related to account management.
<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/4e1afefe-8fa5-48aa-991e-aee4851a38a9" />

Available options:
- Change password
