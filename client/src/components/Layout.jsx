import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import VerificationBanner from './VerificationBanner.jsx';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <VerificationBanner />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
