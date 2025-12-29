import { useState, useEffect } from 'react';
import { CalendarClock } from 'lucide-react';

interface ScheduleUpdateProps {
  refreshKey?: number;
}

export function ScheduleUpdate({ refreshKey }: ScheduleUpdateProps) {
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState('');
  const [ecuTypes] = useState(['MCU', 'VCU']);
  const [selectedEcuType, setSelectedEcuType] = useState('');
  const [binaryTypes, setBinaryTypes] = useState<string[]>([]);
  const [selectedBinaryType, setSelectedBinaryType] = useState('Firmware');
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [updateTypes] = useState(['Update All', 'Targeted Update']);
  const [selectedUpdateType, setSelectedUpdateType] = useState('');
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formProgress, setFormProgress] = useState(0);

  // Fetch device types
  useEffect(() => {
    const fetchDeviceTypes = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/updates/device-types`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        const sortedDeviceTypes = (data.deviceTypes || []).sort();
        setDeviceTypes(sortedDeviceTypes);
        if (sortedDeviceTypes.length > 0) {
          setSelectedDeviceType(sortedDeviceTypes[0]);
        }
      } catch (error) {
        console.error('Error fetching device types:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeviceTypes();
  }, [refreshKey]);

  // Fetch versions
  useEffect(() => {
    if (selectedDeviceType && selectedEcuType && selectedBinaryType) {
      const fetchVersions = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/updates/versions?devicetype=${encodeURIComponent(selectedDeviceType)}&ecutype=${encodeURIComponent(selectedEcuType)}&bintype=${encodeURIComponent(selectedBinaryType)}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
              },
            }
          );
          const data = await response.json();
          const sortedVersions = (data.versions || []).sort();
          setVersions(sortedVersions);
          if (sortedVersions.length > 0) {
            setSelectedVersion(sortedVersions[0]);
          }
        } catch (error) {
          console.error('Error fetching versions:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchVersions();
    }
  }, [selectedDeviceType, selectedEcuType, selectedBinaryType, refreshKey]);

  // Fetch device IDs
  useEffect(() => {
    if (selectedDeviceType && selectedUpdateType === 'Targeted Update') {
      const fetchDeviceIds = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/updates/device-ids?devicetype=${encodeURIComponent(selectedDeviceType)}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
              },
            }
          );
          const data = await response.json();
          const sortedDeviceIds = (data.deviceIds || []).sort();
          setDeviceIds(sortedDeviceIds);
          setSearchQuery('');
          setSelectedDeviceIds([]);
        } catch (error) {
          console.error('Error fetching device IDs:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDeviceIds();
    }
  }, [selectedDeviceType, selectedUpdateType, refreshKey]);

  // Set binary types based on ECU type
  useEffect(() => {
    if (selectedEcuType === 'VCU') {
      setBinaryTypes(['Firmware']);
      setSelectedBinaryType('Firmware');
    } else if (selectedEcuType === 'MCU') {
      setBinaryTypes(['Firmware', 'Configuration']);
      setSelectedBinaryType('Firmware');
    } else {
      setBinaryTypes([]);
      setSelectedBinaryType('');
    }
    const sortedEcuTypes = ecuTypes.sort();
    if (!selectedEcuType && sortedEcuTypes.length > 0) {
      setSelectedEcuType(sortedEcuTypes[0]);
    }
  }, [selectedEcuType, ecuTypes]);

  // Calculate form completion progress
  useEffect(() => {
    let completed = 0;
    const total = selectedUpdateType === 'Targeted Update' ? 6 : 5;

    if (selectedDeviceType) completed++;
    if (selectedEcuType) completed++;
    if (selectedBinaryType) completed++;
    if (selectedVersion) completed++;
    if (selectedUpdateType) completed++;
    if (selectedUpdateType === 'Targeted Update' && selectedDeviceIds.length > 0) completed++;

    setFormProgress((completed / total) * 100);
  }, [selectedDeviceType, selectedEcuType, selectedBinaryType, selectedVersion, selectedUpdateType, selectedDeviceIds]);

  const handleScheduleUpdate = async () => {
    if (!selectedDeviceType || !selectedEcuType || !selectedBinaryType || !selectedVersion || !selectedUpdateType) {
      alert('Please fill in all required fields.');
      return;
    }
    if (selectedUpdateType === 'Targeted Update' && selectedDeviceIds.length === 0) {
      alert('Please select at least one device ID for Targeted Update.');
      return;
    }

    const payload = {
      devicetype: selectedDeviceType,
      ecutype: selectedEcuType,
      bintype: selectedBinaryType,
      version: selectedVersion,
      updateType: selectedUpdateType,
      deviceIds: selectedUpdateType === 'Targeted Update' ? selectedDeviceIds : [],
    };

    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/updates/schedule-update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setSuccessMessage('✅ Schedule update successful!');
      setTimeout(() => setSuccessMessage(null), 3000);
      console.log('✅ Schedule update successful:', data);
    } catch (error) {
      console.error('❌ Error scheduling update:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDeviceId = (id: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((deviceId) => deviceId !== id) : [...prev, id]
    );
  };

  const toggleAllDeviceIds = () => {
    const devicesToToggle = searchQuery
      ? deviceIds.filter((id) => id.toLowerCase().includes(searchQuery.toLowerCase()))
      : deviceIds;

    if (devicesToToggle.every((id) => selectedDeviceIds.includes(id))) {
      setSelectedDeviceIds((prev) => prev.filter((id) => !devicesToToggle.includes(id)));
    } else {
      setSelectedDeviceIds((prev) => [...prev, ...devicesToToggle.filter((id) => !prev.includes(id))]);
    }
  };

  const filteredDeviceIds = searchQuery
    ? deviceIds.filter((id) => id.toLowerCase().includes(searchQuery.toLowerCase()))
    : deviceIds;

  const allFilteredSelected = filteredDeviceIds.length > 0 && filteredDeviceIds.every((id) => selectedDeviceIds.includes(id));

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
              <svg className="w-12 h-12 text-indigo-500" viewBox="0 0 33 25" fill="none" stroke="currentColor">
      <CalendarClock className="w-10 h-10 text-indigo-500" />
    </svg>
                Schedule System Update
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
              <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">ECU Type</label>
              <div className="relative">
                <select
                  className="p-4 pl-12 pr-10 border border-gray-300 rounded-lg w-full bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 appearance-none cursor-pointer"
                  value={selectedEcuType}
                  onChange={(e) => setSelectedEcuType(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="" className="text-gray-600 bg-white hover:bg-indigo-100 py-2">Select ECU Type</option>
                  {ecuTypes.map((type) => (
                    <option key={type} value={type} className="text-gray-600 bg-white hover:bg-indigo-100 py-2">{type}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
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
              <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Binary Type</label>
              <div className="relative">
                <select
                  className="p-4 pl-12 pr-10 border border-gray-300 rounded-lg w-full bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 appearance-none cursor-pointer"
                  value={selectedBinaryType}
                  onChange={(e) => setSelectedBinaryType(e.target.value)}
                  disabled={isLoading || binaryTypes.length === 0}
                >
                  <option value="" className="text-gray-600 bg-white hover:bg-indigo-100 py-2">Select Binary Type</option>
                  {binaryTypes.map((type) => (
                    <option key={type} value={type} className="text-gray-600 bg-white hover:bg-indigo-100 py-2">{type}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
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
              <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Version</label>
              <div className="relative">
                <select
                  className="p-4 pl-12 pr-10 border border-gray-300 rounded-lg w-full bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 appearance-none cursor-pointer"
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  disabled={isLoading || versions.length === 0}
                >
                  <option value="" className="text-gray-600 bg-white hover:bg-indigo-100 py-2">Select Version</option>
                  {versions.map((version) => (
                    <option key={version} value={version} className="text-gray-600 bg-white hover:bg-indigo-100 py-2">{version}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-base font-medium text-gray-700 mb-2">Update Type</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {updateTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedUpdateType(type)}
                    className={`p-5 rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring text-base ${
                      selectedUpdateType === type
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow'
                    }`}
                    disabled={isLoading}
                  >
                    <div className="flex items-center">
                      {type === 'Update All' ? (
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

            {selectedUpdateType === 'Targeted Update' && (
              <div className="col-span-1 md:col-span-2 animate-fadeIn">
                <div className="flex justify-between items-center mb-2">
                  <label className="flex items-center text-base font-medium text-gray-700">
                    <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    Select Device IDs
                  </label>
                  <button
                    onClick={toggleAllDeviceIds}
                    className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none"
                    type="button"
                  >
                    {allFilteredSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      className="p-4 pl-12 border border-gray-300 rounded-lg w-full bg-white text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all hover:border-gray-400"
                      placeholder="Search devices..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {searchQuery && (
                      <button
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        onClick={() => setSearchQuery('')}
                        type="button"
                      >
                        <svg className="h-6 w-6 text-gray-400 hover:text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="border border-gray-300 rounded-lg bg-white shadow-inner max-h-80 overflow-y-auto">
                  {filteredDeviceIds.length === 0 ? (
                    <div className="text-gray-500 text-center py-10 flex flex-col items-center">
                      <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      {deviceIds.length === 0 ? 'No devices available' : 'No devices match your search'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 p-5">
                      {filteredDeviceIds.map((id) => (
                        <div key={id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`device-${id}`}
                            checked={selectedDeviceIds.includes(id)}
                            onChange={() => toggleDeviceId(id)}
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
                <div className="mt-3 text-sm text-gray-500 flex justify-between">
                  <span>{selectedDeviceIds.length} of {deviceIds.length} devices selected</span>
                  {searchQuery && (
                    <span>{filteredDeviceIds.length} matching devices</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {successMessage && (
            <div className="p-5 mt-8 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center animate-success-slide">
              <svg className="w-6 h-6 mr-3 text-green-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {successMessage}
            </div>
          )}

          <button
            onClick={handleScheduleUpdate}
            disabled={isLoading}
            className={`w-full py-5 rounded-lg transition-all focus:outline-none focus:ring transform hover:scale-105 text-lg ${
              formProgress === 100
                ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg'
                : 'bg-indigo-300 text-white'
            }`}
          >
            {isLoading ? (
              <span className="inline-flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Scheduling...
              </span>
            ) : (
              'Schedule Update'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
