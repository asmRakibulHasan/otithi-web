import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo.jsx';
import Button from './Button.jsx';

const links = [
  { to: '/browse', label: 'Explore villages' },
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/#safety', label: 'Safety' },
  { to: '/register?role=host', label: 'Become a host' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-line bg-ground">
      <div className="wrap flex items-center justify-between gap-6 py-4">
        <Logo />

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className="font-medium text-ink no-underline hover:text-paddy">
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden gap-2.5 md:flex">
          <Button variant="ghost" to="/login">Log in</Button>
          <Button to="/register">Sign up</Button>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-sand md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <nav className="wrap flex flex-col gap-1 pb-4 md:hidden" aria-label="Mobile">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 font-medium text-ink no-underline hover:bg-sand">
              {l.label}
            </NavLink>
          ))}
          <div className="mt-2 flex gap-2.5">
            <Button variant="outline" to="/login" className="flex-1">Log in</Button>
            <Button to="/register" className="flex-1">Sign up</Button>
          </div>
        </nav>
      )}
    </header>
  );
}
