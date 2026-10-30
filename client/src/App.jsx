import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Auth from './pages/Auth.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import Browse from './pages/Browse.jsx';
import Village from './pages/Village.jsx';
import Listing from './pages/Listing.jsx';
import HostDashboard from './pages/host/Dashboard.jsx';
import AddRoom from './pages/host/AddRoom.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import Booking from './pages/Booking.jsx';
import BookingDetail from './pages/BookingDetail.jsx';
import TravellerDashboard from './pages/traveller/Dashboard.jsx';

export default function App() {
  return (
    <Routes>
      {/* Full-screen auth page, no navbar (06 · Login, signup & verification) */}
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/register" element={<Auth mode="register" />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/village/:id" element={<Village />} />
        <Route path="/listing/:id" element={<Listing />} />

        <Route element={<ProtectedRoute roles={['traveller']} />}>
          <Route path="/booking/:id" element={<Booking />} />
          <Route path="/bookings/:id" element={<BookingDetail />} />
          <Route path="/traveller" element={<TravellerDashboard />} />
        </Route>

        <Route element={<ProtectedRoute roles={['host']} />}>
          <Route path="/host" element={<HostDashboard />} />
          <Route path="/host/add-room" element={<AddRoom />} />
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<ComingSoon title="Page not found" phase="—" />} />
      </Route>
    </Routes>
  );
}
