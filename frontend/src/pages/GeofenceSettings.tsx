import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Circle, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Define a custom GPS-like marker icon
const gpsIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationInfo {
  lat: number;
  lng: number;
}

interface GeofenceSettingsProps {
  refreshKey?: number;
}

// Component to update map view when coordinates change
function MapViewUpdater({ lat, lng }: { lat: string; lng: string }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([parseFloat(lat), parseFloat(lng)], 15); // Zoom to level 15
    }
  }, [lat, lng, map]);
  return null;
}

function LocationDetector({ onLocationClick }: { onLocationClick: (location: LocationInfo) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationClick({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });
  return null;
}

export function GeofenceSettings({ refreshKey }: GeofenceSettingsProps) {
  const [deviceTypes, setDeviceTypes] = useState<string[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState('');
  const [geofenceOption, setGeofenceOption] = useState('Enable');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('');
  const [radiusError, setRadiusError] = useState<string | null>(null);
  const [gpsCheckFrequency, setGpsCheckFrequency] = useState(60);
  const [geofenceTypes, setGeofenceTypes] = useState<string[]>([]);
  const [selectedGeofenceType, setSelectedGeofenceType] = useState('');
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

  // Handle map click with reverse geocoding
  const handleLocationClick = async (loc: LocationInfo) => {
    setLatitude(loc.lat.toFixed(6));
    setLongitude(loc.lng.toFixed(6));
    setRadius('200');
    setRadiusError(null);
    setSearchError(null);

    // Perform reverse geocoding
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&addressdetails=1`
      );
      const data = await response.json();
      if (data && data.address) {
        // Construct address from components (e.g., road, city, state)
        const addressComponents = [];
        if (data.address.road) addressComponents.push(data.address.road);
        if (data.address.suburb) addressComponents.push(data.address.suburb);
        if (data.address.city || data.address.town || data.address.village)
          addressComponents.push(data.address.city || data.address.town || data.address.village);
        const formattedAddress = addressComponents.join(', ');
        setAddress(formattedAddress || 'Unknown location');
        setPincode(data.address.postcode || '');
      } else {
        setAddress('Unknown location');
        setPincode('');
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setAddress('Failed to fetch address');
      setPincode('');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear selected location
  const clearLocation = () => {
    setLatitude('');
    setLongitude('');
    setRadius('');
    setAddress('');
    setPincode('');
    setSearchError(null);
    setRadiusError(null);
  };

  // Handle address search
  const handleAddressSearch = async () => {
    if (!address.trim()) {
      setSearchError('Please enter an address');
      return;
    }
    setIsLoading(true);
    setSearchError(null);
    try {
      const query = pincode ? `${address}, ${pincode}, India` : `${address}, India`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1`
      );
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        setLatitude(parseFloat(lat).toFixed(6));
        setLongitude(parseFloat(lon).toFixed(6));
        setRadius('200');
        setRadiusError(null);
        // Update address and pincode with more precise data from search result
        const addressComponents = [];
        if (data[0].address.road) addressComponents.push(data[0].address.road);
        if (data[0].address.suburb) addressComponents.push(data[0].address.suburb);
        if (data[0].address.city || data[0].address.town || data[0].address.village)
          addressComponents.push(data[0].address.city || data[0].address.town || data[0].address.village);
        setAddress(addressComponents.join(', ') || address);
        setPincode(data[0].address.postcode || pincode);
      } else {
        setSearchError('Location not found. Please try a different address.');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      setSearchError('Failed to search address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch device types and reset states on refresh
  useEffect(() => {
    // Reset all states except geofenceOption
    setSelectedDeviceType('');
    setLatitude('');
    setLongitude('');
    setRadius('');
    setRadiusError(null);
    setGpsCheckFrequency(60);
    setGeofenceTypes(['Geofence All', 'Geofence Targeted Devices']);
    setSelectedGeofenceType('');
    setDeviceIds([]);
    setSelectedDeviceIds([]);
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsLoading(false);
    setFormProgress(0);
    setAddress('');
    setPincode('');
    setSearchError(null);

    const fetchDeviceTypes = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/devices/device-types`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (data.success) {
          const sortedDeviceTypes = (data.deviceTypes || []).sort();
          setDeviceTypes(sortedDeviceTypes);
        } else {
          setErrorMessage(data.message || 'Failed to fetch device types');
        }
      } catch (error) {
        console.error('Error fetching device types:', error);
        setErrorMessage('Failed to fetch device types');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeviceTypes();
  }, [refreshKey]);

  // Update geofence types based on geofence option
  useEffect(() => {
    if (geofenceOption === 'Enable') {
      setGeofenceTypes(['Geofence All', 'Geofence Targeted Devices']);
      if (!geofenceTypes.includes(selectedGeofenceType)) {
        setSelectedGeofenceType('');
      }
    } else if (geofenceOption === 'Disable') {
      setGeofenceTypes(['Disable Geofence All', 'Disable Geofence Targeted Devices']);
      if (!geofenceTypes.includes(selectedGeofenceType)) {
        setSelectedGeofenceType('');
      }
    } else {
      setGeofenceTypes([]);
      setSelectedGeofenceType('');
    }
  }, [geofenceOption, refreshKey]);

  // Fetch device IDs when targeting specific devices
  useEffect(() => {
    const fetchDeviceIds = async () => {
      if (selectedDeviceType && (selectedGeofenceType === 'Geofence Targeted Devices' || selectedGeofenceType === 'Disable Geofence Targeted Devices')) {
        try {
          setIsLoading(true);
          setErrorMessage(null);
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/devices/device-ids?deviceType=${encodeURIComponent(selectedDeviceType)}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
              },
            }
          );
          const data = await response.json();
          if (data.success) {
            setDeviceIds(data.deviceIds || []);
          } else {
            setErrorMessage(data.message || 'Failed to fetch device IDs');
          }
        } catch (error) {
          console.error('Error fetching device IDs:', error);
          setErrorMessage('Failed to fetch device IDs');
        } finally {
          setIsLoading(false);
        }
      } else {
        setDeviceIds([]);
        setSelectedDeviceIds([]);
      }
    };
    fetchDeviceIds();
  }, [selectedDeviceType, selectedGeofenceType, refreshKey]);

  // Calculate form completion progress
  useEffect(() => {
    let completed = 0;
    const total = geofenceOption === 'Enable' ? (selectedGeofenceType.includes('Targeted') ? 7 : 6) : (selectedGeofenceType.includes('Targeted') ? 4 : 3);

    if (selectedDeviceType) completed++;
    if (geofenceOption) completed++;
    if (selectedGeofenceType) completed++;
    if (geofenceOption === 'Enable') {
      if (latitude) completed++;
      if (longitude) completed++;
      if (radius !== '' && parseInt(radius) >= 200) completed++;
      if (gpsCheckFrequency >= 60) completed++;
    }
    if (selectedGeofenceType.includes('Targeted') && selectedDeviceIds.length > 0) completed++;

    setFormProgress((completed / total) * 100);
  }, [selectedDeviceType, geofenceOption, selectedGeofenceType, latitude, longitude, radius, gpsCheckFrequency, selectedDeviceIds]);

  // Handle geofence configuration submission
  const handleConfigureGeofence = async () => {
    try {
      setIsLoading(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      const payload: any = {
        deviceType: selectedDeviceType,
        geofenceOption,
        geofenceType: selectedGeofenceType,
        deviceIds: selectedGeofenceType.includes('Targeted') ? selectedDeviceIds : [],
      };

      if (geofenceOption === 'Enable') {
        payload.latitude = latitude;
        payload.longitude = longitude;
        payload.radius = parseInt(radius);
        payload.gpsCheckFrequency = gpsCheckFrequency;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/geofence/configure-geofence`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage(data.message);
        setSelectedDeviceType('');
        setGeofenceOption('Enable');
        setLatitude('');
        setLongitude('');
        setRadius('');
        setGpsCheckFrequency(60);
        setRadiusError(null);
        setGeofenceTypes(['Geofence All', 'Geofence Targeted Devices']);
        setSelectedGeofenceType('');
        setDeviceIds([]);
        setSelectedDeviceIds([]);
        setAddress('');
        setPincode('');
        setSearchError(null);
      } else {
        setErrorMessage(data.message || 'Failed to configure geofencing');
      }
    } catch (error) {
      console.error('Error configuring geofence:', error);
      setErrorMessage('Failed to configure geofencing');
    } finally {
      setIsLoading(false);
    }
  };

  // Form validation
  const isFormValid =
    selectedDeviceType &&
    geofenceOption &&
    selectedGeofenceType &&
    (geofenceOption === 'Disable' ||
      (geofenceOption === 'Enable' && latitude && longitude && radius !== '' && parseInt(radius) >= 200 && gpsCheckFrequency >= 60)) &&
    (!selectedGeofenceType.includes('Targeted') || selectedDeviceIds.length > 0);

  return (
    <div className="min-h-screen bg-white py-12 px-6 flex items-center justify-center">
      <div className="w-full max-w-6xl bg-white shadow-2xl border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 ease-in-out">
        {/* Progress bar */}
        <div className="h-1 bg-gray-200 w-full">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700 ease-out"
            style={{ width: `${formProgress}%` }}
          ></div>
        </div>

        <div className="space-y-8 p-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-indigo-700 flex items-center">
                <svg className="w-10 h-10 mr-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Configure Geofencing
              </h2>
              <div className="h-1 w-28 bg-gradient-to-r from-blue-500 to-indigo-600 mt-2"></div>
            </div>
            <div className="text-sm text-gray-500">
              {formProgress < 100 ? 'Complete all fields' : 'Ready to submit'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group">
              <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Device Type</label>
              <div className="relative">
                <select
                  className="p-4 pl-12 pr-10 border border-gray-300 rounded-lg w-full bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 appearance-none cursor-pointer"
                  value={selectedDeviceType}
                  onChange={(e) => setSelectedDeviceType(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="" className="text-gray-600 bg-white hover:bg-indigo-100 py-2">Select Device Type</option>
                  {deviceTypes.map((type) => (
                    <option key={type} value={type} className="text-gray-600 bg-white hover:bg-indigo-100 py-2">{type}</option>
                  ))}
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

            <div className="group">
              <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Enable or Disable Geofencing</label>
              <div className="relative">
                <select
                  className="p-4 pl-12 pr-10 border border-gray-300 rounded-lg w-full bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 appearance-none cursor-pointer"
                  value={geofenceOption}
                  onChange={(e) => setGeofenceOption(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="" className="text-gray-600 bg-white hover:bg-indigo-100 py-2">Select Option</option>
                  <option value="Enable" className="text-gray-600 bg-white hover:bg-indigo-100 py-2">Enable</option>
                  <option value="Disable" className="text-gray-600 bg-white hover:bg-indigo-100 py-2">Disable</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>

            {geofenceOption === 'Enable' && (
              <>
                {/* Address Search Inputs with Example Placeholder */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-base font-medium text-gray-700 mb-2">Search Location by Address</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g., Connaught Place, New Delhi"
                        disabled={isLoading}
                        className="p-4 pl-12 border border-gray-300 rounded-lg w-full bg-white text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400"
                      />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0a7 7 0 111.414-1.414z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="w-full sm:w-40 relative">
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="Pincode (optional)"
                        disabled={isLoading}
                        className="p-4 pl-12 border border-gray-300 rounded-lg w-full bg-white text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400"
                      />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        </svg>
                      </div>
                    </div>
                    <button
                      onClick={handleAddressSearch}
                      disabled={isLoading || !address.trim()}
                      className={`px-6 py-4 rounded-lg text-white transition-all ${
                        isLoading || !address.trim()
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      Search
                    </button>
                  </div>
                  {searchError && (
                    <p className="mt-2 text-red-500 text-sm">{searchError}</p>
                  )}
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-base font-medium text-gray-700 mb-2">Select Location on Map</label>
                  <div className="h-[400px] rounded-lg overflow-hidden border border-gray-300 shadow-md">
                    <MapContainer
                      center={INDIA_CENTER}
                      zoom={5}
                      style={{ height: '100%', width: '100%' }}
                      minZoom={4}
                      maxZoom={18}
                      maxBounds={[
                        [6.2325274, 68.1766451],
                        [35.6745457, 97.4025614],
                      ]}
                    >
                      <TileLayer
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <ZoomControl position="bottomright" />
                      <LocationDetector onLocationClick={handleLocationClick} />
                      <MapViewUpdater lat={latitude} lng={longitude} />
                      {latitude && longitude && radius !== '' && parseInt(radius) >= 200 && (
                        <>
                          <Marker
                            position={[parseFloat(latitude), parseFloat(longitude)]}
                            icon={gpsIcon}
                          />
                          <Circle
                            center={[parseFloat(latitude), parseFloat(longitude)]}
                            radius={parseInt(radius)}
                            pathOptions={{ color: '#4f46e5', fillColor: '#4f46e5', fillOpacity: 0.2 }}
                          />
                        </>
                      )}
                    </MapContainer>
                  </div>
                  {latitude && longitude && (
                    <button
                      onClick={clearLocation}
                      className="mt-3 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none"
                    >
                      Clear Location
                    </button>
                  )}
                </div>

                <div className="group">
                  <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Selected Latitude</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={latitude}
                      readOnly
                      placeholder="Click map or search address to select"
                      className="p-4 pl-12 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800 text-base outline-none shadow-md"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l3-8m0 0l3 8m-3-8V4"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Selected Longitude</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={longitude}
                      readOnly
                      placeholder="Click map or search address to select"
                      className="p-4 pl-12 border border-gray-300 rounded-lg w-full bg-gray-100 text-gray-800 text-base outline-none shadow-md"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12h16m-8-8v16"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="group relative">
                  <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                    Geofence Radius (meters)
                    <span
                      className="ml-2 text-gray-500 text-sm cursor-pointer group-hover:text-indigo-600"
                      title="Minimum 200 meters. Defines the geofence boundary radius."
                    >
                      ℹ️
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={radius}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRadius(value);
                        setRadiusError(null);
                      }}
                      onBlur={() => {
                        if (radius !== '' && parseInt(radius) < 200) {
                          setRadiusError('Radius must be at least 200 meters.');
                        } else {
                          setRadiusError(null);
                        }
                      }}
                      placeholder="Enter radius (min 200)"
                      disabled={isLoading}
                      className={`p-4 pl-12 pr-4 border rounded-lg w-full bg-white text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 ${
                        radiusError ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"
                        />
                      </svg>
                    </div>
                    {radiusError && (
                      <p className="absolute left-0 top-full mt-1 text-red-500 text-sm">{radiusError}</p>
                    )}
                  </div>
                </div>

                <div className="group relative">
                  <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                    GPS Check Frequency (seconds)
                    <span className="ml-2 text-gray-500 text-sm cursor-pointer group-hover:text-indigo-600" title="Minimum 60 seconds. Determines how often GPS location is checked.">
                      ℹ️
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="60"
                      value={gpsCheckFrequency}
                      onChange={(e) => setGpsCheckFrequency(Math.max(60, parseInt(e.target.value) || 60))}
                      disabled={isLoading}
                      className="p-4 pl-12 border border-gray-300 rounded-lg w-full bg-white text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v10l4.24 4.24"></path>
                        <circle cx="12" cy="12" r="10"></circle>
                      </svg>
                    </div>
                  </div>
                </div>
              </>
            )}

            {geofenceOption && (
              <div className="col-span-1 md:col-span-2">
                <label className="block text-base font-medium text-gray-700 mb-2">{geofenceOption === 'Enable' ? 'Select Geofence Type' : 'Select Disable Geofence Type'}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {geofenceTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedGeofenceType(type)}
                      className={`p-5 rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring text-base ${
                        selectedGeofenceType === type
                          ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg'
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow'
                      }`}
                      disabled={isLoading}
                    >
                      <div className="flex items-center">
                        {type.includes('All') ? (
                          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="7.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 0v6M12 18v6M0 12h6M18 12h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {type}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(selectedGeofenceType === 'Geofence Targeted Devices' || selectedGeofenceType === 'Disable Geofence Targeted Devices') && (
              <div className="col-span-1 md:col-span-2">
                <label className="block text-base font-medium text-gray-700 mb-2">Select Device IDs</label>
                <div className="border border-gray-300 rounded-lg bg-white shadow-inner max-h-80 overflow-y-auto p-5">
                  {deviceIds.length === 0 ? (
                    <div className="text-gray-500 text-center py-10 flex flex-col items-center">
                      <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      No devices available
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {deviceIds.map((id) => (
                        <div key={id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`device-${id}`}
                            checked={selectedDeviceIds.includes(id)}
                            onChange={() => {
                              setSelectedDeviceIds((prev) =>
                                prev.includes(id) ? prev.filter((deviceId) => deviceId !== id) : [...prev, id]
                              );
                            }}
                            className="h-6 w-6 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all cursor-pointer"
                          />
                          <label
                            htmlFor={`device-${id}`}
                            className="ml-4 text-base text-gray-700 select-none cursor-pointer hover:text-indigo-600"
                          >
                            {id}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-3 text-sm text-gray-500">
                  {selectedDeviceIds.length} of {deviceIds.length} devices selected
                </div>
              </div>
            )}
          </div>

          {geofenceOption && (
            <div className="space-y-4">
              {errorMessage && (
                <div className="p-5 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center animate-success-slide">
                  <svg className="w-6 h-6 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-5 bg-green-50 border border-red-200 rounded-lg text-green-700 flex items-center animate-success-slide">
                  <svg className="w-6 h-6 mr-3 text-green-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {successMessage}
                </div>
              )}

              <button
                onClick={handleConfigureGeofence}
                disabled={isLoading || !isFormValid}
                className={`w-full py-5 rounded-lg transition-all focus:outline-none focus:ring transform hover:scale-105 text-lg ${
                  isLoading || !isFormValid
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg'
                }`}
              >
                {isLoading ? (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : geofenceOption === 'Enable' ? (
                  'Configure Geofencing'
                ) : (
                  'Disable Geofencing'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
