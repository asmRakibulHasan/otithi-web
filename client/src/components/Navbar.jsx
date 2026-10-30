import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo.jsx';
import Button from './Button.jsx';
import { useAuth, homeFor } from '../context/AuthContext.jsx';

const publicLinks = [
  { to: '/browse', label: 'Explore villages' },
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/#safety', label: 'Safety' },
];

const dashboardLabel = { traveller: 'My bookings', host: 'Host dashboard', admin: 'Admin panel' };

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user ? publicLinks : [...publicLinks, { to: '/register?role=host', label: 'Become a host' }];

  const onLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
  };

  const accountButtons = user ? (
    <>
      <Button variant="ghost" to={homeFor(user)} onClick={() => setOpen(false)}>{dashboardLabel[user.role]}</Button>
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-mustard-soft font-bold text-mustard-ink" title={user.name} aria-hidden="true">
        {initials(user.name)}
      </span>
      <Button variant="outline" onClick={onLogout}>Log out</Button>
    </>
  ) : (
    <>
      <Button variant="ghost" to="/login" onClick={() => setOpen(false)}>Log in</Button>
      <Button to="/register" onClick={() => setOpen(false)}>Sign up</Button>
    </>
  );

  return (
    <header className="border-b border-line bg-ground">
      <div className="wrap flex items-center justify-between gap-6 py-4">
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className="font-medium text-ink no-underline hover:text-paddy">
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">{accountButtons}</div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-sand lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <nav className="wrap flex flex-col gap-1 pb-4 lg:hidden" aria-label="Mobile">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 font-medium text-ink no-underline hover:bg-sand">
              {l.label}
            </NavLink>
          ))}
          <div className="mt-2 flex flex-wrap items-center gap-2.5">{accountButtons}</div>
        </nav>
      )}
    </header>
  );
}
