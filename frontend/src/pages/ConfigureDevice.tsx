export function ConfigureDevice() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <select className="p-2 border border-gray-300 rounded-lg">
          <option>Device Type 1</option>
        </select>
        
        <select className="p-2 border border-gray-300 rounded-lg">
          <option>60s</option>
          <option>120s</option>
        </select>
      </div>
      
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Enter VIN Number"
          className="flex-1 p-2 border border-gray-300 rounded-lg"
        />
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Search
        </button>
      </div>
      
      <div className="space-y-4">
        {[
          { label: 'Device Info Frequency', value: 60 },
          { label: 'Device CAN data Frequency', value: 60 },
          { label: 'GPS Frequency', value: 600 },
        ].map(({ label, value }) => (
          <div key={label} className="grid grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 col-span-1">
              {label}
            </label>
            <input
              type="number"
              defaultValue={value}
              className="col-span-3 p-2 border border-gray-300 rounded-lg"
            />
          </div>
        ))}
      </div>
      
      <div className="flex justify-between">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          LINK
        </button>
        <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          LogOut
        </button>
      </div>
    </div>
  );
}