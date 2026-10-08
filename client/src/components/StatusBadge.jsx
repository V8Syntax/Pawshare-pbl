const TONE = { approved: '', completed: '', available: '', submitted: 'warn', under_review: 'warn', pending: 'warn', rejected: 'bad', withdrawn: 'grey', adopted: 'grey', fostered: 'grey', unavailable: 'grey' };
export default function StatusBadge({ status }) {
  return <span className={`badge ${TONE[status] || ''}`}>{status.replace('_', ' ')}</span>;
}
