import { useState, useEffect, useCallback } from 'react';
import {
  type RuleJson,
  type FactFieldSchema,
  type FactFieldType,
  getRulesJson,
  saveRulesJson,
  resetRulesJson,
  getFactsSchema,
  saveFactsSchema,
  resetFactsSchema,
  validateRuleJson,
} from '../engine/ruleLoader';
import './admin.css';

// ── Password helpers ─────────────────────────────────────────────────────────

const PW_KEY = 'nutrichain_admin_pw';
const DEFAULT_PW = 'nutrichain2024';

async function hashPw(pw: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function initDefaultHash(): Promise<void> {
  if (!localStorage.getItem(PW_KEY)) {
    localStorage.setItem(PW_KEY, await hashPw(DEFAULT_PW));
  }
}

async function checkPw(pw: string): Promise<boolean> {
  const stored = localStorage.getItem(PW_KEY);
  if (!stored) return false;
  return (await hashPw(pw)) === stored;
}

async function changePw(currentPw: string, newPw: string): Promise<string | null> {
  if (!(await checkPw(currentPw))) return 'Current password is incorrect.';
  if (newPw.length < 6) return 'New password must be at least 6 characters.';
  localStorage.setItem(PW_KEY, await hashPw(newPw));
  return null;
}

// ── PasswordGate ─────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw]     = useState('');
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { void initDefaultHash(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    const ok = await checkPw(pw);
    setBusy(false);
    if (ok) { onAuth(); } else { setErr('Incorrect password.'); setPw(''); }
  }

  return (
    <div className="admin-root">
      <div className="pw-gate">
        <div className="pw-card">
          <h1>NutriChain Admin</h1>
          <p className="pw-subtitle">
            Enter the admin password to manage rules and facts schema.
            <br />Default password: <code>{DEFAULT_PW}</code>
          </p>
          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <div className="pw-field">
              <label htmlFor="pw-input">Password</label>
              <input
                id="pw-input"
                type="password"
                autoComplete="current-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoFocus
              />
            </div>
            {err && <div className="pw-error">{err}</div>}
            <button className="pw-btn" type="submit" disabled={busy || !pw}>
              {busy ? 'Verifying…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ── Rule modal ────────────────────────────────────────────────────────────────

const EMPTY_RULE: RuleJson = { id: '', description: '', salience: 10, condition: '', action: '' };

interface RuleModalProps {
  initial: RuleJson | null;
  onSave: (r: RuleJson) => void;
  onClose: () => void;
}

function RuleModal({ initial, onSave, onClose }: RuleModalProps) {
  const [rule, setRule]           = useState<RuleJson>(initial ?? { ...EMPTY_RULE });
  const [validateMsg, setValidateMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function set<K extends keyof RuleJson>(key: K, val: RuleJson[K]) {
    setRule((r) => ({ ...r, [key]: val }));
    setValidateMsg(null);
  }

  function handleValidate() {
    const err = validateRuleJson(rule);
    setValidateMsg(err ? { text: err, ok: false } : { text: 'Functions compiled successfully.', ok: true });
  }

  function handleSave() {
    const err = validateRuleJson(rule);
    if (err) { setValidateMsg({ text: err, ok: false }); return; }
    onSave(rule);
  }

  return (
    <Modal title={initial ? `Edit rule: ${rule.id}` : 'Add new rule'} onClose={onClose}>
      <div className="warn-banner" style={{ marginBottom: '1.25rem' }}>
        Condition and Action bodies are evaluated as JavaScript. Only edit rules from trusted sources.
      </div>

      <div className="edit-grid">
        <div className="form-field">
          <label>Rule ID</label>
          <input
            type="text"
            placeholder="R_My_Rule"
            value={rule.id}
            onChange={(e) => set('id', e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Salience (higher fires first)</label>
          <input
            type="number"
            min={0}
            max={9999}
            value={rule.salience}
            onChange={(e) => set('salience', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="form-field full-width">
          <label>Description</label>
          <input
            type="text"
            placeholder="Human-readable explanation"
            value={rule.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
      </div>

      {/* IF / THEN */}
      <div className="if-then-block">
        <div className="form-field">
          <label className="if-label">IF <span className="if-hint">— body of <code>(f: Facts) =&gt; boolean</code></span></label>
          <textarea
            className="code-tall"
            spellCheck={false}
            placeholder={`f.bmi !== undefined && f.bmi_category === undefined`}
            value={rule.condition}
            onChange={(e) => set('condition', e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="if-label">THEN <span className="if-hint">— body of <code>(f: Facts) =&gt; Partial&lt;Facts&gt;</code></span></label>
          <textarea
            className="code-tall"
            spellCheck={false}
            placeholder={`({ bmi_category: f.bmi < 18.5 ? 'Underweight' : 'Normal' })`}
            value={rule.action}
            onChange={(e) => set('action', e.target.value)}
          />
        </div>
        <p className="ctx-hint">
          Available in both bodies: <code>f</code> (Facts), <code>ALLERGEN_FOODS</code>, <code>DIET_FOODS</code>, <code>ACTIVITY_MULTIPLIERS</code>.
          <br />Expression bodies are returned automatically; write <code>return …;</code> for multi-statement bodies.
        </p>
      </div>

      <div className="edit-actions">
        <button className="btn-admin btn-admin-primary" onClick={handleSave} disabled={!rule.id}>
          {initial ? 'Save changes' : 'Add rule'}
        </button>
        <button className="btn-admin btn-admin-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-admin btn-admin-warning" onClick={handleValidate}>Validate</button>
        {validateMsg && (
          <div className={`validate-result ${validateMsg.ok ? 'ok' : 'err'}`}>{validateMsg.text}</div>
        )}
      </div>
    </Modal>
  );
}

// ── Fact modal ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: FactFieldType[] = ['number', 'string', 'boolean', 'enum', 'enum[]', 'string[]'];
const EMPTY_FACT: FactFieldSchema   = { name: '', type: 'number', description: '' };

interface FactModalProps {
  initial: FactFieldSchema | null;
  onSave: (f: FactFieldSchema) => void;
  onClose: () => void;
}

function FactModal({ initial, onSave, onClose }: FactModalProps) {
  const [fact, setFact] = useState<FactFieldSchema>(
    initial ? { ...initial, values: initial.values ? [...initial.values] : [] } : { ...EMPTY_FACT }
  );
  const [valuesStr, setValuesStr] = useState((initial?.values ?? []).join(', '));

  function set<K extends keyof FactFieldSchema>(key: K, val: FactFieldSchema[K]) {
    setFact((f) => ({ ...f, [key]: val }));
  }

  const needsValues = fact.type === 'enum' || fact.type === 'enum[]';

  function handleSave() {
    const saved: FactFieldSchema = {
      ...fact,
      values: needsValues
        ? valuesStr.split(',').map((v) => v.trim()).filter(Boolean)
        : undefined,
    };
    onSave(saved);
  }

  return (
    <Modal title={initial ? `Edit fact: ${fact.name}` : 'Add new fact field'} onClose={onClose}>
      <div className="edit-grid">
        <div className="form-field">
          <label>Field name (key in Facts)</label>
          <input
            type="text"
            placeholder="e.g. bmi_category"
            value={fact.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Data type</label>
          <select value={fact.type} onChange={(e) => set('type', e.target.value as FactFieldType)}>
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-field full-width">
          <label>Description</label>
          <input
            type="text"
            placeholder="Brief explanation of what this fact represents"
            value={fact.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
        {needsValues && (
          <div className="form-field full-width">
            <label>Allowed values (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. Underweight, Normal, Overweight, Obese"
              value={valuesStr}
              onChange={(e) => setValuesStr(e.target.value)}
            />
          </div>
        )}
      </div>
      <div className="edit-actions">
        <button className="btn-admin btn-admin-primary" onClick={handleSave} disabled={!fact.name}>
          {initial ? 'Save changes' : 'Add fact'}
        </button>
        <button className="btn-admin btn-admin-ghost" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

// ── Change-password modal ─────────────────────────────────────────────────────

function ChangePwModal({ onClose }: { onClose: () => void }) {
  const [cur, setCur]   = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg]   = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const err = await changePw(cur, next);
    setBusy(false);
    if (err) { setMsg({ text: err, ok: false }); }
    else { setMsg({ text: 'Password updated successfully.', ok: true }); setCur(''); setNext(''); }
  }

  return (
    <Modal title="Change password" onClose={onClose}>
      <form onSubmit={(e) => { void handleChange(e); }}>
        <div className="edit-grid">
          <div className="form-field">
            <label>Current password</label>
            <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoFocus />
          </div>
          <div className="form-field">
            <label>New password (min 6 chars)</label>
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
        </div>
        <div className="edit-actions" style={{ marginTop: '1rem' }}>
          <button className="btn-admin btn-admin-primary" type="submit" disabled={busy || !cur || !next}>
            {busy ? 'Saving…' : 'Update password'}
          </button>
          <button className="btn-admin btn-admin-ghost" type="button" onClick={onClose}>Cancel</button>
          {msg && (
            <div className={`validate-result ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>
          )}
        </div>
      </form>
    </Modal>
  );
}

// ── AdminPage (root) ─────────────────────────────────────────────────────────

type ModalState =
  | { kind: 'none' }
  | { kind: 'add-fact' }
  | { kind: 'edit-fact'; fact: FactFieldSchema }
  | { kind: 'add-rule' }
  | { kind: 'edit-rule'; rule: RuleJson }
  | { kind: 'change-pw' };

export default function AdminPage() {
  const [authed, setAuthed]       = useState(false);
  const [rules, setRules]         = useState<RuleJson[]>(() => getRulesJson());
  const [schema, setSchema]       = useState<FactFieldSchema[]>(() => getFactsSchema());
  const [modal, setModal]         = useState<ModalState>({ kind: 'none' });

  const closeModal = useCallback(() => setModal({ kind: 'none' }), []);
  const handleAuth = useCallback(() => setAuthed(true), []);

  if (!authed) return <PasswordGate onAuth={handleAuth} />;

  // ── Facts handlers ────────────────────────────────────────────────────────
  function saveFact(fact: FactFieldSchema) {
    const updated = modal.kind === 'add-fact'
      ? [...schema, fact]
      : schema.map((f) => (f.name === fact.name ? fact : f));
    setSchema(updated);
    saveFactsSchema(updated);
    closeModal();
  }

  function deleteFact(name: string) {
    if (!confirm(`Delete fact field "${name}"?`)) return;
    const updated = schema.filter((f) => f.name !== name);
    setSchema(updated);
    saveFactsSchema(updated);
  }

  function resetFacts() {
    if (!confirm('Reset facts schema to built-in defaults?')) return;
    resetFactsSchema();
    setSchema(getFactsSchema());
  }

  // ── Rules handlers ────────────────────────────────────────────────────────
  function saveRule(rule: RuleJson) {
    const updated = modal.kind === 'add-rule'
      ? [...rules, rule]
      : rules.map((r) => (r.id === rule.id ? rule : r));
    setRules(updated);
    saveRulesJson(updated);
    closeModal();
  }

  function deleteRule(id: string) {
    if (!confirm(`Delete rule "${id}"?`)) return;
    const updated = rules.filter((r) => r.id !== id);
    setRules(updated);
    saveRulesJson(updated);
  }

  function resetRules() {
    if (!confirm('Reset all rules to built-in defaults? This will discard all custom rules.')) return;
    resetRulesJson();
    setRules(getRulesJson());
  }

  const sortedRules = [...rules].sort((a, b) => b.salience - a.salience || a.id.localeCompare(b.id));

  return (
    <div className="admin-root">
      {/* Header */}
      <div className="admin-header">
        <span className="admin-header-title">NutriChain <span>Admin</span></span>
        <button
          className="admin-nav-link"
          onClick={() => setModal({ kind: 'change-pw' })}
        >
          Change password
        </button>
        <a
          className="admin-nav-link"
          href="#"
          onClick={(e) => { e.preventDefault(); window.location.hash = ''; window.location.reload(); }}
        >
          ← Back to app
        </a>
        <button
          className="admin-nav-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => setAuthed(false)}
        >
          Sign out
        </button>
      </div>

      <div className="admin-body">

        {/* ── Facts Schema ─────────────────────────────────────────────── */}
        <div className="admin-section-header">
          <div>
            <h2>Facts Schema</h2>
            <p>Defines the shape of the working-memory Facts object — reference when writing rule conditions and actions.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-admin btn-admin-danger" onClick={resetFacts}>Reset to defaults</button>
            <button className="btn-admin btn-admin-primary" onClick={() => setModal({ kind: 'add-fact' })}>+ Add fact</button>
          </div>
        </div>

        <div className="admin-table-wrap" style={{ marginBottom: '3rem' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Field name</th>
                <th>Type</th>
                <th>Allowed values</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schema.length === 0 && (
                <tr><td colSpan={5} className="empty-state">No fact fields defined.</td></tr>
              )}
              {schema.map((fact) => (
                <tr key={fact.name}>
                  <td className="td-id">{fact.name}</td>
                  <td className="td-type">{fact.type}</td>
                  <td style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>{fact.values?.join(', ') ?? '—'}</td>
                  <td>{fact.description}</td>
                  <td className="td-actions">
                    <button className="btn-admin btn-admin-ghost" onClick={() => setModal({ kind: 'edit-fact', fact })}>Edit</button>
                    <button className="btn-admin btn-admin-danger" onClick={() => deleteFact(fact.name)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Rules ────────────────────────────────────────────────────── */}
        <div className="admin-section-header">
          <div>
            <h2>Inference Rules</h2>
            <p>Sorted by salience (highest fires first). Condition and action store only the function body — <code>f</code> is always available as the Facts parameter.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-admin btn-admin-danger" onClick={resetRules}>Reset to defaults</button>
            <button className="btn-admin btn-admin-primary" onClick={() => setModal({ kind: 'add-rule' })}>+ Add rule</button>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th style={{ textAlign: 'center' }}>Sal.</th>
                <th>Description</th>
                <th>IF (condition body)</th>
                <th>THEN (action body)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRules.length === 0 && (
                <tr><td colSpan={6} className="empty-state">No rules defined.</td></tr>
              )}
              {sortedRules.map((rule) => (
                <tr key={rule.id}>
                  <td className="td-id">{rule.id}</td>
                  <td className="td-salience">{rule.salience}</td>
                  <td>{rule.description}</td>
                  <td className="td-code" title={rule.condition}>{rule.condition}</td>
                  <td className="td-code" title={rule.action}>{rule.action}</td>
                  <td className="td-actions">
                    <button className="btn-admin btn-admin-ghost" onClick={() => setModal({ kind: 'edit-rule', rule })}>Edit</button>
                    <button className="btn-admin btn-admin-danger" onClick={() => deleteRule(rule.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {modal.kind === 'add-fact'  && <FactModal initial={null} onSave={saveFact} onClose={closeModal} />}
      {modal.kind === 'edit-fact' && <FactModal initial={modal.fact} onSave={saveFact} onClose={closeModal} />}
      {modal.kind === 'add-rule'  && <RuleModal initial={null} onSave={saveRule} onClose={closeModal} />}
      {modal.kind === 'edit-rule' && <RuleModal initial={modal.rule} onSave={saveRule} onClose={closeModal} />}
      {modal.kind === 'change-pw' && <ChangePwModal onClose={closeModal} />}
    </div>
  );
}
