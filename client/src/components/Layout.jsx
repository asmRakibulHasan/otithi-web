import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import VerificationBanner from './VerificationBanner.jsx';

// New page → start at the top; "/#how-it-works" → scroll to that section
function useScrollOnNavigate() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // wait a tick so the section is rendered
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 50);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
}

export default function Layout() {
  useScrollOnNavigate();
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
