import { useEffect, useState } from 'react';
import { DonutChart } from '../components/DonutChart';
import { LayoutDashboard, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Define a custom red marker icon with larger size
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [38, 62], // Larger size
  iconAnchor: [19, 62],
  popupAnchor: [0, -60],
  shadowSize: [62, 62],
});

interface Device {
  deviceId: string;
  status: string;
  location: string;
  inGeofence: string;
  lastOnline: string;
  latitude?: number;
  longitude?: number;
}

interface DashboardProps {
  refreshKey?: number;
}

export function Dashboard({ refreshKey }: DashboardProps) {
  const [stats, setStats] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    firmwareUpdated: 0,
    vcuUpdated: 0,
    mcuUpdated: 0,
  });

  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<string[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const KARNATAKA_CENTER: [number, number] = [15.3173, 75.7139];

  // Function to extract latitude and longitude from Google Maps URL
  const extractCoordinatesFromUrl = (url: string): { latitude: number | null; longitude: number | null } => {
    if (!url || !url.startsWith('https://www.google.com/maps?q=')) {
      console.warn(`Invalid location URL: ${url}`);
      return { latitude: null, longitude: null };
    }
    const coords = url.split('q=')[1]?.split(',') || [];
    if (coords.length < 2) {
      console.warn(`Invalid coordinates in URL: ${url}`);
      return { latitude: null, longitude: null };
    }
    const latitude = parseFloat(coords[0]);
    const longitude = parseFloat(coords[1]);
    if (isNaN(latitude) || isNaN(longitude)) {
      console.warn(`Non-numeric coordinates in URL: ${url}`);
      return { latitude: null, longitude: null };
    }
    return { latitude, longitude };
  };

  const fetchWithAuth = (url: string, setter: (data: any) => void, params?: Record<string, string>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    fetch(`${url}${queryString}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch data: ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'API request failed');
        if (url.includes('/devices')) {
          const sortedData = [...data.data].sort((a, b) => {
            const [prefixA, numA] = splitDeviceId(a.deviceId);
            const [prefixB, numB] = splitDeviceId(b.deviceId);
            if (prefixA !== prefixB) {
              return prefixB.localeCompare(prefixA);
            }
            return numB - numA;
          });
          // Process devices to include latitude and longitude from location URL
          const processedDevices = sortedData.map((device: any) => {
            const { latitude, longitude } = extractCoordinatesFromUrl(device.location);
            console.log(`Device ${device.deviceId}: lat=${latitude}, lon=${longitude}, location=${device.location}`);
            return {
              ...device,
              latitude,
              longitude,
            };
          });
          setDevices(processedDevices);
        } else if (url.includes('/stats')) {
          setStats(data.data);
        } else if (url.includes('/device-types')) {
          setDeviceTypes(data.deviceTypes || []);
          if (data.deviceTypes?.length > 0) {
            setSelectedDeviceType(data.deviceTypes[0]);
          }
        }
        setSuccessMessage('Data fetched successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      })
      .catch((error) => {
        console.error(`Error fetching ${url}:`, error);
        setErrorMessage(`Failed to fetch data: ${error.message}`);
      })
      .finally(() => setIsLoading(false));
  };

  const resetAndFetchData = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('No authentication token found. Please log in.');
      return;
    }

    // Reset all states to initial values
    setStats({
      totalDevices: 0,
      onlineDevices: 0,
      firmwareUpdated: 0,
      vcuUpdated: 0,
      mcuUpdated: 0,
    });
    setDevices([]);
    setDeviceTypes([]);
    setSelectedDeviceType('');
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSortOrder('desc');

    // Refetch all data
    fetchWithAuth(`${import.meta.env.VITE_API_URL}/dashboard/device-types`, (data) => {
      setDeviceTypes(data.deviceTypes || []);
      if (data.deviceTypes?.length > 0) {
        setSelectedDeviceType(data.deviceTypes[0]);
      }
    });
  };

  useEffect(() => {
    resetAndFetchData();
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedDeviceType) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('No authentication token found. Please log in.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    Promise.all([
      fetchWithAuth(`${import.meta.env.VITE_API_URL}/dashboard/stats`, setStats, { deviceType: selectedDeviceType }),
      fetchWithAuth(`${import.meta.env.VITE_API_URL}/dashboard/devices`, setDevices, { deviceType: selectedDeviceType }),
    ]).catch(() => {
      setErrorMessage('Failed to fetch stats and devices.');
    });
  }, [selectedDeviceType]);

  const handleRefresh = () => {
    resetAndFetchData();
  };

  const splitDeviceId = (deviceId: string): [string, number] => {
    const match = deviceId.match(/^([a-zA-Z]+)(\d+)$/);
    if (!match) return [deviceId, 0];
    return [match[1], parseInt(match[2], 10)];
  };

  const handleSort = () => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);

    const sortedDevices = [...devices].sort((a, b) => {
      const [prefixA, numA] = splitDeviceId(a.deviceId);
      const [prefixB, numB] = splitDeviceId(b.deviceId);

      if (prefixA !== prefixB) {
        return newSortOrder === 'asc' ? prefixA.localeCompare(prefixB) : prefixB.localeCompare(prefixA);
      }

      return newSortOrder === 'asc' ? numA - numB : numB - numA;
    });

    setDevices(sortedDevices);
  };

  const offlineDevices = stats.totalDevices - stats.onlineDevices;

  const getMapCenter = (): [number, number] => {
    const validDevices = devices.filter(
      device =>
        typeof device.latitude === 'number' &&
        typeof device.longitude === 'number' &&
        !isNaN(device.latitude) &&
        !isNaN(device.longitude)
    );
    if (validDevices.length === 0) {
      console.warn('No valid device coordinates, using KARNATAKA_CENTER');
      return KARNATAKA_CENTER;
    }
    const avgLat = validDevices.reduce((sum, device) => sum + (device.latitude || 0), 0) / validDevices.length;
    const avgLon = validDevices.reduce((sum, device) => sum + (device.longitude || 0), 0) / validDevices.length;
    console.log(`Map center: lat=${avgLat}, lon=${avgLon}`);
    return [avgLat, avgLon];
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700 flex items-center">
              <svg className="w-10 h-10 mr-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <LayoutDashboard className="w-5 h-5" />
              </svg>
              Takumi Motion Controls
            </h1>
            <h2 className="text-xl font-semibold text-gray-600 mt-1">Dashboard</h2>
            <div className="h-1 w-28 bg-gradient-to-r from-blue-500 to-indigo-600 mt-2"></div>
          </div>
          <div className="relative group flex items-center space-x-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                Select Device Type
              </label>
              <div className="relative">
                <select
                  className="p-4 pl-12 pr-10 border border-gray-300 rounded-lg w-48 bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 appearance-none cursor-pointer"
                  value={selectedDeviceType}
                  onChange={(e) => setSelectedDeviceType(e.target.value)}
                >
                  {deviceTypes.length > 0 ? (
                    deviceTypes.map((type, index) => (
                      <option key={index} value={type} className="text-gray-600 bg-white hover:bg-indigo-100 py-2">{type}</option>
                    ))
                  ) : (
                    <option value="" className="text-gray-600 bg-white">Loading...</option>
                  )}
                </select>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                  </svg>
                </div>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center animate-fade-in">
            <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}

        {!isLoading && (
          <>
            {errorMessage && (
              <div className="p-5 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center animate-success-slide mb-6">
                <svg className="w-6 h-6 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-5 bg-green-50 border border-red-200 rounded-lg text-green-700 flex items-center animate-success-slide mb-6">
                <svg className="w-6 h-6 mr-3 text-green-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {successMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Total Devices: {stats.totalDevices}</h3>
                <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 mb-4"></div>
                <DonutChart
                  labels={["Online", "Offline"]}
                  values={[stats.onlineDevices, offlineDevices]}
                  title=""
                  colors={["#4ECDC4", "#C7F464"]}
                />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Firmware Update Status</h3>
                <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 mb-4"></div>
                <DonutChart
                  labels={["Updated", "Not Updated"]}
                  values={[stats.firmwareUpdated, stats.totalDevices - stats.firmwareUpdated]}
                  title=""
                  colors={["#6A8EAE", "#FF847C"]}
                />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">VCU Update Status</h3>
                <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 mb-4"></div>
                <DonutChart
                  labels={["Updated", "Not Updated"]}
                  values={[stats.vcuUpdated, stats.totalDevices - stats.vcuUpdated]}
                  title=""
                  colors={["#99B898", "#FECEAB"]}
                />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">MCU Update Status</h3>
                <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 mb-4"></div>
                <DonutChart
                  labels={["Updated", "Not Updated"]}
                  values={[stats.mcuUpdated, stats.totalDevices - stats.mcuUpdated]}
                  title=""
                  colors={["#A6CFE2", "#E2A6CF"]}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6 mb-6 animate-fade-in">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Device Locations</h2>
              <div className="h-[600px] w-full">
                <MapContainer
                  center={getMapCenter()}
                  zoom={7}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <ZoomControl position="bottomright" />
                  {devices
                    .filter(
                      device =>
                        typeof device.latitude === 'number' &&
                        typeof device.longitude === 'number' &&
                        !isNaN(device.latitude) &&
                        !isNaN(device.longitude)
                    )
                    .map(device => (
                      <Marker
                        key={device.deviceId}
                        position={[device.latitude!, device.longitude!]}
                        icon={redIcon}
                      >
                        <Popup>
                          <div>
                            <strong>Device ID:</strong> {device.deviceId}<br />
                            <strong>Status:</strong> {device.status}<br />
                            <strong>In Geofence:</strong> {device.inGeofence}<br />
                            <strong>Last Online:</strong> {device.lastOnline}<br />
                            <a
                              href={device.location}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View on Google Maps
                            </a>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>
              </div>
            </div>

            {devices.length > 0 ? (
              <div className="bg-white rounded-lg shadow-xl p-6 animate-fade-in">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Available Devices</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse bg-white shadow-md rounded-lg">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">
                          <button
                            onClick={handleSort}
                            className="flex items-center space-x-1 focus:outline-none hover:text-indigo-600"
                          >
                            <span>DeviceID</span>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 11l5-5m0 0l5 5m-5-5v12"
                                className={sortOrder === 'asc' ? 'opacity-100' : 'opacity-50'}
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 13l5 5m0 0l5-5m-5 5V6"
                                className={sortOrder === 'desc' ? 'opacity-100' : 'opacity-50'}
                              />
                            </svg>
                          </button>
                        </th>
                        <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">Status</th>
                        <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">Location</th>
                        <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">In Geofence</th>
                        <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">Last Online</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.map((device) => (
                        <tr key={device.deviceId} className="hover:bg-gray-50 transition-colors">
                          <td className="border border-gray-200 p-3 text-gray-600">{device.deviceId}</td>
                          <td className="border border-gray-200 p-3 text-gray-600">
                            <span
                              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                                device.status === 'Online'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              } cursor-pointer`}
                              title={`Device is ${device.status.toLowerCase()}`}
                            >
                              {device.status}
                            </span>
                          </td>
                          <td className="border border-gray-200 p-3 text-gray-600">
                            {device.location.startsWith('https://') ? (
                              <a
                                href={device.location}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View on Map
                              </a>
                            ) : (
                              <span>{device.location}</span>
                            )}
                          </td>
                          <td className="border border-gray-200 p-3 text-gray-600">
                            <span
                              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                                device.inGeofence === 'Yes'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              } cursor-pointer`}
                              title={`Device is ${device.inGeofence === 'Yes' ? 'inside' : 'outside'} geofence`}
                            >
                              {device.inGeofence}
                            </span>
                          </td>
                          <td className="border border-gray-200 p-3 text-gray-600">{device.lastOnline}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-xl p-6 animate-fade-in">
                <p className="text-gray-600">No devices available.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
