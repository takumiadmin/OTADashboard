export function DeviceInfo() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[7fr,3fr] gap-6">
      <div className="space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter VIN Number"
            className="flex-1 p-2 border border-gray-300 rounded-lg"
          />
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Get Info
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 h-[400px]">
          <img
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000"
            alt="Map"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        
        <button className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Geofence Device to Current Location
        </button>
      </div>
      
      <div className="space-y-4">
        {['VIN', 'VCU', 'MCU', 'MCU Current Version', 'Update Status', 'Lifetime Hours'].map((label) => (
          <div key={label} className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <input
              type="text"
              disabled
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
}