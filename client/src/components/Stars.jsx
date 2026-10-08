export default function Stars({ value = 0, count }) {
  const full = Math.round(value);
  return (
    <span className="small">
      <span className="stars" aria-label={`${value} out of 5`}>{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
      {count !== undefined && <span className="muted"> {value ? value.toFixed(1) : '–'} ({count})</span>}
    </span>
  );
}
