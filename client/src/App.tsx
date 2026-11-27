import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Parks from './pages/Parks';
import ParkDetail from './pages/ParkDetail';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import ZonesRates from './pages/ZonesRates';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Rentals from './pages/Rentals';
import RentalDetail from './pages/RentalDetail';
import Expenses from './pages/Expenses';
import Maintenance from './pages/Maintenance';
import CalendarPage from './pages/Calendar';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Users from './pages/Users';
import SettingsPage from './pages/Settings';
import MyAccount from './pages/MyAccount';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/parcs" element={<Parks />} />
        <Route path="/parcs/:id" element={<ParkDetail />} />
        <Route path="/vehicules" element={<Vehicles />} />
        <Route path="/vehicules/:id" element={<VehicleDetail />} />
        <Route path="/locations" element={<Rentals />} />
        <Route path="/locations/:id" element={<RentalDetail />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/calendrier" element={<CalendarPage />} />
        <Route path="/entretiens" element={<Maintenance />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/mon-compte" element={<MyAccount />} />

        <Route
          path="/depenses"
          element={
            <ProtectedRoute roles={['superadmin', 'admin']}>
              <Expenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/zones-tarifs"
          element={
            <ProtectedRoute roles={['superadmin', 'admin']}>
              <ZonesRates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rapports"
          element={
            <ProtectedRoute roles={['superadmin', 'admin']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/utilisateurs"
          element={
            <ProtectedRoute roles={['superadmin', 'admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parametres"
          element={
            <ProtectedRoute roles={['superadmin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
