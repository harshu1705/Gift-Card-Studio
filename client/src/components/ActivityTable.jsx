// Just the table. Loading, error and empty states are decided here; the data comes from the page.
const STATUS = {
  export_started: 'Started',
  download_triggered: 'Download started',
  failed: 'Failed',
};

export default function ActivityTable({ items, loading, error, onRetry }) {
  if (error) {
    return (
      <div className="error-box">
        <p>{error}</p>
        <button type="button" className="btn" onClick={onRetry}>Try again</button>
      </div>
    );
  }
  if (loading) return <p className="muted">Loading activity...</p>;
  if (items.length === 0) return <p className="muted">No cards match. Download a card in the Studio and it will show up here.</p>;

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Template</th><th>Recipient</th><th>Sender</th><th>Date and time</th><th>Format</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id}>
              <td>{a.id}</td>
              <td>{a.templateName}</td>
              <td>{a.recipientName}</td>
              <td>{a.senderName}</td>
              <td>{new Date(a.createdAt).toLocaleString()}</td>
              <td>{a.exportFormat.toUpperCase()} {a.exportWidth}x{a.exportHeight}</td>
              <td><span className={'status ' + a.status}>{STATUS[a.status] || a.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
