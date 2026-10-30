import Card from './Card.jsx';

// Small shared loading / error / empty blocks
export function Loading({ text = 'Loading…' }) {
  return <p className="py-10 text-center text-muted" role="status">{text}</p>;
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger" role="alert">{message}</p>;
}

export function Empty({ title, children }) {
  return (
    <Card stitch className="flex flex-col items-center gap-2 p-10 text-center">
      <p className="font-display text-xl font-bold">{title}</p>
      {children && <div className="text-muted">{children}</div>}
    </Card>
  );
}
