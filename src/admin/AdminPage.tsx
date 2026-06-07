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

import { Button }   from '@heroui/react/button';
import { Input }    from '@heroui/react/input';
import { TextArea } from '@heroui/react/textarea';
import { Label }    from '@heroui/react/label';
import { Chip }     from '@heroui/react/chip';
import { Table }    from '@heroui/react/table';
import { Modal }    from '@heroui/react/modal';
import { Select }   from '@heroui/react/select';
import { ListBox }  from '@heroui/react/list-box';
import { ListBoxItem } from '@heroui/react/list-box-item';
import { Alert }    from '@heroui/react/alert';
import { AlertCircleIcon } from 'lucide-react';

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
  if (!localStorage.getItem(PW_KEY))
    localStorage.setItem(PW_KEY, await hashPw(DEFAULT_PW));
}

async function checkPw(pw: string): Promise<boolean> {
  const stored = localStorage.getItem(PW_KEY);
  return !!stored && (await hashPw(pw)) === stored;
}

async function changePw(current: string, next: string): Promise<string | null> {
  if (!(await checkPw(current))) return 'Current password is incorrect.';
  if (next.length < 6) return 'New password must be at least 6 characters.';
  localStorage.setItem(PW_KEY, await hashPw(next));
  return null;
}

// ── Salience chip colour ──────────────────────────────────────────────────────

function salienceBadge(sal: number): 'danger' | 'warning' | 'default' | 'success' {
  if (sal >= 30) return 'danger';
  if (sal >= 20) return 'warning';
  if (sal >= 10) return 'default';
  return 'success';
}

// ── PasswordGate ─────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw]     = useState('');
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { void initDefaultHash(); }, []);

  async function handleSubmit() {
    setBusy(true); setErr('');
    const ok = await checkPw(pw);
    setBusy(false);
    if (ok) { onAuth(); } else { setErr('Incorrect password.'); setPw(''); }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm border border-gray-200 rounded-xl p-8 shadow-sm bg-white">
        <h1 className="text-xl font-bold text-gray-900 mb-1">NutriChain Admin</h1>
        <p className="text-gray-500 text-sm mb-6">
          Default password:{' '}
          <code className="text-xs bg-gray-100 px-1 rounded">{DEFAULT_PW}</code>
        </p>
        <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pw-input">Password</Label>
            <Input
              id="pw-input"
              type="password"
              autoComplete="current-password"
              value={pw}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPw(e.target.value)}
              autoFocus
              fullWidth
            />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isDisabled={busy || !pw}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {busy ? 'Verifying…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Change-password dialog ────────────────────────────────────────────────────

function ChangePwDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [cur, setCur]   = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg]   = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleChange() {
    setBusy(true); setMsg(null);
    const err = await changePw(cur, next);
    setBusy(false);
    if (err) { setMsg({ text: err, ok: false }); }
    else { setMsg({ text: 'Password updated.', ok: true }); setCur(''); setNext(''); }
  }

  return (
    <Modal isOpen={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" scroll="outside">
          <Modal.Dialog>
            <Modal.Header className="flex items-center justify-between px-6 py-4 border-b">
              <Modal.Heading className="text-base font-semibold text-gray-900">
                Change password
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body className="px-6 py-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Current password</Label>
                <Input
                  type="password"
                  value={cur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCur(e.target.value)}
                  autoFocus
                  fullWidth
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  New password{' '}
                  <span className="text-gray-400 font-normal text-xs">(min 6 chars)</span>
                </Label>
                <Input
                  type="password"
                  value={next}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNext(e.target.value)}
                  fullWidth
                />
              </div>
              {msg && (
                <p className={`text-sm ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>
                  {msg.text}
                </p>
              )}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 px-6 py-4 border-t">
              <Button variant="ghost" onPress={onClose}>Cancel</Button>
              <Button
                isDisabled={busy || !cur || !next}
                onPress={() => void handleChange()}
              >
                {busy ? 'Saving…' : 'Update password'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

// ── Rule dialog ───────────────────────────────────────────────────────────────

const EMPTY_RULE: RuleJson = { id: '', description: '', salience: 10, condition: '', action: '' };

interface RuleDialogProps {
  open: boolean;
  initial: RuleJson | null;
  onSave: (r: RuleJson) => void;
  onClose: () => void;
}

function RuleDialog({ open, initial, onSave, onClose }: RuleDialogProps) {
  const [rule, setRule]     = useState<RuleJson>(initial ?? { ...EMPTY_RULE });
  const [valMsg, setValMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    (() => {
      setRule(initial ?? { ...EMPTY_RULE });
      setValMsg(null);
    })();
  }, [initial, open]);

  function set<K extends keyof RuleJson>(key: K, val: RuleJson[K]) {
    setRule((r) => ({ ...r, [key]: val }));
    setValMsg(null);
  }

  function handleValidate() {
    const err = validateRuleJson(rule);
    setValMsg(err ? { text: err, ok: false } : { text: 'Both functions compiled successfully.', ok: true });
  }

  function handleSave() {
    const err = validateRuleJson(rule);
    if (err) { setValMsg({ text: err, ok: false }); return; }
    onSave(rule);
  }

  return (
    <Modal isOpen={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="cover" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <Modal.Heading className="text-base font-semibold text-gray-900">
                {initial ? `Edit rule: ${rule.id}` : 'Add new rule'}
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="px-6 py-4 space-y-4 overflow-y-auto">
              <Alert status="warning" className="bg-amber-50 border border-amber-200">
                <Alert.Indicator>
                  <AlertCircleIcon className="w-4 h-4 text-amber-600" />
                </Alert.Indicator>
                <Alert.Content>
                  <Alert.Title className="text-amber-800 text-sm">
                    Condition and Action are evaluated as JavaScript.
                  </Alert.Title>
                </Alert.Content>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Rule ID</Label>
                  <Input
                    required
                    placeholder="R_My_Rule"
                    value={rule.id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('id', e.target.value)}
                    fullWidth
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Salience</Label>
                  <Input
                    required
                    type="number"
                    min={0}
                    max={9999}
                    value={String(rule.salience)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      set('salience', parseInt(e.target.value) || 0)
                    }
                    fullWidth
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Description</Label>
                  <Input
                    placeholder="Human-readable explanation of what this rule does"
                    value={rule.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      set('description', e.target.value)
                    }
                    fullWidth
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-indigo-600 font-semibold text-sm">
                    IF{' '}
                    <span className="text-gray-400 font-normal text-xs">condition</span>
                  </Label>
                  <TextArea
                    required
                    className="font-mono text-xs min-h-22.5 resize-y"
                    spellCheck={false}
                    placeholder="e.g., FACTS.bmi !== undefined && FACTS.bmi_category === undefined"
                    value={rule.condition}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      set('condition', e.target.value)
                    }
                    fullWidth
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-indigo-600 font-semibold text-sm">
                    THEN{' '}
                    <span className="text-gray-400 font-normal text-xs">action</span>
                  </Label>
                  <TextArea
                    required
                    className="font-mono text-xs min-h-22.5 resize-y"
                    spellCheck={false}
                    placeholder="e.g., ({ bmi_category: FACTS.bmi < 18.5 ? 'Underweight' : 'Normal' })"
                    value={rule.action}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      set('action', e.target.value)
                    }
                    fullWidth
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Available variables:{' '}
                  <code>FACTS</code>, <code>ALLERGEN_FOODS</code>,{' '}
                  <code>DIET_FOODS</code>, <code>ACTIVITY_MULTIPLIERS</code>
                </p>
              </div>

              {valMsg && (
                <p className={`text-xs rounded-md px-3 py-2 border font-mono ${
                  valMsg.ok
                    ? 'text-green-700 bg-green-50 border-green-200'
                    : 'text-red-700 bg-red-50 border-red-200'
                }`}>
                  {valMsg.text}
                </p>
              )}
            </Modal.Body>

            <Modal.Footer className="flex justify-end gap-2 px-6 py-4 border-t shrink-0">
              <Button variant="ghost" onPress={onClose}>Cancel</Button>
              <Button variant="outline" onPress={handleValidate}>Validate</Button>
              <Button isDisabled={!rule.id} onPress={handleSave}>
                {initial ? 'Save changes' : 'Add rule'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

// ── Fact dialog ───────────────────────────────────────────────────────────────

const TYPE_OPTIONS: FactFieldType[] = ['number', 'string', 'boolean', 'enum', 'enum[]', 'string[]'];
const EMPTY_FACT: FactFieldSchema   = { name: '', type: 'number', description: '' };

interface FactDialogProps {
  open: boolean;
  initial: FactFieldSchema | null;
  onSave: (f: FactFieldSchema) => void;
  onClose: () => void;
}

function FactDialog({ open, initial, onSave, onClose }: FactDialogProps) {
  const [fact, setFact]           = useState<FactFieldSchema>(initial ?? { ...EMPTY_FACT });
  const [valuesStr, setValuesStr] = useState((initial?.values ?? []).join(', '));

  useEffect(() => {
    (() => {
      setFact(initial ?? { ...EMPTY_FACT });
      setValuesStr((initial?.values ?? []).join(', '));
    })();
  }, [initial, open]);

  function set<K extends keyof FactFieldSchema>(key: K, val: FactFieldSchema[K]) {
    setFact((f) => ({ ...f, [key]: val }));
  }

  const needsValues = fact.type === 'enum' || fact.type === 'enum[]';

  function handleSave() {
    console.log('Saving fact to file (dev mode):', fact);
    onSave({
      ...fact,
      values: needsValues
        ? valuesStr.split(',').map((v) => v.trim()).filter(Boolean)
        : undefined,
    });
  }

  return (
    <Modal isOpen={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.Header className="flex items-center justify-between px-6 py-4 border-b">
              <Modal.Heading className="text-base font-semibold text-gray-900">
                {initial ? `Edit fact: ${fact.name}` : 'Add new fact field'}
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Field name</Label>
                  <Input
                    placeholder="e.g. bmi_category"
                    value={fact.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      set('name', e.target.value)
                    }
                    fullWidth
                  />
                </div>
                <div className="space-y-1.5">
                  <Select
                    selectedKey={fact.type}
                    onSelectionChange={(v) => set('type', v as FactFieldType)}
                    fullWidth
                  >
                    <Label>Data type</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {TYPE_OPTIONS.map((t) => (
                          <ListBoxItem key={t} id={t}>{t}</ListBoxItem>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  placeholder="Brief explanation of what this fact represents"
                  value={fact.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    set('description', e.target.value)
                  }
                  fullWidth
                />
              </div>

              {needsValues && (
                <div className="space-y-1.5">
                  <Label>
                    Allowed values{' '}
                    <span className="text-gray-400 text-xs">(comma-separated)</span>
                  </Label>
                  <Input
                    placeholder="e.g. Underweight, Normal, Overweight, Obese"
                    value={valuesStr}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setValuesStr(e.target.value)
                    }
                    fullWidth
                  />
                </div>
              )}
            </Modal.Body>

            <Modal.Footer className="flex justify-end gap-2 px-6 py-4 border-t">
              <Button variant="ghost" onPress={onClose}>Cancel</Button>
              <Button isDisabled={!fact.name} onPress={handleSave}>
                {initial ? 'Save changes' : 'Add fact'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

// ── Modal state type ──────────────────────────────────────────────────────────

type ModalState =
  | { kind: 'none' }
  | { kind: 'add-fact' }
  | { kind: 'edit-fact'; fact: FactFieldSchema }
  | { kind: 'add-rule' }
  | { kind: 'edit-rule'; rule: RuleJson }
  | { kind: 'change-pw' };

// ── AdminPage ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed]   = useState(false);
  const [rules, setRules]     = useState<RuleJson[]>(() => getRulesJson());
  const [schema, setSchema]   = useState<FactFieldSchema[]>(() => getFactsSchema());
  const [modal, setModal]     = useState<ModalState>({ kind: 'none' });

  const closeModal = useCallback(() => setModal({ kind: 'none' }), []);
  const handleAuth = useCallback(() => setAuthed(true), []);

  if (!authed) return <PasswordGate onAuth={handleAuth} />;

  // ── Facts handlers ──────────────────────────────────────────────────────────
  function saveFact(fact: FactFieldSchema) {
    const originalName = modal.kind === 'edit-fact' ? modal.fact.name : null;
    const updated = originalName === null
      ? [...schema, fact]
      : schema.map((f) => (f.name === originalName ? fact : f));
    setSchema(updated); saveFactsSchema(updated); closeModal();
  }

  function deleteFact(name: string) {
    if (!confirm(`Delete fact field "${name}"?`)) return;
    const updated = schema.filter((f) => f.name !== name);
    setSchema(updated); saveFactsSchema(updated);
  }

  function resetFacts() {
    if (!confirm('Reset facts schema to built-in defaults?')) return;
    resetFactsSchema(); setSchema(getFactsSchema());
  }

  // ── Rules handlers ──────────────────────────────────────────────────────────
  function saveRule(rule: RuleJson) {
    const originalId = modal.kind === 'edit-rule' ? modal.rule.id : null;
    const updated = originalId === null
      ? [...rules, rule]
      : rules.map((r) => (r.id === originalId ? rule : r));
    setRules(updated); saveRulesJson(updated); closeModal();
  }

  function deleteRule(id: string) {
    if (!confirm(`Delete rule "${id}"?`)) return;
    const updated = rules.filter((r) => r.id !== id);
    setRules(updated); saveRulesJson(updated);
  }

  function resetRules() {
    if (!confirm('Reset all rules to built-in defaults?')) return;
    resetRulesJson(); setRules(getRulesJson());
  }

  const sortedRules = [...rules].sort((a, b) => b.salience - a.salience || a.id.localeCompare(b.id));

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-green-800 text-white px-6 py-3 flex items-center gap-4">
        <span className="font-bold text-base flex-1">
          🌿 NutriChain{' '}
          <span className="text-green-200 font-normal">/ Admin</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-green-700"
          onPress={() => setModal({ kind: 'change-pw' })}
        >
          Change password
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-green-700"
          onPress={() => { setAuthed(false); window.location.hash = ''; window.location.reload(); }}
        >
          ← Back to app
        </Button>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-12">

        {/* ── Facts Schema ───────────────────────────────────────────────── */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Facts Schema</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Defines the shape of the working-memory Facts object — reference when writing rule bodies.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onPress={resetFacts}>Reset to defaults</Button>
              <Button size="sm" onPress={() => {setModal({ kind: 'add-fact' })}}>+ Add fact</Button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <Table.Content aria-label="Facts Schema">
                <Table.Header>
                  <Table.Column isRowHeader className="w-44 text-xs font-semibold text-gray-500 uppercase py-2 px-3">
                    Field name
                  </Table.Column>
                  <Table.Column isRowHeader className="w-28 text-xs font-semibold text-gray-500 uppercase py-2 px-3">
                    Type
                  </Table.Column>
                  <Table.Column isRowHeader className="text-xs font-semibold text-gray-500 uppercase py-2 px-3">
                    Allowed values
                  </Table.Column>
                  <Table.Column isRowHeader className="text-xs font-semibold text-gray-500 uppercase py-2 px-3">
                    Description
                  </Table.Column>
                  <Table.Column isRowHeader className="w-28 text-xs font-semibold text-gray-500 uppercase py-2 px-3 text-right">
                    Actions
                  </Table.Column>
                </Table.Header>
                <Table.Body
                  renderEmptyState={() => (
                    <p className="text-center text-gray-400 py-10 text-sm">
                      No fact fields defined.
                    </p>
                  )}
                >
                  {schema.map((fact) => (
                    <Table.Row key={fact.name} id={fact.name} className="border-t border-gray-100 hover:bg-gray-50">
                      <Table.Cell className="py-2 px-3 font-mono text-xs text-indigo-600">
                        {fact.name}
                      </Table.Cell>
                      <Table.Cell className="py-2 px-3">
                        <Chip size="sm" variant="secondary" className="font-mono text-xs">
                          {fact.type}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell className="py-2 px-3 text-xs text-gray-500">
                        {fact.values?.join(', ') ?? '—'}
                      </Table.Cell>
                      <Table.Cell className="py-2 px-3 text-sm text-gray-700">
                        {fact.description}
                      </Table.Cell>
                      <Table.Cell className="py-2 px-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onPress={() => setModal({ kind: 'edit-fact', fact })}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onPress={() => deleteFact(fact.name)}
                          >
                            Delete
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table>
          </div>
        </section>

        {/* ── Rules ──────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Inference Rules</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Sorted by salience (highest fires first).
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onPress={resetRules}>Reset to defaults</Button>
              <Button size="sm" onPress={() => setModal({ kind: 'add-rule' })}>+ Add rule</Button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <Table.Content aria-label="Inference Rules">
                <Table.Header>
                  <Table.Column className="w-16 text-xs font-semibold text-gray-500 uppercase py-2 px-3 text-center">
                    Sal.
                  </Table.Column>
                  <Table.Column className="w-52 text-xs font-semibold text-gray-500 uppercase py-2 px-3">
                    ID
                  </Table.Column>
                  <Table.Column className="text-xs font-semibold text-gray-500 uppercase py-2 px-3">
                    Description
                  </Table.Column>
                  <Table.Column className="text-xs font-semibold text-gray-500 uppercase py-2 px-3">
                    Condition
                  </Table.Column>
                  <Table.Column className="text-xs font-semibold text-gray-500 uppercase py-2 px-3">
                    Action
                  </Table.Column>
                  <Table.Column className="w-28 text-xs font-semibold text-gray-500 uppercase py-2 px-3 text-right">
                    Actions
                  </Table.Column>
                </Table.Header>
                <Table.Body
                  renderEmptyState={() => (
                    <p className="text-center text-gray-400 py-10 text-sm">
                      No rules defined.
                    </p>
                  )}
                >
                  {sortedRules.map((rule) => (
                    <Table.Row key={rule.id} id={rule.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <Table.Cell className="py-2 px-3 text-center">
                        <Chip size="sm" color={salienceBadge(rule.salience)} className="tabular-nums">
                          {rule.salience}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell className="py-2 px-3 font-mono text-xs text-indigo-600">
                        {rule.id}
                      </Table.Cell>
                      <Table.Cell
                        className="py-2 px-3 text-sm text-gray-700 max-w-50 truncate"
                        // title={rule.description}
                      >
                        {rule.description}
                      </Table.Cell>
                      <Table.Cell
                        className="py-2 px-3 font-mono text-xs text-gray-500 max-w-55 truncate"
                        // title={rule.condition}
                      >
                        {rule.condition}
                      </Table.Cell>
                      <Table.Cell
                        className="py-2 px-3 font-mono text-xs text-gray-500 max-w-55 truncate"
                        // title={rule.action}
                      >
                        {rule.action}
                      </Table.Cell>
                      <Table.Cell className="py-2 px-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onPress={() => setModal({ kind: 'edit-rule', rule })}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onPress={() => deleteRule(rule.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table>
          </div>
        </section>
      </main>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <FactDialog
        key={modal.kind === 'edit-fact' ? modal.fact.name : 'add-fact'}
        open={modal.kind === 'add-fact' || modal.kind === 'edit-fact'}
        initial={modal.kind === 'edit-fact' ? modal.fact : null}
        onSave={saveFact}
        onClose={closeModal}
      />
      <RuleDialog
        key={modal.kind === 'edit-rule' ? modal.rule.id : 'add-rule'}
        open={modal.kind === 'add-rule' || modal.kind === 'edit-rule'}
        initial={modal.kind === 'edit-rule' ? modal.rule : null}
        onSave={saveRule}
        onClose={closeModal}
      />
      <ChangePwDialog
        open={modal.kind === 'change-pw'}
        onClose={closeModal}
      />
    </div>
  );
}
