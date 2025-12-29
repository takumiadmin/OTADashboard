import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UploadBinary } from './pages/UploadBinary';
import { ScheduleUpdate } from './pages/ScheduleUpdate';
import { DiagnosticData } from './pages/DiagnosticData';
import { DeviceSettings } from './pages/DeviceSettings';
import { ChangePassword } from './pages/ChangePassword';
import { CreateUser } from './pages/CreateUser';
import { DeleteUser } from './pages/DeleteUser';
import { ResetUser } from './pages/ResetUser';
import { GeofenceSettings } from './pages/GeofenceSettings';
import { ListOfTools } from './pages/ListOfTools';
import axios from 'axios';

export type Page = 
  | 'Dashboard'
  | 'Upload Binary'
  | 'Schedule Update'
  | 'Diagnostic Data'
  | 'Device Settings'
  | 'Change Password'
  | 'Create User'
  | 'Delete User'
  | 'Reset User'
  | 'Geofence Settings'
  | 'List Of Tools'; // Added List Of Tools

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [defaultPasswordChanged, setDefaultPasswordChanged] = useState(true);

  useEffect(() => {
    if (isLoggedIn && localStorage.getItem('token')) {
      const loggedInUsername = localStorage.getItem('username');
      axios.get(`${import.meta.env.VITE_API_URL}/auth/user`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }).then(response => {
        const dpChanged = response.data.defaultpasswordchanged === "true";
        if (loggedInUsername !== 'admin') {
          setDefaultPasswordChanged(dpChanged);
          setCurrentPage(dpChanged ? 'Dashboard' : 'Change Password');
        } else {
          setDefaultPasswordChanged(true);
          setCurrentPage('Dashboard');
        }
      }).catch(() => {
        if (loggedInUsername === 'admin') {
          setDefaultPasswordChanged(true);
          setCurrentPage('Dashboard');
        }
      });
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return <Login 
      onLogin={(initialDpChanged: boolean) => {
        const loggedInUsername = localStorage.getItem('username');
        const finalDpChanged = loggedInUsername === 'admin' ? true : initialDpChanged;
        setIsLoggedIn(true);
        setDefaultPasswordChanged(finalDpChanged);
        setCurrentPage(finalDpChanged ? 'Dashboard' : 'Change Password');
      }} 
      onChangePassword={() => {
        setCurrentPage(prev => (prev === 'Change Password' ? prev : 'Change Password'));
      }} 
    />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'Dashboard': return <Dashboard />;
      case 'Upload Binary': return <UploadBinary />;
      case 'Schedule Update': return <ScheduleUpdate />;
      case 'Diagnostic Data': return <DiagnosticData />;
      case 'Device Settings': return <DeviceSettings />;
      case 'Geofence Settings': return <GeofenceSettings />;
      case 'Change Password':
        return defaultPasswordChanged ? <ChangePassword onPasswordChanged={() => {}} /> : (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <ChangePassword onPasswordChanged={() => {
              setIsLoggedIn(false);
              localStorage.removeItem('token');
            }} />
          </div>
        );
      case 'Create User': return <CreateUser />;
      case 'Delete User': return <DeleteUser />;
      case 'Reset User': return <ResetUser />;
      case 'List Of Tools': return <ListOfTools />;
      default: return <Dashboard />;
    }
  };

  return defaultPasswordChanged ? (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage} onLogout={() => {
      setIsLoggedIn(false);
    }}>
      {renderPage()}
    </Layout>
  ) : (
    renderPage()
  );
}

export default App;
