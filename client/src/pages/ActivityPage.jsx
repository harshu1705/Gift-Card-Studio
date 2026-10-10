// PAGE 2 - history of generated cards, with search, filters and pages.
import { useEffect, useState } from 'react';
import ActivityTable from '../components/ActivityTable';
import { api } from '../services/api';

export default function ActivityPage({ templates }) {
  const [filters, setFilters] = useState({ search: '', templateId: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pageSize: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setData(await api.listActivities({ ...filters, page }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Wait a moment after typing so we don't call the server on every key.
  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [filters, page]);

  function setFilter(name, value) {
    setFilters({ ...filters, [name]: value });
    setPage(1);
  }

  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="page">
      <h2>Activity history</h2>

      <div className="filters">
        <input placeholder="Search recipient or sender" value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
        <select value={filters.templateId} onChange={(e) => setFilter('templateId', e.target.value)}>
          <option value="">All templates</option>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <label>From <input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} /></label>
        <label>To <input type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} /></label>
      </div>

      <ActivityTable items={data.items} loading={loading} error={error} onRetry={load} />

      <div className="pager">
        <button type="button" className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page} of {lastPage} ({data.total} records)</span>
        <button type="button" className="btn" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>Next</button>
      </div>

      <p className="muted">"Download started" means the browser began the download. The app cannot check that the file was saved on your device. Times are shown in your local time zone; date filters use UTC days.</p>
    </div>
  );
}
