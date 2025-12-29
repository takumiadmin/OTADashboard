import React, { useState, useEffect } from 'react';

interface Tool {
  serialNumber: number;
  equipmentType: string;
  activationStatus: string;
  chc: string;
  customer: string;
  manufactureDate: string;
  distributor: string;
  geoLocation: string;
  size: string;
  status: string;
  underSubsidy: string;
}

interface ListOfToolsProps {
  refreshKey?: number;
}

export function ListOfTools({ refreshKey }: ListOfToolsProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [formData, setFormData] = useState<Partial<Tool>>({
    serialNumber: 0,
    equipmentType: 'Tiller',
    activationStatus: 'Inactive',
    chc: '',
    customer: '',
    manufactureDate: '',
    distributor: '',
    geoLocation: '',
    size: '',
    status: 'Plant',
    underSubsidy: 'No',
  });

  const fetchTools = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('No authentication token found. Please log in.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/listoftools/tools`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch tools');
      const data = await response.json();
      setTools(data.tools || []);
      setSuccessMessage('Tools fetched successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error fetching tools:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setErrorMessage(`Failed to fetch tools: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Reset states on refresh
    setTools([]);
    setIsLoading(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedTool(null);
    setFormData({
      serialNumber: 0,
      equipmentType: 'Tiller',
      activationStatus: 'Inactive',
      chc: '',
      customer: '',
      manufactureDate: '',
      distributor: '',
      geoLocation: '',
      size: '',
      status: 'Plant',
      underSubsidy: 'No',
    });

    fetchTools();
  }, [refreshKey]);

  const handleAddTool = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('No authentication token found. Please log in.');
      return;
    }

    // Validate Serial Number
    if (!/^\d{6}$/.test(formData.serialNumber?.toString() || '')) {
      setErrorMessage('Serial Number must be a 6-digit number');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/listoftools/tools`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add tool');

      setSuccessMessage(data.message);
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsAddModalOpen(false);
      setFormData({
        serialNumber: 0,
        equipmentType: 'Tiller',
        activationStatus: 'Inactive',
        chc: '',
        customer: '',
        manufactureDate: '',
        distributor: '',
        geoLocation: '',
        size: '',
        status: 'Plant',
        underSubsidy: 'No',
      });
      fetchTools(); // Refresh table
    } catch (error) {
      console.error('Error adding tool:', error);
      const errorMsg = (error instanceof Error) ? error.message : String(error);
      setErrorMessage(`Failed to add tool: ${errorMsg}`);
    }
  };

  const handleEditTool = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('No authentication token found. Please log in.');
      return;
    }

    // Validate Serial Number
    if (!/^\d{6}$/.test(formData.serialNumber?.toString() || '')) {
      setErrorMessage('Serial Number must be a 6-digit number');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/listoftools/tools`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update tool');

      setSuccessMessage(data.message);
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsEditModalOpen(false);
      setSelectedTool(null);
      setFormData({
        serialNumber: 0,
        equipmentType: 'Tiller',
        activationStatus: 'Inactive',
        chc: '',
        customer: '',
        manufactureDate: '',
        distributor: '',
        geoLocation: '',
        size: '',
        status: 'Plant',
        underSubsidy: 'No',
      });
      fetchTools(); // Refresh table
    } catch (error) {
      console.error('Error updating tool:', error);
      const errorMsg = (error instanceof Error) ? error.message : String(error);
      setErrorMessage(`Failed to update tool: ${errorMsg}`);
    }
  };

  const handleDeleteTool = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('No authentication token found. Please log in.');
      return;
    }

    if (!selectedTool) {
      setErrorMessage('No tool selected for deletion');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/listoftools/tools`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serialNumber: selectedTool.serialNumber,
          equipmentType: selectedTool.equipmentType,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete tool');

      setSuccessMessage(data.message);
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsDeleteModalOpen(false);
      setSelectedTool(null);
      fetchTools(); // Refresh table
    } catch (error) {
      console.error('Error deleting tool:', error);
      const errorMsg = (error instanceof Error) ? error.message : String(error);
      setErrorMessage(`Failed to delete tool: ${errorMsg}`);
    }
  };

  const openEditModal = (tool: Tool) => {
    setSelectedTool(tool);
    setFormData(tool);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (tool: Tool) => {
    setSelectedTool(tool);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'serialNumber' ? Number(value) : value,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 bg-white min-h-screen">
      <div className="bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold text-indigo-700 flex items-center mb-6">
          <svg className="w-10 h-10 mr-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          List of Tools
        </h1>
        <div className="h-1 w-28 bg-gradient-to-r from-blue-500 to-indigo-600 mb-6"></div>

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
              <div className="p-5 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center animate-success-slide mb-6">
                <svg className="w-6 h-6 mr-3 text-green-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {successMessage}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white shadow-md rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">Serial Number</th>
                    <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">Equipment Type</th>
                    <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">Size</th>
                    <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">Date of Manufacture</th>
                    <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">Status</th>
                    <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">Distributor</th>
                    <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">Customer</th>
                    <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">CHC</th>
                    <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">Under Subsidy</th>
                    <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">Activation Status</th>
                    <th className="border border-gray-200 p-3 text-left text-gray-700 font-medium">Registered Geo Location</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map((tool) => (
                    <tr
                      key={`${tool.serialNumber}-${tool.equipmentType}`}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedTool?.serialNumber === tool.serialNumber &&
                        selectedTool?.equipmentType === tool.equipmentType
                          ? 'bg-blue-50'
                          : ''
                      }`}
                      onClick={() => setSelectedTool(tool)}
                    >
                      <td className="border border-gray-200 p-3 text-gray-600">{tool.serialNumber}</td>
                      <td className="border border-gray-200 p-3 text-gray-600">{tool.equipmentType}</td>
                      <td className="border border-gray-200 p-3 text-gray-600">{tool.size}</td>
                      <td className="border border-gray-200 p-3 text-gray-600">{tool.manufactureDate}</td>
                      <td className="border border-gray-200 p-3 text-gray-600">
                        <span
                          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                            tool.status === 'Customer' ? 'bg-green-100 text-green-800' :
                            tool.status === 'Distributor' ? 'bg-blue-100 text-blue-800' :
                            tool.status === 'Plant' ? 'bg-purple-100 text-purple-800' :
                            tool.status === 'CHC' ? 'bg-yellow-100 text-yellow-800' :
                            tool.status === 'Decommissioned' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          } cursor-pointer`}
                          title={`Status: ${tool.status}`}
                        >
                          {tool.status}
                        </span>
                      </td>
                      <td className="border border-gray-200 p-3 text-gray-600">{tool.distributor}</td>
                      <td className="border border-gray-200 p-3 text-gray-600">{tool.customer}</td>
                      <td className="border border-gray-200 p-3 text-gray-600">{tool.chc}</td>
                      <td className="border border-gray-200 p-3 text-gray-600">{tool.underSubsidy}</td>
                      <td className="border border-gray-200 p-3 text-gray-600">
                        <span
                          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                            tool.activationStatus === 'Active' ? 'bg-green-100 text-green-800' :
                            tool.activationStatus === 'Deactivated' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          } cursor-pointer`}
                          title={`Activation: ${tool.activationStatus}`}
                        >
                          {tool.activationStatus}
                        </span>
                      </td>
                      <td className="border border-gray-200 p-3 text-gray-600">{tool.geoLocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4 mt-6 justify-end">
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => setIsAddModalOpen(true)}
              >
                Add Equipment
              </button>
              <button
                className={`px-6 py-2 text-white rounded-lg transition-colors ${
                  selectedTool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
                onClick={() => selectedTool && openEditModal(selectedTool)}
                disabled={!selectedTool}
              >
                Edit Equipment
              </button>
              <button
                className={`px-6 py-2 text-white rounded-lg transition-colors ${
                  selectedTool ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
                onClick={() => selectedTool && openDeleteModal(selectedTool)}
                disabled={!selectedTool}
              >
                Delete Equipment
              </button>
            </div>

            {/* Add/Edit Modal */}
            {(isAddModalOpen || isEditModalOpen) && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                  <h2 className="text-2xl font-bold text-indigo-700 mb-4">
                    {isAddModalOpen ? 'Add Equipment' : 'Edit Equipment'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Serial Number</label>
                      <input
                        type="number"
                        name="serialNumber"
                        value={formData.serialNumber || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                        placeholder="Enter 6-digit number"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Equipment Type</label>
                      <select
                        name="equipmentType"
                        value={formData.equipmentType || 'Tiller'}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                        required
                      >
                        <option value="Tiller">Tiller</option>
                        <option value="Eweeder">Eweeder</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <select
                        name="status"
                        value={formData.status || 'Plant'}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                        required
                      >
                        <option value="Plant">Plant</option>
                        <option value="Distributor">Distributor</option>
                        <option value="Customer">Customer</option>
                        <option value="CHC">CHC</option>
                        <option value="Decommissioned">Decommissioned</option>
                        <option value="Defective">Defective</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Activation Status</label>
                      <select
                        name="activationStatus"
                        value={formData.activationStatus || 'Inactive'}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                        required
                      >
                        <option value="Inactive">Inactive</option>
                        <option value="Active">Active</option>
                        <option value="Deactivated">Deactivated</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Under Subsidy</label>
                      <select
                        name="underSubsidy"
                        value={formData.underSubsidy || 'No'}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                        required
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Size</label>
                      <input
                        type="text"
                        name="size"
                        value={formData.size || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                        placeholder="Enter size"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Date of Manufacture</label>
                      <input
                        type="text"
                        name="manufactureDate"
                        value={formData.manufactureDate || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                        placeholder="e.g., Jan-22"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Distributor</label>
                      <input
                        type="text"
                        name="distributor"
                        value={formData.distributor || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                        placeholder="Enter distributor"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Customer</label>
                      <input
                        type="text"
                        name="customer"
                        value={formData.customer || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                        placeholder="Enter customer"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">CHC</label>
                      <input
                        type="text"
                        name="chc"
                        value={formData.chc || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                        placeholder="Enter CHC"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Registered Geo Location</label>
                      <input
                        type="text"
                        name="geoLocation"
                        value={formData.geoLocation || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                        placeholder="e.g., 40.7128° N, 74.0060° W"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setIsEditModalOpen(false);
                        setSelectedTool(null);
                        setFormData({
                          serialNumber: 0,
                          equipmentType: 'Tiller',
                          activationStatus: 'Inactive',
                          chc: '',
                          customer: '',
                          manufactureDate: '',
                          distributor: '',
                          geoLocation: '',
                          size: '',
                          status: 'Plant',
                          underSubsidy: 'No',
                        });
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={isAddModalOpen ? handleAddTool : handleEditTool}
                    >
                      {isAddModalOpen ? 'Add' : 'Update'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h2 className="text-2xl font-bold text-indigo-700 mb-4">Confirm Deletion</h2>
                  <p className="text-gray-700 mb-6">
                    Are you sure you want to delete the tool with Serial Number {selectedTool?.serialNumber} and Equipment Type {selectedTool?.equipmentType}?
                  </p>
                  <div className="flex justify-end gap-4">
                    <button
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      onClick={() => {
                        setIsDeleteModalOpen(false);
                        setSelectedTool(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      onClick={handleDeleteTool}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
