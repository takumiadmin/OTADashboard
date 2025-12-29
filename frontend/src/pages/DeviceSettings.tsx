import { useState, useEffect } from 'react';
import { SettingsIcon } from 'lucide-react';

interface DeviceSettingsProps {
  refreshKey?: number;
}

export function DeviceSettings({ refreshKey }: DeviceSettingsProps) {
  const [activeTab, setActiveTab] = useState('tab1');
  const [deviceTypes, setDeviceTypes] = useState<string[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState('');
  const [vcuSerialNumber, setVcuSerialNumber] = useState('');
  const [vinSerialNumber, setVinSerialNumber] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [overrideRequired, setOverrideRequired] = useState(false);

  // Tab 2 states
  const [selectedDeviceTypeTab2, setSelectedDeviceTypeTab2] = useState('');
  const [deviceInfoFrequency, setDeviceInfoFrequency] = useState(60);
  const [deviceCanDataFrequency, setDeviceCanDataFrequency] = useState(60);
  const [gpsFrequency, setGpsFrequency] = useState(600);
  const [updateTypes] = useState(['Configure All', 'Configure Targeted Devices']);
  const [selectedUpdateType, setSelectedUpdateType] = useState('');
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [successMessageTab2, setSuccessMessageTab2] = useState<string | null>(null);
  const [errorMessageTab2, setErrorMessageTab2] = useState<string | null>(null);
  const [isLoadingTab2, setIsLoadingTab2] = useState(false);

  // Tab 4 states
  const [selectedDeviceTypeTab4, setSelectedDeviceTypeTab4] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [confirmMobileNumber, setConfirmMobileNumber] = useState('');
  const [linkOptions] = useState(['Link All Devices', 'Link Targeted Devices']);
  const [selectedLinkOption, setSelectedLinkOption] = useState('');
  const [deviceIdsTab4, setDeviceIdsTab4] = useState<string[]>([]);
  const [selectedDeviceIdsTab4, setSelectedDeviceIdsTab4] = useState<string[]>([]);
  const [successMessageTab4, setSuccessMessageTab4] = useState<string | null>(null);
  const [errorMessageTab4, setErrorMessageTab4] = useState<string | null>(null);
  const [isLoadingTab4, setIsLoadingTab4] = useState(false);

  // Fetch device types and reset states on refresh
  useEffect(() => {
    // Reset all states
    setActiveTab('tab1');
    setSelectedDeviceType('');
    setVcuSerialNumber('');
    setVinSerialNumber('');
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsLoading(false);
    setOverrideRequired(false);
    setSelectedDeviceTypeTab2('');
    setDeviceInfoFrequency(60);
    setDeviceCanDataFrequency(60);
    setGpsFrequency(600);
    setSelectedUpdateType('');
    setDeviceIds([]);
    setSelectedDeviceIds([]);
    setSuccessMessageTab2(null);
    setErrorMessageTab2(null);
    setIsLoadingTab2(false);
    setSelectedDeviceTypeTab4('');
    setMobileNumber('');
    setConfirmMobileNumber('');
    setSelectedLinkOption('');
    setDeviceIdsTab4([]);
    setSelectedDeviceIdsTab4([]);
    setSuccessMessageTab4(null);
    setErrorMessageTab4(null);
    setIsLoadingTab4(false);

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
        const sortedDeviceTypes = (data.deviceTypes || []).sort();
        setDeviceTypes(sortedDeviceTypes);
      } catch (error) {
        console.error('Error fetching device types:', error);
        setErrorMessage('Failed to fetch device types');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeviceTypes();
  }, [refreshKey]);

  // Fetch device IDs for Tab 2
  useEffect(() => {
    const fetchDeviceIds = async () => {
      if (selectedDeviceTypeTab2 && selectedUpdateType === 'Configure Targeted Devices') {
        try {
          setIsLoadingTab2(true);
          setErrorMessageTab2(null);
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/devices/device-ids?deviceType=${encodeURIComponent(selectedDeviceTypeTab2)}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
              },
            }
          );
          const data = await response.json();
          setDeviceIds(data.deviceIds || []);
        } catch (error) {
          console.error('Error fetching device IDs:', error);
          setErrorMessageTab2('Failed to fetch device IDs');
        } finally {
          setIsLoadingTab2(false);
        }
      } else {
        setDeviceIds([]);
        setSelectedDeviceIds([]);
      }
    };
    fetchDeviceIds();
  }, [selectedDeviceTypeTab2, selectedUpdateType, refreshKey]);

  // Fetch device IDs for Tab 4
  useEffect(() => {
    const fetchDeviceIdsTab4 = async () => {
      if (selectedDeviceTypeTab4 && selectedLinkOption === 'Link Targeted Devices') {
        try {
          setIsLoadingTab4(true);
          setErrorMessageTab4(null);
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/devices/device-ids?deviceType=${encodeURIComponent(selectedDeviceTypeTab4)}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
              },
            }
          );
          const data = await response.json();
          setDeviceIdsTab4(data.deviceIds || []);
        } catch (error) {
          console.error('Error fetching device IDs for Tab 4:', error);
          setErrorMessageTab4('Failed to fetch device IDs');
        } finally {
          setIsLoadingTab4(false);
        }
      } else {
        setDeviceIdsTab4([]);
        setSelectedDeviceIdsTab4([]);
      }
    };
    fetchDeviceIdsTab4();
  }, [selectedDeviceTypeTab4, selectedLinkOption, refreshKey]);

  // Handle link submission (Tab 1)
  const handleLink = async (override = false) => {
    try {
      setIsLoading(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/devices/link-vin-vcu`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceType: selectedDeviceType,
          vcuSerialNumber,
          vinSerialNumber,
          override,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage(data.message);
        setOverrideRequired(false);
        setVcuSerialNumber('');
        setVinSerialNumber('');
        setSelectedDeviceType('');
      } else {
        if (data.overrideRequired) {
          setOverrideRequired(true);
          setErrorMessage(data.message);
        } else {
          setErrorMessage(data.message || 'Failed to link VIN with VCU');
        }
      }
    } catch (error) {
      console.error('Error linking VIN with VCU:', error);
      setErrorMessage('Failed to link VIN with VCU');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle frequency configuration (Tab 2)
  const handleConfigureFrequencies = async () => {
    try {
      setIsLoadingTab2(true);
      setSuccessMessageTab2(null);
      setErrorMessageTab2(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/devices/configure-pub-frequency`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceType: selectedDeviceTypeTab2,
          deviceInfoFrequency,
          deviceCanDataFrequency,
          gpsFrequency,
          updateType: selectedUpdateType,
          deviceIds: selectedUpdateType === 'Configure Targeted Devices' ? selectedDeviceIds : [],
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessageTab2(data.message);
        setSelectedDeviceIds([]);
        setSelectedDeviceTypeTab2('');
        setDeviceInfoFrequency(60);
        setDeviceCanDataFrequency(60);
        setGpsFrequency(600);
        setSelectedUpdateType('');
      } else {
        setErrorMessageTab2(data.message || 'Failed to configure frequencies');
      }
    } catch (error) {
      console.error('Error configuring frequencies:', error);
      setErrorMessageTab2('Failed to configure frequencies');
    } finally {
      setIsLoadingTab2(false);
    }
  };

  // Handle mobile number linking (Tab 4)
  const handleLinkMobileNumber = async () => {
    try {
      setIsLoadingTab4(true);
      setSuccessMessageTab4(null);
      setErrorMessageTab4(null);

      // Validate mobile numbers match
      if (mobileNumber !== confirmMobileNumber) {
        setErrorMessageTab4('Mobile numbers do not match.');
        return;
      }

      // Validate device selection for targeted option
      if (selectedLinkOption === 'Link Targeted Devices' && selectedDeviceIdsTab4.length === 0) {
        setErrorMessageTab4('No devices selected.');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/devices/link-vin-mobile`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceType: selectedDeviceTypeTab4,
          mobileNumber,
          linkOption: selectedLinkOption,
          deviceIds: selectedLinkOption === 'Link Targeted Devices' ? selectedDeviceIdsTab4 : [],
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessageTab4(data.message);
        setMobileNumber('');
        setConfirmMobileNumber('');
        setSelectedDeviceIdsTab4([]);
        setSelectedDeviceTypeTab4('');
        setSelectedLinkOption('');
      } else {
        setErrorMessageTab4(data.message || 'Failed to link mobile number');
      }
    } catch (error) {
      console.error('Error linking mobile number:', error);
      setErrorMessageTab4('Failed to link mobile number');
    } finally {
      setIsLoadingTab4(false);
    }
  };

  const isFormValidTab1 = selectedDeviceType && vcuSerialNumber && vinSerialNumber;
  const isFormValidTab2 =
    selectedDeviceTypeTab2 &&
    deviceInfoFrequency >= 1 &&
    deviceCanDataFrequency >= 1 &&
    gpsFrequency >= 1 &&
    selectedUpdateType &&
    (selectedUpdateType === 'Configure All' || selectedDeviceIds.length > 0);
  const isFormValidTab4 =
    selectedDeviceTypeTab4 &&
    mobileNumber &&
    confirmMobileNumber &&
    mobileNumber === confirmMobileNumber &&
    selectedLinkOption &&
    (selectedLinkOption === 'Link All Devices' || selectedDeviceIdsTab4.length > 0);

  return (
    <div className="min-h-screen bg-white py-12 px-6 flex items-center justify-center">
      <div className="w-full max-w-6xl bg-white shadow-2xl border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 ease-in-out">
        <div className="space-y-8 p-10">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-indigo-700 flex items-center justify-center">
              <svg className="w-10 h-10 mr-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <SettingsIcon className="w-6 h-6" />
              </svg>
              Device Management Console
            </h2>
            <div className="h-1 w-28 bg-gradient-to-r from-blue-500 to-indigo-600 mt-2 mx-auto"></div>
          </div>

          {/* Tabs */}
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={() => setActiveTab('tab1')}
              className={`flex items-center px-6 py-4 rounded-lg text-base font-medium transition-all transform hover:scale-105 focus:outline-none focus:ring ${
                activeTab === 'tab1'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5Zm3 0h12M7.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm9 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
              </svg>
              Link VIN With VCU
            </button>
            <button
              onClick={() => setActiveTab('tab2')}
              className={`flex items-center px-6 py-4 rounded-lg text-base font-medium transition-all transform hover:scale-105 focus:outline-none focus:ring ${
                activeTab === 'tab2'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M16 12h4M4 18h6M14 18h6" />
                <circle cx="14" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="10" cy="18" r="1.5" fill="currentColor"/>
              </svg>
              Configure Pub Frequency
            </button>
            <button
              onClick={() => setActiveTab('tab4')}
              className={`flex items-center px-6 py-4 rounded-lg text-base font-medium transition-all transform hover:scale-105 focus:outline-none focus:ring ${
                activeTab === 'tab4'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="7" y="2" width="10" height="20" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="18" r="1" />
                <line x1="9" y1="6" x2="15" y2="6" />
                <line x1="9" y1="10" x2="15" y2="10" />
              </svg>
              Link VIN With Mobile
            </button>
          </div>

          {/* Tab 1: Link VIN With VCU */}
          {activeTab === 'tab1' && (
            <div className="bg-white rounded-xl p-8 shadow-inner">
              <h3 className="text-2xl font-semibold text-indigo-700 text-center mb-6">
                Link VIN With VCU
                <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-600 mt-2 mx-auto"></div>
              </h3>

              {errorMessage && (
                <div className="p-5 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center animate-success-slide">
                  <svg className="w-6 h-6 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-5 mb-6 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center animate-success-slide">
                  <svg className="w-6 h-6 mr-3 text-green-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {successMessage}
                </div>
              )}

              <div className="space-y-6">
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
                  <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">VCU Serial Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={vcuSerialNumber}
                      onChange={(e) => setVcuSerialNumber(e.target.value)}
                      disabled={isLoading}
                      placeholder="Enter VCU Serial Number"
                      className="p-4 pl-12 border border-gray-300 rounded-lg w-full bg-white text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 6h18M3 14h18M3 18h18"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">VIN Serial Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={vinSerialNumber}
                      onChange={(e) => setVinSerialNumber(e.target.value)}
                      disabled={isLoading}
                      placeholder="Enter VIN Serial Number"
                      className="p-4 pl-12 border border-gray-300 rounded-lg w-full bg-white text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 18v-8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8"></path>
                        <circle cx="9" cy="13" r="1"></circle>
                        <circle cx="15" cy="13" r="1"></circle>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m8 18 1.5-6"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m16 18-1.5-6"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6V5a2 2 0 0 1 2-2h2"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 6V5a2 2 0 0 0-2-2h-2"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={() => handleLink(false)}
                    disabled={isLoading || !isFormValidTab1}
                    className={`flex items-center px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 focus:outline-none focus:ring ${
                      isLoading || !isFormValidTab1
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg'
                    }`}
                  >
                    {isLoading && !overrideRequired ? (
                      <span className="inline-flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Linking...
                      </span>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        Link Devices
                      </>
                    )}
                  </button>

                  {overrideRequired && (
                    <button
                      onClick={() => handleLink(true)}
                      disabled={isLoading}
                      className={`flex items-center px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 focus:outline-none focus:ring ${
                        isLoading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                      }`}
                    >
                      {isLoading && overrideRequired ? (
                        <span className="inline-flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Overriding...
                        </span>
                      ) : (
                        <>
                          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0-1.1.9-2 2-2m-2 2c0 1.1-.9 2-2 2m2-2v4m8-2c0 5.5-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2m8 10c0-5.5-4.5-10-10-10"></path>
                          </svg>
                          Override Existing Link
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Configure Pub Frequency */}
          {activeTab === 'tab2' && (
            <div className="bg-white rounded-xl p-8 shadow-inner">
              <h3 className="text-2xl font-semibold text-indigo-700 text-center mb-6">
                Configure Pub Frequency
                <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-600 mt-2 mx-auto"></div>
              </h3>

              {errorMessageTab2 && (
                <div className="p-5 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center animate-success-slide">
                  <svg className="w-6 h-6 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {errorMessageTab2}
                </div>
              )}

              {successMessageTab2 && (
                <div className="p-5 mb-6 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center animate-success-slide">
                  <svg className="w-6 h-6 mr-3 text-green-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {successMessageTab2}
                </div>
              )}

              <div className="space-y-6">
                <div className="group">
                  <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Device Type</label>
                  <div className="relative">
                    <select
                      className="p-4 pl-12 pr-10 border border-gray-300 rounded-lg w-full bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 appearance-none cursor-pointer"
                      value={selectedDeviceTypeTab2}
                      onChange={(e) => setSelectedDeviceTypeTab2(e.target.value)}
                      disabled={isLoadingTab2}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="group">
                    <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Device Info Frequency (seconds)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={deviceInfoFrequency}
                        onChange={(e) => setDeviceInfoFrequency(Math.max(1, parseInt(e.target.value) || 1))}
                        disabled={isLoadingTab2}
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

                  <div className="group">
                    <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Device CAN Data Frequency (seconds)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={deviceCanDataFrequency}
                        onChange={(e) => setDeviceCanDataFrequency(Math.max(1, parseInt(e.target.value) || 1))}
                        disabled={isLoadingTab2}
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

                  <div className="group">
                    <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">GPS Frequency (seconds)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={gpsFrequency}
                        onChange={(e) => setGpsFrequency(Math.max(1, parseInt(e.target.value) || 1))}
                        disabled={isLoadingTab2}
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
                </div>

                <div className="group">
                  <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Update Type</label>
                  <div className="relative">
                    <select
                      className="p-4 pl-12 pr-10 border border-gray-300 rounded-lg w-full bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 appearance-none cursor-pointer"
                      value={selectedUpdateType}
                      onChange={(e) => setSelectedUpdateType(e.target.value)}
                      disabled={isLoadingTab2}
                    >
                      <option value="" className="text-gray-600 bg-white hover:bg-indigo-100 py-2">Select Update Type</option>
                      {updateTypes.map((type) => (
                        <option key={type} value={type} className="text-gray-600 bg-white hover:bg-indigo-100 py-2">{type}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {selectedUpdateType === 'Configure Targeted Devices' && (
                  <div className="group">
                    <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Select Device IDs</label>
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

                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleConfigureFrequencies}
                    disabled={isLoadingTab2 || !isFormValidTab2}
                    className={`flex items-center px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 focus:outline-none focus:ring ${
                      isLoadingTab2 || !isFormValidTab2
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg'
                    }`}
                  >
                    {isLoadingTab2 ? (
                      <span className="inline-flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Configuring...
                      </span>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        Configure Frequencies
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Link VIN With Mobile Number */}
          {activeTab === 'tab4' && (
            <div className="bg-white rounded-xl p-8 shadow-inner">
              <h3 className="text-2xl font-semibold text-indigo-700 text-center mb-6">
                Link VIN With Mobile Number
                <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-600 mt-2 mx-auto"></div>
              </h3>

              {errorMessageTab4 && (
                <div className="p-5 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center animate-success-slide">
                  <svg className="w-6 h-6 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {errorMessageTab4}
                </div>
              )}

              {successMessageTab4 && (
                <div className="p-5 mb-6 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center animate-success-slide">
                  <svg className="w-6 h-6 mr-3 text-green-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {successMessageTab4}
                </div>
              )}

              <div className="space-y-6">
                <div className="group">
                  <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Device Type</label>
                  <div className="relative">
                    <select
                      className="p-4 pl-12 pr-10 border border-gray-300 rounded-lg w-full bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 appearance-none cursor-pointer"
                      value={selectedDeviceTypeTab4}
                      onChange={(e) => setSelectedDeviceTypeTab4(e.target.value)}
                      disabled={isLoadingTab4}
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
                  <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Mobile Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      disabled={isLoadingTab4}
                      placeholder="Enter Mobile Number"
                      className="p-4 pl-12 border border-gray-300 rounded-lg w-full bg-white text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h18M3 9h18M3 13h18M3 17h18M10 5v12"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Confirm Mobile Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={confirmMobileNumber}
                      onChange={(e) => setConfirmMobileNumber(e.target.value)}
                      disabled={isLoadingTab4}
                      placeholder="Confirm Mobile Number"
                      className="p-4 pl-12 border border-gray-300 rounded-lg w-full bg-white text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h18M3 9h18M3 13h18M3 17h18M10 5v12"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Link Option</label>
                  <div className="relative">
                    <select
                      className="p-4 pl-12 pr-10 border border-gray-300 rounded-lg w-full bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 appearance-none cursor-pointer"
                      value={selectedLinkOption}
                      onChange={(e) => setSelectedLinkOption(e.target.value)}
                      disabled={isLoadingTab4}
                    >
                      <option value="" className="text-gray-600 bg-white hover:bg-indigo-100 py-2">Select Link Option</option>
                      {linkOptions.map((option) => (
                        <option key={option} value={option} className="text-gray-600 bg-white hover:bg-indigo-100 py-2">{option}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {selectedLinkOption === 'Link Targeted Devices' && (
                  <div className="group">
                    <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Select Device IDs</label>
                    <div className="border border-gray-300 rounded-lg bg-white shadow-inner max-h-80 overflow-y-auto p-5">
                      {deviceIdsTab4.length === 0 ? (
                        <div className="text-gray-500 text-center py-10 flex flex-col items-center">
                          <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          No devices available
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {deviceIdsTab4.map((id) => (
                            <div key={id} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`device-tab4-${id}`}
                                checked={selectedDeviceIdsTab4.includes(id)}
                                onChange={() => {
                                  setSelectedDeviceIdsTab4((prev) =>
                                    prev.includes(id) ? prev.filter((deviceId) => deviceId !== id) : [...prev, id]
                                  );
                                }}
                                className="h-6 w-6 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all cursor-pointer"
                              />
                              <label
                                htmlFor={`device-tab4-${id}`}
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
                      {selectedDeviceIdsTab4.length} of {deviceIdsTab4.length} devices selected
                    </div>
                  </div>
                )}

                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleLinkMobileNumber}
                    disabled={isLoadingTab4 || !isFormValidTab4}
                    className={`flex items-center px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 focus:outline-none focus:ring ${
                      isLoadingTab4 || !isFormValidTab4
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg'
                    }`}
                  >
                    {isLoadingTab4 ? (
                      <span className="inline-flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Linking...
                      </span>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        Link Mobile Number
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
