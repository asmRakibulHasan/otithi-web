// White card with a soft shadow. `stitch` adds the dashed kantha outline.
export default function Card({ as: Tag = 'div', stitch = false, className = '', ...props }) {
  return (
    <Tag
      className={`rounded-card border border-line bg-white shadow-card ${stitch ? 'stitch bg-[#FFFDF7]' : ''} ${className}`}
      {...props}
    />
  );
}
