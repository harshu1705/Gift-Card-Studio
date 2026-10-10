// PAGE 1 - pick a design, type the names, download the PNG.
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, RotateCcw } from 'lucide-react';
import TemplateGallery from '../components/TemplateGallery';
import CardCanvas from '../components/CardCanvas';
import { blockText, checkBlock, loadFonts } from '../config/cardText';
import { exportPng, makeFileName, downloadDataUrl } from '../services/exportPng';
import { api } from '../services/api';

const inputBlocks = (template) => template.blocks.filter((b) => b.kind === 'input');

// Starting text for every field. Names typed earlier are kept when you switch design.
function startValues(template, old = {}) {
  const values = {};
  for (const b of inputBlocks(template)) values[b.id] = old[b.id] ?? b.default ?? '';
  return values;
}

export default function StudioPage({ templates }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id);
  const template = templates.find((t) => t.id === templateId) || templates[0];
  const [values, setValues] = useState(() => (template ? startValues(template) : {}));
  const [triedDownload, setTriedDownload] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, setFontsLoaded] = useState(0);
  const stageRef = useRef(null);

  // Template switched or saved layout changed: refresh the fields and re-check text fit once fonts load.
  useEffect(() => {
    if (!template) return;
    setValues((old) => startValues(template, old));
    loadFonts(template.blocks).then(() => setFontsLoaded((n) => n + 1));
  }, [template?.id]);

  if (!template) {
    return (
      <div className="studio">
        <aside className="panel"><TemplateGallery templates={[]} /></aside>
      </div>
    );
  }

  // What is wrong with each field right now?
  function problemFor(block) {
    const typed = (values[block.id] || '').trim();
    if (block.required && !typed) return { text: `${block.label} is required.`, onlyAfterTry: true };
    const fit = checkBlock(block, blockText(block, typed), template);
    return fit ? { text: fit } : null;
  }
  const problems = Object.fromEntries(inputBlocks(template).map((b) => [b.id, problemFor(b)]));
  const hasProblem = Object.values(problems).some(Boolean);

  async function handleDownload() {
    setTriedDownload(true);
    if (hasProblem) {
      toast.error('Fix the highlighted fields first.');
      return;
    }

    setBusy(true);
    const loadingToast = toast.loading('Creating your PNG...');
    let activity = null;
    try {
      // 1. Write the history record first (status: started).
      try {
        activity = await api.createActivity({
          templateId: template.id,
          recipientName: values.recipient.trim(),
          senderName: values.sender.trim(),
          greetingText: values.greeting?.trim() || undefined,
          exportWidth: template.width,
          exportHeight: template.height,
          exportFormat: 'png',
        });
      } catch (err) {
        toast.error('History was not saved: ' + err.message);
      }

      // 2. Draw the card at full size and download it.
      await loadFonts(template.blocks);
      const dataUrl = exportPng(stageRef.current, template);
      downloadDataUrl(dataUrl, makeFileName(template, values.recipient));

      // 3. Tell the server the browser started the download.
      if (activity) await api.updateActivityStatus(activity.id, 'download_triggered').catch(() => {});
      toast.success('Download started. Check your downloads folder to confirm the file was saved.', { id: loadingToast });
    } catch (err) {
      if (activity) await api.updateActivityStatus(activity.id, 'failed', err.message.slice(0, 200)).catch(() => {});
      toast.error('Export failed: ' + err.message, { id: loadingToast });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="studio">
      <aside className="panel gallery">
        <h2>Designs</h2>
        <TemplateGallery templates={templates} selectedId={template.id} onSelect={setTemplateId} />
      </aside>

      <main className="preview">
        <CardCanvas ref={stageRef} template={template} values={values} />
      </main>

      <aside className="panel form">
        <h2>{template.name}</h2>
        {template.fixedContent.length > 0 && (
          <p className="note">Already printed on this card: {template.fixedContent.join(' / ')}</p>
        )}

        {inputBlocks(template).map((block) => {
          const problem = problems[block.id];
          const shown = problem && (!problem.onlyAfterTry || triedDownload);
          const Tag = block.multiline ? 'textarea' : 'input';
          return (
            <label key={block.id} className="field">
              <span>{block.label}{block.required ? ' *' : ''}</span>
              <Tag
                value={values[block.id] || ''}
                placeholder={block.placeholder}
                maxLength={block.maxLength}
                rows={block.multiline ? 4 : undefined}
                className={shown ? 'invalid' : ''}
                onChange={(e) => setValues({ ...values, [block.id]: e.target.value })}
              />
              <small>{(values[block.id] || '').length}/{block.maxLength}</small>
              {shown && <small className="warning">{problem.text}</small>}
            </label>
          );
        })}

        <div className="download-bar">
          <button type="button" className="btn" onClick={() => setValues(startValues(template))}>
            <RotateCcw size={16} /> Reset
          </button>
          <button type="button" className="btn primary" disabled={busy} onClick={handleDownload}>
            <Download size={16} /> {busy ? 'Working...' : 'Download PNG'}
          </button>
        </div>
      </aside>
    </div>
  );
}
