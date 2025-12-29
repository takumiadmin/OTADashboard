import React, { useState } from 'react';
import { Page } from '../App';
import {
  LayoutDashboard,
  Upload,  
  Activity,
  SettingsIcon,
  LogOut,
  Key,
  UserPlus,
  Trash2,
  RefreshCw,
  MapPin,
  CalendarClock,
  Wrench,
} from 'lucide-react';
import Logo from '../pages/tmc.png'; // Assuming this path is correct

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onLogout: () => void;
  onHoverChange: (isHovered: boolean) => void;
  logoPath: string;
}

const menuItems: { page: Page; icon: React.ReactNode }[] = [
  { page: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { page: 'List Of Tools', icon: <Wrench className="w-5 h-5" /> },
  { page: 'Upload Binary', icon: <Upload className="w-5 h-5" /> },
  { page: 'Schedule Update', icon: <CalendarClock className="w-5 h-5" /> },
  { page: 'Diagnostic Data', icon: <Activity className="w-5 h-5" /> },
  { page: 'Device Settings', icon: <SettingsIcon className="w-5 h-5" /> },
  { page: 'Geofence Settings', icon: <MapPin className="w-5 h-5" /> },
];

export function Sidebar({ currentPage, onPageChange, onLogout, onHoverChange }: SidebarProps) {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    onLogout();
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isAdmin = localStorage.getItem('username') === 'admin';
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`fixed top-0 left-0 h-screen bg-white/80 backdrop-blur-xl shadow-2xl border-r border-gray-200 rounded-tr-3xl rounded-br-3xl overflow-hidden transition-all duration-300 ease-in-out ${
        isHovered ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={() => {
        setIsHovered(true);
        onHoverChange(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHoverChange(false);
      }}
    >
      <div className="flex flex-col h-full">
        <div className={`p-4 border-b border-gray-200 flex justify-center items-center ${isHovered ? 'p-6' : 'p-3'}`}>
          {isHovered ? (
            <div className="flex flex-col items-center gap-2">
              <img src={Logo} alt="Takumi Motion Controls Logo" className="w-12 h-12 object-contain" />
              <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent text-center tracking-wide">
                Takumi Motion Controls
              </h1>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-200">
              <img src={Logo} alt="Takumi Motion Controls Logo" className="w-8 h-8 object-contain" />
            </div>
          )}
        </div>

        <nav className={`flex-1 pt-6 space-y-2 overflow-y-auto ${isHovered ? 'px-4' : 'px-2'}`}>
          {menuItems.map(({ page, icon }) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-full flex ${isHovered ? 'items-center' : 'justify-center'} gap-3 px-2 py-3 text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm ${
                currentPage === page
                  ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 shadow-md'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={!isHovered ? page : undefined}
            >
              {icon}
              {isHovered && <span className="truncate">{page}</span>}
            </button>
          ))}
        </nav>

        <div className={`border-t border-gray-200 ${isHovered ? 'p-4' : 'p-2'}`}>
          {isHovered ? (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 shadow"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSettingsOpen(!isSettingsOpen);
                }}
                className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-200 bg-gray-100 rounded-lg transition-all duration-200"
              >
                <SettingsIcon className="w-6 h-6" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSettingsOpen(!isSettingsOpen);
                }}
                className="flex items-center justify-center w-10 h-10 mx-auto text-gray-600 hover:text-gray-900 hover:bg-gray-200 bg-gray-100 rounded-lg transition-all duration-200"
                title="Settings"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-10 h-10 mx-auto text-red-600 hover:text-red-700 hover:bg-red-100 bg-red-50 rounded-lg transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}

          {isSettingsOpen && (
            <div className={`absolute ${isHovered ? 'bottom-16 left-4 w-56' : 'left-16 bottom-20 w-48'} bg-white shadow-xl rounded-lg border border-gray-300 z-10 overflow-hidden`}>
              <button
                onClick={() => {
                  onPageChange('Change Password');
                  setIsSettingsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
              >
                <Key className="w-5 h-5" /> Change Password
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      onPageChange('Create User');
                      setIsSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    <UserPlus className="w-5 h-5" /> Create New User
                  </button>
                  <button
                    onClick={() => {
                      onPageChange('Delete User');
                      setIsSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    <Trash2 className="w-5 h-5" /> Delete User
                  </button>
                  <button
                    onClick={() => {
                      onPageChange('Reset User');
                      setIsSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    <RefreshCw className="w-5 h-5" /> Reset User
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}