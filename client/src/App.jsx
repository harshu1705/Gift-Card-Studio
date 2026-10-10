// Top bar + the three pages. Loads the templates once and shares them.
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import builtinTemplates from './config/templates';
import { api } from './services/api';
import StudioPage from './pages/StudioPage';
import ActivityPage from './pages/ActivityPage';
import LayoutPage from './pages/LayoutPage';

const TABS = [
  ['studio', 'Studio'],
  ['activity', 'Activity history'],
  ['layout', 'Layout setup'],
];

export default function App() {
  const [tab, setTab] = useState('studio');
  const [templates, setTemplates] = useState(null);
  const [offline, setOffline] = useState(false);

  // Ask the server (default layouts + saved changes). If it is down, use the built-in defaults.
  async function loadTemplates() {
    try {
      setTemplates(await api.getTemplates());
      setOffline(false);
    } catch {
      setTemplates(builtinTemplates.map((t) => ({ ...t, layoutVersion: 0 })));
      setOffline(true);
    }
  }
  useEffect(() => { loadTemplates(); }, []);

  if (!templates) return <p className="page muted">Loading...</p>;

  return (
    <>
      <header className="topbar">
        <h1>Gift Card Studio</h1>
        <nav>
          {TABS.map(([id, label]) => (
            <button key={id} type="button" className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
      </header>

      {offline && (
        <p className="banner">
          The server is not reachable. Cards still work with the built-in layouts, but history and saved layouts are unavailable.
          <button type="button" className="btn" onClick={loadTemplates}>Retry</button>
        </p>
      )}

      {/* Studio stays mounted so typed names are not lost when you look at the history. */}
      <div hidden={tab !== 'studio'}><StudioPage templates={templates} /></div>
      {tab === 'activity' && <ActivityPage templates={templates} />}
      {tab === 'layout' && <LayoutPage templates={templates} onSaved={loadTemplates} />}

      <Toaster position="top-center" />
    </>
  );
}
