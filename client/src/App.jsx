import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import ComingSoon from './pages/ComingSoon.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<ComingSoon title="Log in" phase={2} />} />
        <Route path="/register" element={<ComingSoon title="Sign up" phase={2} />} />
        <Route path="/browse" element={<ComingSoon title="Browse stays" phase={3} />} />
        <Route path="/village/:id" element={<ComingSoon title="Village" phase={3} />} />
        <Route path="/listing/:id" element={<ComingSoon title="Room listing" phase={3} />} />
        <Route path="/booking/:id" element={<ComingSoon title="Booking" phase={4} />} />
        <Route path="/traveller" element={<ComingSoon title="My bookings" phase={4} />} />
        <Route path="/host" element={<ComingSoon title="Host dashboard" phase={4} />} />
        <Route path="/host/add-room" element={<ComingSoon title="Add a room" phase={3} />} />
        <Route path="/admin" element={<ComingSoon title="Admin panel" phase={3} />} />
        <Route path="*" element={<ComingSoon title="Page not found" phase="—" />} />
      </Route>
    </Routes>
  );
}
