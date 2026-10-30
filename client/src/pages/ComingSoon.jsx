import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';

// Placeholder for pages built in later phases.
export default function ComingSoon({ title, phase }) {
  return (
    <div className="wrap py-20">
      <Card stitch className="mx-auto flex max-w-xl flex-col items-start gap-4 p-10">
        <span className="eyebrow">Phase {phase}</span>
        <h1 className="text-4xl font-extrabold">{title}</h1>
        <p className="text-muted">This page is planned for a later phase of the build.</p>
        <Button variant="outline" to="/">Back to home</Button>
      </Card>
    </div>
  );
}
