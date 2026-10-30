import { Link } from 'react-router-dom';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-[1.5px] px-5 text-[15px] font-semibold no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const variants = {
  primary: 'border-transparent bg-paddy text-white hover:bg-paddy-dark hover:text-white',
  accent: 'border-transparent bg-mustard text-ink hover:bg-mustard-dark hover:text-ink',
  outline: 'border-paddy bg-white text-paddy hover:bg-paddy-soft hover:text-paddy-dark',
  ghost: 'border-transparent bg-transparent text-ink hover:bg-sand hover:text-ink',
  danger: 'border-danger-line bg-white text-danger hover:bg-danger-soft hover:text-danger',
};

const sizes = {
  md: '',
  lg: 'min-h-[52px] px-7 text-base',
};

// Renders a <Link> when `to` is given, otherwise a <button>.
export default function Button({ variant = 'primary', size = 'md', to, className = '', type = 'button', ...props }) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  if (to) return <Link to={to} className={cls} {...props} />;
  return <button type={type} className={cls} {...props} />;
}
