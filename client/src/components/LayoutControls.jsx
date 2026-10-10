// Number boxes, sliders and dropdowns for ONE text block. It only reports changes;
// the page owns the state.
import { FONTS } from '../config/templates';

function NumberField({ label, value, onChange, min, max, step = 0.1, slider = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={(e) => e.target.value !== '' && onChange(+e.target.value)} />
      {slider && <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(+e.target.value)} />}
    </label>
  );
}

export default function LayoutControls({ block, onChange, onReset, problem }) {
  return (
    <div className="controls">
      <NumberField label="X (%)" value={block.x} min={0} max={100} slider onChange={(x) => onChange({ x })} />
      <NumberField label="Y (%)" value={block.y} min={0} max={100} slider onChange={(y) => onChange({ y })} />
      <NumberField label="Max width (%)" value={block.width} min={5} max={100} step={1} onChange={(width) => onChange({ width })} />
      <NumberField label="Font size (px)" value={block.fontSize} min={8} max={200} step={1} onChange={(fontSize) => onChange({ fontSize })} />

      <label className="field">
        <span>Font</span>
        <select value={block.fontFamily} onChange={(e) => onChange({ fontFamily: e.target.value })}>
          {FONTS.map((f) => <option key={f}>{f}</option>)}
        </select>
      </label>

      <label className="field">
        <span>Weight</span>
        <select value={block.fontWeight} onChange={(e) => onChange({ fontWeight: +e.target.value })}>
          {[400, 500, 600, 700].map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
      </label>

      <label className="field">
        <span>Alignment</span>
        <select value={block.align} onChange={(e) => onChange({ align: e.target.value })}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </label>

      <label className="field">
        <span>Color</span>
        <input type="color" value={block.color} onChange={(e) => onChange({ color: e.target.value })} />
      </label>

      {problem && <p className="warning">{problem}</p>}
      <button type="button" className="btn" onClick={onReset}>Reset this layer</button>
    </div>
  );
}
