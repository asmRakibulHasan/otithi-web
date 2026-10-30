import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Upload, ImageIcon } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import Button from '../components/Button.jsx';
import { useAuth, homeFor } from '../context/AuthContext.jsx';

const promises = [
  'Your ID is only seen by the admin',
  'Hosts see your reviews, never your documents',
  'No card or bank details needed — ever',
];

// One page for both /login and /register (06 · Login, signup & verification)
export default function Auth({ mode }) {
  const isRegister = mode === 'register';
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const [form, setForm] = useState({
    role: params.get('role') === 'host' ? 'host' : 'traveller',
    name: '',
    phone: '',
    email: '',
    password: '',
  });
  const [idFile, setIdFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isRegister && !idFile) return setError('Please upload a photo of your ID');

    setBusy(true);
    try {
      let user;
      if (isRegister) {
        const data = new FormData();
        Object.entries(form).forEach(([k, v]) => data.append(k, v));
        data.append('idDocument', idFile);
        user = await register(data);
      } else {
        user = await login(form.email, form.password);
      }
      navigate(location.state?.from || homeFor(user), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Is the server running?');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-wrap">
      <aside className="relative flex min-w-0 flex-[1_1_480px] flex-col justify-between gap-10 overflow-hidden bg-paddy px-8 py-10 text-white md:px-14 md:py-12">
        <div className="relative"><Logo light /></div>
        <div className="relative flex max-w-[460px] flex-col gap-5 pb-24">
          <h1 className="text-4xl font-extrabold md:text-[52px]">
            A guest is a blessing. <span className="text-mustard">A verified guest is peace of mind.</span>
          </h1>
          <p className="text-lg text-[#CFE1D6]">
            Everyone on Otithi is verified — hosts and travellers. Upload one ID once, and the admin approves you within a day.
          </p>
          <ul className="flex flex-col gap-2.5 text-[15px]">
            {promises.map((p) => (
              <li key={p} className="flex items-center gap-2.5">
                <Check size={20} className="text-mustard" aria-hidden="true" />{p}
              </li>
            ))}
          </ul>
        </div>
        <svg viewBox="0 0 600 220" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[220px] w-full" aria-hidden="true">
          <path d="M0 120 Q150 60 300 110 T600 90 V220 H0Z" fill="#2F6B52" />
          <path d="M0 170 Q200 130 400 160 T600 150 V220 H0Z" fill="#163F31" />
          <path d="M0 200 H600" stroke="#E3A72F" strokeWidth="3" strokeDasharray="10 8" />
        </svg>
        <p className="relative text-[13px] text-[#CFE1D6]">Student project · Northern University Bangladesh</p>
      </aside>

      <main className="flex min-w-0 flex-[1_1_560px] flex-col gap-6 px-6 py-10 md:px-14 md:py-12">
        <nav className="flex self-start rounded-2xl bg-[#EEE8DC] p-1" aria-label="Account">
          <Link to="/login" aria-current={!isRegister ? 'page' : undefined}
            className={`rounded-xl px-5 py-2.5 font-semibold no-underline ${!isRegister ? 'bg-white text-ink shadow-sm' : 'text-ink hover:bg-sand hover:text-ink'}`}>
            Log in
          </Link>
          <Link to={`/register${form.role === 'host' ? '?role=host' : ''}`} aria-current={isRegister ? 'page' : undefined}
            className={`rounded-xl px-5 py-2.5 font-semibold no-underline ${isRegister ? 'bg-white text-ink shadow-sm' : 'text-ink hover:bg-sand hover:text-ink'}`}>
            Sign up
          </Link>
        </nav>

        <div>
          <h2 className="text-4xl font-extrabold">{isRegister ? 'Create your account' : 'Welcome back'}</h2>
          <p className="mt-1.5 text-muted">
            {isRegister ? 'Upload your ID once — the admin verifies it within a day' : 'Log in to see your bookings'}
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex max-w-[560px] flex-col gap-4" noValidate>
          {isRegister && (
            <>
              <fieldset>
                <legend className="label mb-2.5">I want to…</legend>
                <div className="flex flex-wrap gap-3">
                  {[
                    { v: 'traveller', t: 'Travel & book stays', d: 'Traveller account' },
                    { v: 'host', t: 'Host guests at home', d: 'Host account' },
                  ].map((r) => (
                    <label key={r.v}
                      className={`flex flex-[1_1_200px] cursor-pointer items-start gap-3 rounded-2xl border-[1.5px] p-4 ${form.role === r.v ? 'border-paddy bg-[#F3F8F5]' : 'border-field bg-white'}`}>
                      <input type="radio" name="role" value={r.v} checked={form.role === r.v} onChange={set('role')}
                        className="mt-0.5 h-5 w-5 accent-paddy" />
                      <span>
                        <span className="block font-bold">{r.t}</span>
                        <span className="text-sm text-muted">{r.d}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="a-name">Full name</label>
                  <input id="a-name" className="input" value={form.name} onChange={set('name')} autoComplete="name" required />
                </div>
                <div>
                  <label className="label" htmlFor="a-phone">Mobile number</label>
                  <input id="a-phone" className="input" type="tel" placeholder="01XXX-XXXXXX" value={form.phone} onChange={set('phone')} autoComplete="tel" required />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="label" htmlFor="a-email">Email</label>
            <input id="a-email" className="input" type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
          </div>
          <div>
            <label className="label" htmlFor="a-pw">Password</label>
            <input id="a-pw" className="input" type="password" value={form.password} onChange={set('password')}
              autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={6} required />
            {isRegister && <p className="mt-1 text-[13px] text-muted">At least 6 characters</p>}
          </div>

          {isRegister && (
            <div>
              <span className="label">Identity document (NID, passport or birth certificate)</span>
              <label htmlFor="a-id"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#C9BFA9] bg-[#FFFDF7] p-6 text-center hover:border-paddy">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-mustard-soft text-mustard-ink">
                  {idFile ? <ImageIcon size={22} aria-hidden="true" /> : <Upload size={22} aria-hidden="true" />}
                </span>
                <span className="font-bold">{idFile ? idFile.name : 'Upload a clear photo of your ID'}</span>
                <span className="text-sm text-muted">{idFile ? 'Click to choose a different file' : 'JPG, PNG or WEBP, up to 5 MB'}</span>
                <input id="a-id" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                  onChange={(e) => setIdFile(e.target.files[0] || null)} />
              </label>
            </div>
          )}

          {error && <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger" role="alert">{error}</p>}

          <Button type="submit" size="lg" disabled={busy}>
            {busy ? 'Please wait…' : isRegister ? 'Create account & submit for verification' : 'Log in'}
          </Button>

          <p className="text-sm text-muted">
            {isRegister ? <>Already have an account? <Link to="/login">Log in</Link></>
              : <>New to Otithi? <Link to="/register">Create an account</Link></>}
          </p>
        </form>
      </main>
    </div>
  );
}
