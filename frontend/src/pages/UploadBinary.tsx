import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';

interface UploadBinaryProps {
  refreshKey?: number;
}

export function UploadBinary({ refreshKey }: UploadBinaryProps) {
  const [deviceTypes, setDeviceTypes] = useState<string[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('');
  const [versions, setVersions] = useState<string[]>([]);
  const [requiredVersions, setRequiredVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [requiredVersion, setRequiredVersion] = useState<string>('None');
  const [newVersion, setNewVersion] = useState<string>('');
  const [selectedEcuType, setSelectedEcuType] = useState<string>('');
  const [selectedBinType, setSelectedBinType] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{ file1?: File; file2?: File }>({});
  const [formProgress, setFormProgress] = useState(0);
  const [isDragging, setIsDragging] = useState({ file1: false, file2: false });

  // Fetch device types
  useEffect(() => {
    const fetchDeviceTypes = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/device-types`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (!data.deviceTypes || data.deviceTypes.length === 0) {
          setErrorMessage('No device types available for your company.');
          return;
        }
        const sortedDeviceTypes = data.deviceTypes.sort();
        setDeviceTypes(sortedDeviceTypes);
        setSelectedDeviceType(sortedDeviceTypes[0] || '');
      } catch (error) {
        console.error('Error fetching device types:', error);
        setErrorMessage('Error fetching device types.');
      }
    };
    fetchDeviceTypes();
  }, [refreshKey]);

  // Fetch versions when deviceType, ecuType, or binType changes
  useEffect(() => {
    const fetchVersions = async () => {
      if (!selectedDeviceType || !selectedEcuType || !selectedBinType) return;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/versions?devicetype=${selectedDeviceType}&ecutype=${selectedEcuType}&bintype=${selectedBinType}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const data = await response.json();
        const sortedVersions = (data.versions || []).sort();
        setVersions([...sortedVersions, 'Add New Version']);
        setRequiredVersions(sortedVersions);
        setSelectedVersion(sortedVersions[0] || 'Add New Version');
        setRequiredVersion('None');
      } catch (error) {
        console.error('Error fetching versions:', error);
        setErrorMessage('Error fetching versions.');
      }
    };
    fetchVersions();
  }, [selectedDeviceType, selectedEcuType, selectedBinType, refreshKey]);

  // Set default ECU type
  useEffect(() => {
    setSelectedEcuType('VCU');
    setSelectedBinType('Firmware');
  }, []);

  // Calculate form completion progress
  useEffect(() => {
    let completed = 0;
    const total = selectedEcuType === 'VCU' ? 6 : 5;

    if (selectedDeviceType) completed++;
    if (selectedEcuType) completed++;
    if (selectedBinType) completed++;
    if (selectedVersion && (selectedVersion !== 'Add New Version' || newVersion)) completed++;
    if (selectedFiles.file1) completed++;
    if (selectedEcuType === 'VCU' && selectedFiles.file2) completed++;

    setFormProgress((completed / total) * 100);
  }, [selectedDeviceType, selectedEcuType, selectedBinType, selectedVersion, newVersion, selectedFiles, selectedEcuType]);

  const handleAddVersion = () => {
    if (newVersion && !versions.includes(newVersion)) {
      setVersions([...versions.filter((v) => v !== 'Add New Version'), newVersion, 'Add New Version'].sort());
      setSelectedVersion(newVersion);
      setNewVersion('');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, fileIndex: number) => {
    if (!event.target.files) return;
    const file = event.target.files[0];
    if (!file) return;

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.bin')) {
      setErrorMessage('Only .bin files are allowed.');
      return;
    }

    // Check file size limit (2 MB)
    const maxSize = 2 * 1024 * 1024; // 2 MB in bytes
    if (file.size > maxSize) {
      setErrorMessage('File size exceeds 2 MB limit. Please select a smaller file.');
      return;
    }

    setSelectedFiles((prev) => (fileIndex === 0 ? { ...prev, file1: file } : { ...prev, file2: file }));
    setErrorMessage(null);
  };

  const clearFile = (fileIndex: number) => {
    setSelectedFiles((prev) => (fileIndex === 0 ? { ...prev, file1: undefined } : { ...prev, file2: undefined }));
  };

  const handleUpload = async () => {
    if (!selectedDeviceType) {
      setErrorMessage('Please select a device type.');
      return;
    }
    if (!selectedEcuType) {
      setErrorMessage('Please select an ECU type.');
      return;
    }
    if (!selectedBinType) {
      setErrorMessage('Please select a binary type.');
      return;
    }
    if (selectedVersion === 'Add New Version' && !newVersion.trim()) {
      setErrorMessage('Please enter a new version.');
      return;
    }
    if (!selectedFiles.file1) {
      setErrorMessage('Please select at least one file.');
      return;
    }
    if (selectedEcuType === 'VCU' && !selectedFiles.file2) {
      setErrorMessage('Please select both files for VCU.');
      return;
    }

    if (selectedVersion === 'Add New Version' && newVersion.trim()) {
      if (!versions.includes(newVersion)) {
        setVersions([...versions.filter((v) => v !== 'Add New Version'), newVersion, 'Add New Version'].sort());
      }
      setSelectedVersion(newVersion);
    }

    const formData = new FormData();
    formData.append('devicetype', selectedDeviceType);
    formData.append('version', selectedVersion === 'Add New Version' ? newVersion : selectedVersion);
    formData.append('bintype', selectedBinType);
    formData.append('ecutype', selectedEcuType);
    formData.append('requiredVersion', requiredVersion === 'None' ? 'N/A' : requiredVersion);

    if (selectedEcuType === 'VCU') {
      formData.append('binaryFile1', selectedFiles.file1!);
      formData.append('binaryFile2', selectedFiles.file2 as File);
    } else {
      formData.append('binaryFile', selectedFiles.file1!);
    }

    try {
      const uploadUrl = selectedEcuType === 'VCU' ? `${import.meta.env.VITE_API_URL}/upload-vcu` : `${import.meta.env.VITE_API_URL}/upload`;
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('No authentication token found. Please log in.');
        return;
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed');
      setSuccessMessage(`Uploaded ${selectedDeviceType} ${selectedEcuType} ${selectedBinType} ${selectedVersion} successfully!`);
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 3000);
      setNewVersion('');
      setSelectedFiles({});
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrorMessage(error instanceof Error ? `Error during upload: ${error.message}` : 'An unknown error occurred during upload.');
    }
  };

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
                  <Upload className="w-5 h-5" />
                </svg>
                Upload Firmware Binary
              </h2>
              <div className="h-1 w-28 bg-gradient-to-r from-blue-500 to-indigo-600 mt-2"></div>
            </div>
            <div className="text-sm text-gray-500">
              {formProgress < 100 ? 'Complete all fields' : 'Ready to submit'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group">
              <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Select Device Type</label>
              <div className="relative">
                <select
                  className="p-4 pl-12 pr-10 border border-gray-300 rounded-lg w-full bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 appearance-none cursor-pointer"
                  value={selectedDeviceType}
                  onChange={(e) => setSelectedDeviceType(e.target.value)}
                >
                  <option value="" className="text-gray-600 bg-white hover:bg-indigo-100 py-2">Select Device Type</option>
                  {deviceTypes.map((device) => (
                    <option key={device} value={device} className="text-gray-600 bg-white hover:bg-indigo-100 py-2">{device}</option>
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
              <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Select ECU Type</label>
              <div className="relative">
                <select
                  className="p-4 pl-12 pr-10 border border-gray-300 rounded-lg w-full bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 appearance-none cursor-pointer"
                  value={selectedEcuType}
                  onChange={(e) => {
                    const newEcuType = e.target.value;
                    setSelectedEcuType(newEcuType);
                    setSelectedBinType(newEcuType === 'VCU' ? 'Firmware' : 'Firmware');
                    setSelectedFiles({});
                  }}
                >
                  {['VCU', 'MCU'].map((ecuType) => (
                    <option key={ecuType} value={ecuType} className="text-gray-600 bg-white hover:bg-indigo-100 py-2">{ecuType}</option>
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
              <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Select Binary Type</label>
              <div className="relative">
                <select
                  className="p-4 pl-12 pr-10 border border-gray-300 rounded-lg w-full bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 appearance-none cursor-pointer"
                  value={selectedBinType}
                  onChange={(e) => setSelectedBinType(e.target.value)}
                >
                  <option value="Firmware" className="text-gray-600 bg-white hover:bg-indigo-100 py-2">Firmware</option>
                  {selectedEcuType === 'MCU' && (
                    <option value="Configuration" className="text-gray-600 bg-white hover:bg-indigo-100 py-2">Configuration</option>
                  )}
                </select>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
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
              <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Select Version</label>
              <div className="relative">
                <select
                  className="p-4 pl-12 pr-10 border border-gray-300 rounded-lg w-full bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 appearance-none cursor-pointer"
                  value={selectedVersion}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedVersion(value);
                    if (value === 'Add New Version') setNewVersion('');
                  }}
                >
                  <option value="" className="text-gray-600 bg-white hover:bg-indigo-100 py-2">Select Version</option>
                  {versions.map((version) => (
                    <option key={version} value={version} className="text-gray-600 bg-white hover:bg-indigo-100 py-2">{version}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16h16M4 12h16M4 8h16" />
</svg>

                </div>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              {selectedVersion === 'Add New Version' && (
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newVersion}
                      onChange={(e) => setNewVersion(e.target.value)}
                      placeholder="Enter new version"
                      className="p-4 pl-12 border border-gray-300 rounded-lg w-full bg-white text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v4m0 0v4m0-4h4m-4 0H8m4 8h8m0 0V4a2 2 0 00-2-2H6a2 2 0 00-2 2v16a2 2 0 002 2h8" />
</svg>

                    </div>
                  </div>
                  <button
                    onClick={handleAddVersion}
                    className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            <div className="col-span-1 md:col-span-2 group">
              <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">Select Required Version</label>
              <div className="relative">
                <select
                  className="p-4 pl-12 pr-10 border border-gray-300 rounded-lg w-full bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 appearance-none cursor-pointer"
                  value={requiredVersion}
                  onChange={(e) => setRequiredVersion(e.target.value)}
                >
                  <option value="None" className="text-gray-600 bg-white hover:bg-indigo-100 py-2">None</option>
                  {requiredVersions.map((version) => (
                    <option key={version} value={version} className="text-gray-600 bg-white hover:bg-indigo-100 py-2">{version}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
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
              <label className="block text-base font-medium text-gray-700 mb-2">Upload Binary Files</label>
              {selectedEcuType === 'VCU' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div
                    className={`p-6 bg-white rounded-xl shadow-md border-2 border-dashed ${
                      isDragging.file1 ? 'border-indigo-600 bg-indigo-50' : 'border-indigo-200'
                    } hover:border-indigo-400 transition-all text-center cursor-pointer relative overflow-hidden group`}
                    onClick={() => document.getElementById('file-upload-1')?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging((prev) => ({ ...prev, file1: true }));
                    }}
                    onDragLeave={() => setIsDragging((prev) => ({ ...prev, file1: false }))}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging((prev) => ({ ...prev, file1: false }));
                      if (e.dataTransfer.files[0]) handleFileSelect({ target: { files: e.dataTransfer.files } } as any, 0);
                    }}
                  >
                    <svg className="w-16 h-16 text-indigo-400 mx-auto mb-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="text-gray-600 font-medium mb-2 group-hover:text-indigo-600 transition-colors">
                      Drop file here or click to upload (Position A)
                      <span className="ml-2 text-gray-500 text-sm cursor-pointer group-hover:text-indigo-600" title="Supported files: .bin (Max 2 MB)">
                      </span>
                    </p>
                    <input
                      type="file"
                      accept=".bin"
                      className="hidden"
                      id="file-upload-1"
                      onChange={(e) => handleFileSelect(e, 0)}
                    />
                    {selectedFiles.file1 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-gray-700 font-medium">{selectedFiles.file1.name}</p>
                        <p className="text-xs text-gray-500">Size: {(selectedFiles.file1.size / 1024).toFixed(2)} KB</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearFile(0);
                          }}
                          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none"
                        >
                          Clear File
                        </button>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-blue-100 opacity-0 group-hover:opacity-20 transition-opacity rounded-xl"></div>
                  </div>

                  <div
                    className={`p-6 bg-white rounded-xl shadow-md border-2 border-dashed ${
                      isDragging.file2 ? 'border-indigo-600 bg-indigo-50' : 'border-indigo-200'
                    } hover:border-indigo-400 transition-all text-center cursor-pointer relative overflow-hidden group`}
                    onClick={() => document.getElementById('file-upload-2')?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging((prev) => ({ ...prev, file2: true }));
                    }}
                    onDragLeave={() => setIsDragging((prev) => ({ ...prev, file2: false }))}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging((prev) => ({ ...prev, file2: false }));
                      if (e.dataTransfer.files[0]) handleFileSelect({ target: { files: e.dataTransfer.files } } as any, 1);
                    }}
                  >
                    <svg className="w-16 h-16 text-indigo-400 mx-auto mb-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="text-gray-600 font-medium mb-2 group-hover:text-indigo-600 transition-colors">
                      Drop file here or click to upload (Position B)
                      <span className="ml-2 text-gray-500 text-sm cursor-pointer group-hover:text-indigo-600" title="Supported files: .bin (Max 2 MB)">
                      </span>
                    </p>
                    <input
                      type="file"
                      accept=".bin"
                      className="hidden"
                      id="file-upload-2"
                      onChange={(e) => handleFileSelect(e, 1)}
                    />
                    {selectedFiles.file2 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-gray-700 font-medium">{selectedFiles.file2.name}</p>
                        <p className="text-xs text-gray-500">Size: {(selectedFiles.file2.size / 1024).toFixed(2)} KB</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearFile(1);
                          }}
                          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none"
                        >
                          Clear File
                        </button>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-blue-100 opacity-0 group-hover:opacity-20 transition-opacity rounded-xl"></div>
                  </div>
                </div>
              ) : (
                <div
                  className={`p-6 bg-white rounded-xl shadow-md border-2 border-dashed ${
                    isDragging.file1 ? 'border-indigo-600 bg-indigo-50' : 'border-indigo-200'
                  } hover:border-indigo-400 transition-all text-center cursor-pointer relative overflow-hidden group`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging((prev) => ({ ...prev, file1: true }));
                  }}
                  onDragLeave={() => setIsDragging((prev) => ({ ...prev, file1: false }))}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging((prev) => ({ ...prev, file1: false }));
                    if (e.dataTransfer.files[0]) handleFileSelect({ target: { files: e.dataTransfer.files } } as any, 0);
                  }}
                >
                  <svg className="w-16 h-16 text-indigo-400 mx-auto mb-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <p className="text-gray-600 font-medium mb-2 group-hover:text-indigo-600 transition-colors">
                    Drop file here or click to upload
                    <span className="ml-2 text-gray-500 text-sm cursor-pointer group-hover:text-indigo-600" title="Supported files: .bin (Max 2 MB)">
                    </span>
                  </p>
                  <input
                    type="file"
                    accept=".bin"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => handleFileSelect(e, 0)}
                  />
                  {selectedFiles.file1 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-700 font-medium">{selectedFiles.file1.name}</p>
                      <p className="text-xs text-gray-500">Size: {(selectedFiles.file1.size / 1024).toFixed(2)} KB</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFile(0);
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none"
                      >
                        Clear File
                      </button>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-blue-100 opacity-0 group-hover:opacity-20 transition-opacity rounded-xl"></div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Success/Error Messages Moved Here */}
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
              onClick={handleUpload}
              className="w-full py-5 rounded-lg transition-all focus:outline-none focus:ring transform hover:scale-105 text-lg bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg hover:from-indigo-700 hover:to-blue-600"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
