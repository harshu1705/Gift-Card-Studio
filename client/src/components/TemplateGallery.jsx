// List of card designs. Click one to select it.
const MODE_TEXT = {
  blank: 'Blank card - add greeting and names',
  partial: 'Greeting printed - add names',
};

export default function TemplateGallery({ templates, selectedId, onSelect }) {
  if (templates.length === 0) {
    return (
      <div className="empty">
        <p><strong>No card designs yet.</strong></p>
        <p>1. Copy the design images into <code>client/public/cards/</code>.</p>
        <p>2. Add an entry for each one in <code>client/src/config/templates.js</code>.</p>
        <p>3. Reload this page.</p>
      </div>
    );
  }

  return (
    <div className="gallery-list">
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          className={'gallery-item' + (t.id === selectedId ? ' selected' : '')}
          onClick={() => onSelect(t.id)}
        >
          <img src={t.image} alt="" loading="lazy" />
          <span className="gallery-name">{t.name}</span>
          <span className="gallery-mode">{MODE_TEXT[t.mode] || t.mode}</span>
        </button>
      ))}
    </div>
  );
}
