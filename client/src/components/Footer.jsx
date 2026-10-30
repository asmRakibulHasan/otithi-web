import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="bg-paddy-dark text-[#CFE1D6]">
      <div className="wrap flex flex-wrap items-center justify-between gap-6 py-10">
        <div className="flex flex-col gap-2">
          <Logo light />
          <p className="text-sm">A student project · Northern University Bangladesh, Dept. of CSE</p>
        </div>
        <nav className="flex gap-6 text-sm" aria-label="Footer">
          <Link to="/#how-it-works" className="text-[#CFE1D6] hover:text-white">How it works</Link>
          <Link to="/#safety" className="text-[#CFE1D6] hover:text-white">Safety</Link>
          <Link to="/login" className="text-[#CFE1D6] hover:text-white">Log in</Link>
        </nav>
      </div>
    </footer>
  );
}
