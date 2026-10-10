// PAGE 3 - Layout Setup. Drag text on the card or type numbers, then save.
// Unsaved changes live in `draft`. Saving sends the draft to the server.
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import CardCanvas from '../components/CardCanvas';
import LayoutControls from '../components/LayoutControls';
import builtinTemplates, { applyLayout, STYLE_FIELDS } from '../config/templates';
import { anchorPercentFromLeft, toPercent, round1, clamp } from '../config/coords';
import { blockText, checkBlock } from '../config/cardText';
import { api } from '../services/api';

export default function LayoutPage({ templates, onSaved }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState({}); // { blockId: { x: 12, ... } } - only what changed
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);

  const saved = templates.find((t) => t.id === templateId);
  useEffect(() => {
    setDraft({});
    setSelectedId(saved?.blocks[0]?.id || null);
  }, [templateId]);

  if (!saved) return <p className="page muted">No templates to set up.</p>;

  const template = applyLayout(saved, { blocks: draft }); // saved layout + unsaved changes
  const selected = template.blocks.find((b) => b.id === selectedId);

  // Preview text: what is typed by default, or a sample name.
  const values = {};
  for (const b of template.blocks) values[b.id] = b.default || b.sample || '';

  const change = (id, patch) => setDraft((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  // Konva gives the new LEFT/TOP in pixels. Convert back to percentages.
  function handleMove(id, leftPx, topPx) {
    const block = template.blocks.find((b) => b.id === id);
    change(id, {
      x: round1(clamp(anchorPercentFromLeft(block, leftPx, template.width), 0, 100)),
      y: round1(clamp(toPercent(topPx, template.height), 0, 100)),
    });
  }

  // Put one layer back to the values written in templates.js.
  function resetBlock(id) {
    const original = builtinTemplates.find((t) => t.id === templateId).blocks.find((b) => b.id === id);
    const defaults = {};
    for (const field of STYLE_FIELDS) defaults[field] = original[field];
    change(id, defaults);
  }

  async function save() {
    if (Object.keys(draft).length === 0) return toast('Nothing to save yet.');
    setSaving(true);
    try {
      await api.saveLayout(templateId, draft, token);
      await onSaved(); // reload templates so the preview uses the saved file
      setDraft({});
      toast.success('Layout saved.');
    } catch (err) {
      toast.error(err.message + ' Your changes are still here.'); // draft is kept
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="studio">
      <aside className="panel">
        <h2>Layers</h2>
        <label className="field">
          <span>Design</span>
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <div className="layer-list">
          {template.blocks.map((b) => (
            <button key={b.id} type="button" className={'layer' + (b.id === selectedId ? ' selected' : '')} onClick={() => setSelectedId(b.id)}>
              {b.label}
            </button>
          ))}
        </div>
        <p className="note">Drag a text layer on the card. Green dashed box = safe area.</p>
      </aside>

      <main className="preview">
        <CardCanvas template={template} values={values} layoutMode selectedId={selectedId} onSelect={setSelectedId} onMove={handleMove} />
      </main>

      <aside className="panel form">
        <h2>{selected ? selected.label : 'Select a layer'}</h2>
        {selected && (
          <LayoutControls
            block={selected}
            onChange={(patch) => change(selected.id, patch)}
            onReset={() => resetBlock(selected.id)}
            problem={checkBlock(selected, blockText(selected, values[selected.id]), template)}
          />
        )}

        <label className="field">
          <span>Layout password (if the server has one)</span>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} />
        </label>

        <div className="download-bar">
          <button type="button" className="btn" disabled={saving} onClick={() => setDraft({})}>Discard</button>
          <button type="button" className="btn primary" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save layout'}</button>
        </div>
      </aside>
    </div>
  );
}
