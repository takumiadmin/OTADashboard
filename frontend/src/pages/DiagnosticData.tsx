import { useState, useEffect } from 'react';
import axios from 'axios';
import { ErrorBoundary } from 'react-error-boundary';
import { LineChartComponent } from '../components/LineChartComponent';
import { Activity } from 'lucide-react';

interface DataPoint {
  timestamp: string; // ISO string
  value: number | string; // Numeric or categorical
}

interface DiagnosticDataResponse {
  deviceid: string;
  data: Record<string, DataPoint[]>;
  timestamp: number;
}

interface DiagnosticDataProps {
  refreshKey?: number;
}

const parameterProps: Record<string, { title: string; color: string; unit: string; isCategorical?: boolean; categories?: string[] }> = {
  actual_irms: { title: 'Actual IRMS', color: 'orange', unit: 'A' },
  actual_speed: { title: 'Actual Speed', color: 'blue', unit: 'RPM' },
  actual_state: { title: 'State of Charge', color: 'pink', unit: '', isCategorical: true, categories: ['IDLE', 'RUNNING'] },
  actual_torque_ref: { title: 'Torque', color: 'red', unit: 'Nm' },
  advance_angle_ref: { title: 'Advance Angle', color: 'brown', unit: '°' },
  alarm_flag_1: { title: 'Alarm', color: 'red', unit: '', isCategorical: true, categories: ['false', 'true'] },
  current_dc: { title: 'Current', color: 'purple', unit: 'A' },
  current_id: { title: 'Current ID', color: 'teal', unit: 'A' },
  current_iq: { title: 'Current IQ', color: 'gold', unit: 'A' },
  current_irms_ref: { title: 'Current IRMS Ref', color: 'cyan', unit: 'A' },
  efficiency_flag_1: { title: 'Efficiency', color: 'gray', unit: '', isCategorical: true, categories: ['false', 'true'] },
  igbt_temp_h3: { title: 'IGBT Temp', color: 'crimson', unit: '°C' },
  int_temp: { title: 'Internal Temp', color: 'darkblue', unit: '°C' },
  speed_ref: { title: 'Speed Ref', color: 'darkgreen', unit: 'RPM' },
  state: { title: 'State', color: 'darkred', unit: '', isCategorical: true, categories: ['NOTOK', 'OK'] },
  throttle_adc: { title: 'Throttle ADC', color: 'navy', unit: '' },
  torque_ref: { title: 'Torque Ref', color: 'darkgoldenrod', unit: 'Nm' },
  voltage_vdc: { title: 'Voltage', color: 'green', unit: 'V' },
  voltage_vrms: { title: 'Voltage VRMS', color: 'indigo', unit: 'V' },
};

// Error Boundary Fallback
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div role="alert" className="p-5 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center animate-success-slide">
    <svg className="w-6 h-6 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    <p>Something went wrong: {error.message}</p>
    <button
      onClick={resetErrorBoundary}
      className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md"
    >
      Try again
    </button>
  </div>
);

export function DiagnosticData({ refreshKey }: DiagnosticDataProps) {
  const [deviceid, setDeviceid] = useState('');
  const [parameters, setParameters] = useState<string[]>([]);
  const [selectedParams, setSelectedParams] = useState<string[]>([]);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticDataResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedParams, setFetchedParams] = useState<string[]>([]);
  const [showRawSelected, setShowRawSelected] = useState(false);
  const [showRawAll, setShowRawAll] = useState(false);
  const [rawData, setRawData] = useState<Record<string, DataPoint[]> | null>(null);
  const [formProgress, setFormProgress] = useState(0);
  const [deviceTypes, setDeviceTypes] = useState<string[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('');
  const [deviceIds, setDeviceIds] = useState<string[]>([]);

  useEffect(() => {
    // Reset form and data states on refresh
    setDeviceid('');
    setSelectedParams([]);
    setDiagnosticData(null);
    setFetchedParams([]);
    setRawData(null);
    setShowRawSelected(false);
    setShowRawAll(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsFetching(false);

    axios
      .get(`${import.meta.env.VITE_API_URL}/diagnostics/parameters`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      .then((response) => setParameters(response.data))
      .catch((error) => {
        console.error('Error fetching parameters:', error);
        setErrorMessage('Failed to fetch parameters');
      });

    axios
      .get(`${import.meta.env.VITE_API_URL}/diagnostics/device-types`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      .then((response) => {
        const types = response.data.deviceTypes || [];
        setDeviceTypes(types);
        setSelectedDeviceType(''); // Reset to empty instead of selecting first type
      })
      .catch((error) => {
        console.error('Error fetching device types:', error);
        setErrorMessage('Failed to fetch device types');
      });
  }, [refreshKey]);

  useEffect(() => {
    if (selectedDeviceType) {
      axios
        .get(`${import.meta.env.VITE_API_URL}/diagnostics/device-ids`, {
          params: { devicetype: selectedDeviceType },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })
        .then((response) => setDeviceIds(response.data.deviceIds || []))
        .catch((error) => {
          console.error('Error fetching device IDs:', error);
          setErrorMessage('Failed to fetch device IDs');
        });
    } else {
      setDeviceIds([]);
      setDeviceid('');
    }
  }, [selectedDeviceType, refreshKey]);

  // Calculate form completion progress
  useEffect(() => {
    let completed = 0;
    const total = 2;

    if (deviceid) completed++;
    if (selectedParams.length > 0) completed++;

    setFormProgress((completed / total) * 100);
  }, [deviceid, selectedParams]);

  const toggleParameter = (param: string) => {
    setSelectedParams((prev) =>
      prev.includes(param) ? prev.filter((p) => p !== param) : [...prev, param]
    );
  };

  const fetchData = () => {
    if (!deviceid) {
      setErrorMessage('Please select or enter a Device ID.');
      setSuccessMessage(null);
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsFetching(true);

    axios
      .get(`${import.meta.env.VITE_API_URL}/diagnostics/data/${deviceid}`, {
        params: { params: selectedParams.join(',') },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      .then((response) => {
        console.log('Fetched data:', response.data);
        if (!response.data.data || Object.keys(response.data.data).length === 0) {
          setErrorMessage('No data found for the selected device and parameters.');
          setDiagnosticData(null);
          setFetchedParams([]);
          setRawData(null);
        } else {
          setDiagnosticData(response.data);
          setFetchedParams(selectedParams);
          setRawData(response.data.data);
          setSuccessMessage('Diagnostic data fetched successfully!');
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      })
      .catch((error) => {
        console.error('Error fetching diagnostic data:', error);
        setErrorMessage('Failed to fetch diagnostic data');
        setDiagnosticData(null);
        setFetchedParams([]);
        setRawData(null);
      })
      .finally(() => setIsFetching(false));
  };

  const resetErrorBoundary = () => {
    setErrorMessage(null);
    setDiagnosticData(null);
    setFetchedParams([]);
    setRawData(null);
    fetchData();
  };

  // Determine which parameters to show in the table
  const tableParams = showRawAll ? parameters : showRawSelected ? selectedParams : [];

  const handleDeviceIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeviceid(e.target.value);
  };

  const handleDeviceIdSelect = (id: string) => {
    setDeviceid(id);
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
                  <Activity className="w-5 h-5" />
                </svg>
                Diagnostic Data
              </h2>
              <div className="h-1 w-28 bg-gradient-to-r from-blue-500 to-indigo-600 mt-2"></div>
            </div>
            <div className="text-sm text-gray-500">
              {formProgress < 100 ? 'Complete all fields' : 'Ready to fetch'}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex space-x-4">
              <div className="group flex-1">
                <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                  Select Device Type
                </label>
                <div className="relative">
                  <select
                    className="p-4 pl-12 border border-gray-300 rounded-lg w-full bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400 appearance-none"
                    value={selectedDeviceType}
                    onChange={(e) => setSelectedDeviceType(e.target.value)}
                  >
                    <option value="">Select Device Type</option>
                    {deviceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group flex-1">
                <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                  Enter Device ID (VIN)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter or select Device ID (VIN)"
                    className="p-4 pl-12 border border-gray-300 rounded-lg w-full bg-gradient-to-r from-white to-gray-50 text-gray-800 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400"
                    value={deviceid}
                    onChange={handleDeviceIdChange}
                    list="deviceIdOptions"
                  />
                  <datalist id="deviceIdOptions">
                    {deviceIds.map((id) => (
                      <option key={id} value={id} />
                    ))}
                  </datalist>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-500">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="group">
              <label className="block text-base font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
                Select Parameters
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {parameters.map((param) => (
                  <label key={param} className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-400 transition-all shadow-sm hover:shadow-md cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedParams.includes(param)}
                      onChange={() => toggleParameter(param)}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all cursor-pointer"
                      disabled={isFetching}
                    />
                    <span className="text-gray-700 text-base">{parameterProps[param]?.title || param}</span>
                  </label>
                ))}
              </div>
            </div>

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
                onClick={fetchData}
                className={`w-full py-5 rounded-lg transition-all focus:outline-none focus:ring transform hover:scale-105 text-lg ${
                  isFetching
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg hover:from-indigo-700 hover:to-blue-600'
                }`}
                disabled={isFetching}
              >
                {isFetching ? (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Fetching...
                  </span>
                ) : (
                  'Fetch Data'
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-400 transition-all shadow-sm hover:shadow-md cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRawSelected}
                  onChange={(e) => setShowRawSelected(e.target.checked)}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all cursor-pointer"
                  disabled={isFetching || !diagnosticData}
                />
                <span className="text-gray-700 text-base">
                  Show raw data for selected parameters
                  <span className="ml-2 text-gray-500 text-sm cursor-pointer hover:text-indigo-600" title="Display raw data points for the parameters you've selected">
                    ℹ️
                  </span>
                </span>
              </label>
              <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-400 transition-all shadow-sm hover:shadow-md cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRawAll}
                  onChange={(e) => setShowRawAll(e.target.checked)}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all cursor-pointer"
                  disabled={isFetching || !diagnosticData}
                />
                <span className="text-gray-700 text-base">
                  Show raw data for all parameters
                  <span className="ml-2 text-gray-500 text-sm cursor-pointer hover:text-indigo-600" title="Display raw data points for all available parameters">
                    ℹ️
                  </span>
                </span>
              </label>
            </div>

            {/* Only render this section if diagnosticData exists */}
            {diagnosticData && (
              <ErrorBoundary FallbackComponent={ErrorFallback} onReset={resetErrorBoundary} resetKeys={[selectedParams.join(',')]}>
                <div className="grid gap-6">
                  {fetchedParams.map((param) => {
                    const prop = parameterProps[param];
                    const chartData = diagnosticData.data[param];
                    if (!prop || !chartData || chartData.length === 0) {
                      return (
                        <div key={`${param}-nodata`} className="text-gray-500 p-4 rounded-lg bg-gray-50 border border-gray-200 animate-fade-in">
                          No data available for {prop?.title || param}
                        </div>
                      );
                    }

                    const transformedData = chartData
                      .map((d) => {
                        const timestamp = new Date(d.timestamp).getTime();
                        const value = prop.isCategorical
                          ? prop.categories!.indexOf(d.value as string)
                          : Number(d.value);
                        if (isNaN(timestamp) || value === null || isNaN(value)) {
                          console.warn(`Invalid data point for ${param}:`, { timestamp, value });
                          return null;
                        }
                        return { x: timestamp, y: value };
                      })
                      .filter((d) => d !== null) as { x: number; y: number }[];

                    let minY = Infinity;
                    let maxY = -Infinity;
                    if (!prop.isCategorical && transformedData.length > 0) {
                      transformedData.forEach((d) => {
                        minY = Math.min(minY, d.y);
                        maxY = Math.max(maxY, d.y);
                      });
                      const padding = (maxY - minY) * 0.1 || 100;
                      minY = minY - padding;
                      maxY = maxY + padding;
                    }

                    return (
                      <div key={`${param}-${transformedData.length}`} className="w-full animate-fade-in">
                        <LineChartComponent
                          title={prop.title}
                          data={transformedData}
                          color={prop.color}
                          unit={prop.unit}
                          isCategorical={prop.isCategorical}
                          categories={prop.categories}
                          // minY={prop.isCategorical ? undefined : minY}
                          // maxY={prop.isCategorical ? undefined : maxY}
                        />
                      </div>
                    );
                  })}
                </div>
              </ErrorBoundary>
            )}

            {(showRawSelected || showRawAll) && rawData && (
              <div className="overflow-x-auto mt-6 animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Raw Data {showRawAll ? 'for All Parameters' : 'for Selected Parameters'}
                </h3>
                <table className="w-full border-collapse bg-white shadow-md rounded-lg">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">Timestamp</th>
                      {tableParams.map((param) => (
                        <th key={param} className="border border-gray-200 p-3 text-left text-gray-700 font-medium">
                          {parameterProps[param]?.title || param}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(rawData[tableParams[0]] || []).map((dataPoint, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="border border-gray-200 p-3 text-gray-600">{dataPoint.timestamp}</td>
                        {tableParams.map((param) => (
                          <td key={`${param}-${index}`} className="border border-gray-200 p-3 text-gray-600">
                            {parameterProps[param]?.isCategorical
                              ? parameterProps[param]?.categories?.[Number(rawData[param]?.[index]?.value) || 0] ||
                                rawData[param]?.[index]?.value
                              : rawData[param]?.[index]?.value || 'N/A'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {diagnosticData && (
              <button className="flex items-center gap-2 px-6 py-4 mt-6 w-full justify-center bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all shadow-lg transform hover:scale-105 text-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V3"></path>
                </svg>
                Export Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
