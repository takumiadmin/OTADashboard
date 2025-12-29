import React from 'react';
import { Page } from '../App';
import { Sidebar } from './Sidebar';
import {
  LayoutDashboard,
  Upload,
  CalendarClock,
  Activity,
  Settings,
  MapPin,
  RefreshCw
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onLogout: () => void;
  companyLogo?: string;
}

const getPageIcon = (page: Page) => {
  switch (page) {
    case 'Dashboard':
      return <LayoutDashboard className="w-6 h-6 text-indigo-500" />;
    case 'Upload Binary':
      return <Upload className="w-6 h-6 text-indigo-500" />;
    case 'Schedule Update':
      return <CalendarClock className="w-6 h-6 text-indigo-500" />;
    case 'Diagnostic Data':
      return <Activity className="w-6 h-6 text-indigo-500" />;
    case 'Device Settings':
      return <Settings className="w-6 h-6 text-indigo-500" />;
    case 'Geofence Settings':
      return <MapPin className="w-6 h-6 text-indigo-500" />;
    default:
      return null;
  }
};

export function Layout({ children, currentPage, onPageChange, onLogout, companyLogo = "frontend/src/pages/tmc.png" }: LayoutProps) {
  const [isSidebarHovered, setIsSidebarHovered] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      {/* Add global scrollbar styling */}
      <style>{`
        /* Hide horizontal scrollbar completely */
        body {
          overflow-x: hidden;
        }
        
        /* Hairline thin vertical scrollbar styling for webkit browsers */
        ::-webkit-scrollbar {
          width: 2px;
          height: 0; /* Hide horizontal scrollbar */
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(107, 114, 128, 0.2);
          border-radius: 1px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.4);
        }
        
        /* For Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(107, 114, 128, 0.2) transparent;
        }
      `}</style>
      
      <Sidebar
        currentPage={currentPage}
        onPageChange={onPageChange}
        onLogout={onLogout}
        onHoverChange={setIsSidebarHovered}
        logoPath={companyLogo}
      />
      
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          isSidebarHovered ? 'ml-64' : 'ml-16'
        }`}
      >
        {/* Decorative circle elements */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-pink-200 rounded-full opacity-30 blur-xl"></div>
        <div className="absolute bottom-16 -left-16 w-40 h-40 bg-blue-200 rounded-full opacity-30 blur-xl"></div>
        
        <header className="bg-white bg-opacity-80 backdrop-blur-sm shadow-lg rounded-b-3xl mx-3 sticky top-0 z-10">
          <div className="px-8 py-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getPageIcon(currentPage)}
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                {currentPage}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm px-4 py-2 bg-indigo-100 rounded-full text-indigo-600 font-medium">
                Welcome back
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 rounded-full transition-all duration-300"
                title="Refresh Data"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="bg-white bg-opacity-90 rounded-3xl shadow-xl p-8 border border-purple-100">
            {React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, { refreshKey });
              }
              return child;
            })}
          </div>
        </main>
        
        {/* Smooth-connecting footer */}
        <div className="relative flex justify-center pb-0">
          <div 
            className="absolute bottom-0 bg-white bg-opacity-80 backdrop-blur-sm shadow-lg px-6 py-3 flex items-center space-x-2 text-sm text-indigo-600"
            style={{
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              borderBottomLeftRadius: '0',
              borderBottomRightRadius: '0',
              boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            <div className="w-1 h-1 rounded-full bg-purple-400"></div>
            <span>© 2025 Takumi OTA Dashboard</span>
            <div className="w-1 h-1 rounded-full bg-purple-400"></div>
          </div>
        </div>
      </div>
    </div>
  );
}