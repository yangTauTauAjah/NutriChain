import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
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

import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label }    from '@/components/ui/label';
import { Badge }    from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
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

// ── Salience colour helpers ───────────────────────────────────────────────────

function salienceBadge(sal: number) {
  if (sal >= 30) return 'destructive';
  if (sal >= 20) return 'default';
  if (sal >= 10) return 'secondary';
  return 'outline';
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
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm border rounded-xl p-8 shadow-sm bg-card">
        <h1 className="text-xl font-bold mb-1">NutriChain Admin</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Default password: <code className="text-xs bg-muted px-1 rounded">{DEFAULT_PW}</code>
        </p>
        <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pw-input">Password</Label>
            <Input
              id="pw-input"
              type="password"
              autoComplete="current-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
            />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button type="submit" className="w-full" disabled={busy || !pw}>
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); void handleChange(); }} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current password</Label>
            <Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>New password <span className="text-muted-foreground text-xs">(min 6 chars)</span></Label>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          {msg && (
            <p className={`text-sm ${msg.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>{msg.text}</p>
          )}
          <DialogFooter>
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy || !cur || !next}>
              {busy ? 'Saving…' : 'Update password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
    setRule(initial ?? { ...EMPTY_RULE });
    setValMsg(null);
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-2xl flex flex-col gap-0 p-0 max-h-[90vh]">

        {/* Fixed header */}
        <DialogHeader className="px-6 pt-5 pb-4 pr-14 shrink-0 border-b">
          <DialogTitle>{initial ? `Edit rule: ${rule.id}` : 'Add new rule'}</DialogTitle>
        </DialogHeader>

        {/* Scrollable body — min-h-0 is required for flex children to actually scroll */}
        <div className="flex flex-col gap-4 overflow-y-auto min-h-0 flex-1 px-6 py-4 space-y-4">
          {/* <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800">
            Condition and Action are evaluated as JavaScript.
          </p> */}

           <Alert variant="default" className="max-w-md bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800">
            <AlertCircleIcon />
            <AlertTitle>Condition and Action are evaluated as JavaScript.</AlertTitle>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Rule ID</Label>
              <Input
                placeholder="R_My_Rule"
                value={rule.id}
                onChange={(e) => set('id', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Salience</Label>
              <Input
                type="number"
                min={0}
                max={9999}
                value={rule.salience}
                onChange={(e) => set('salience', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Input
                placeholder="Human-readable explanation of what this rule does"
                value={rule.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-indigo-500 dark:text-indigo-400 font-semibold text-sm">
                IF{' '}<span className="text-muted-foreground font-normal text-xs">condition</span>
              </Label>
              <Textarea
                className="font-mono text-xs min-h-22.5 resize-y"
                spellCheck={false}
                placeholder="e.g., FACTS.bmi !== undefined && FACTS.bmi_category === undefined"
                value={rule.condition}
                onChange={(e) => set('condition', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-indigo-500 dark:text-indigo-400 font-semibold text-sm">
                THEN{' '}<span className="text-muted-foreground font-normal text-xs">action</span>
              </Label>
              <Textarea
                className="font-mono text-xs min-h-22.5 resize-y"
                spellCheck={false}
                placeholder="e.g., ({ bmi_category: FACTS.bmi < 18.5 ? 'Underweight' : 'Normal' })"
                value={rule.action}
                onChange={(e) => set('action', e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Available Variables: <code>FACTS</code>, <code>ALLERGEN_FOODS</code>, <code>DIET_FOODS</code>,{' '}
              <code>ACTIVITY_MULTIPLIERS</code>.
            </p>
          </div>

          {valMsg && (
            <p className={`text-xs rounded-md px-3 py-2 border ${
              valMsg.ok
                ? 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800'
                : 'text-destructive bg-destructive/5 border-destructive/20 font-mono'
            }`}>
              {valMsg.text}
            </p>
          )}
        </div>

        {/* Fixed footer */}
        <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={handleValidate}>Validate</Button>
          <Button onClick={handleSave} disabled={!rule.id}>
            {initial ? 'Save changes' : 'Add rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const [fact, setFact]     = useState<FactFieldSchema>(initial ?? { ...EMPTY_FACT });
  const [valuesStr, setValuesStr] = useState((initial?.values ?? []).join(', '));

  useEffect(() => {
    setFact(initial ?? { ...EMPTY_FACT });
    setValuesStr((initial?.values ?? []).join(', '));
  }, [initial, open]);

  function set<K extends keyof FactFieldSchema>(key: K, val: FactFieldSchema[K]) {
    setFact((f) => ({ ...f, [key]: val }));
  }

  const needsValues = fact.type === 'enum' || fact.type === 'enum[]';

  function handleSave() {
    onSave({
      ...fact,
      values: needsValues
        ? valuesStr.split(',').map((v) => v.trim()).filter(Boolean)
        : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? `Edit fact: ${fact.name}` : 'Add new fact field'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Field name</Label>
              <Input
                placeholder="e.g. bmi_category"
                value={fact.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data type</Label>
              <Select value={fact.type} onValueChange={(v) => set('type', v as FactFieldType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              placeholder="Brief explanation of what this fact represents"
              value={fact.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {needsValues && (
            <div className="space-y-1.5">
              <Label>Allowed values <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
              <Input
                placeholder="e.g. Underweight, Normal, Overweight, Obese"
                value={valuesStr}
                onChange={(e) => setValuesStr(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!fact.name}>
            {initial ? 'Save changes' : 'Add fact'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  // Dark mode for the whole admin page, including Dialog portals (they render in document.body
  // which is a descendant of html.dark, so the @custom-variant dark (&:is(.dark *)) picks it up).
  useLayoutEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  const [authed, setAuthed]   = useState(false);
  const [rules, setRules]     = useState<RuleJson[]>(() => getRulesJson());
  const [schema, setSchema]   = useState<FactFieldSchema[]>(() => getFactsSchema());
  const [modal, setModal]     = useState<ModalState>({ kind: 'none' });

  const closeModal = useCallback(() => setModal({ kind: 'none' }), []);
  const handleAuth = useCallback(() => setAuthed(true), []);

  if (!authed) return <PasswordGate onAuth={handleAuth} />;

  // ── Facts handlers ──────────────────────────────────────────────────────────
  function saveFact(fact: FactFieldSchema) {
    const updated = modal.kind === 'add-fact'
      ? [...schema, fact]
      : schema.map((f) => (FACTS.name === fact.name ? fact : f));
    setSchema(updated); saveFactsSchema(updated); closeModal();
  }

  function deleteFact(name: string) {
    if (!confirm(`Delete fact field "${name}"?`)) return;
    const updated = schema.filter((f) => FACTS.name !== name);
    setSchema(updated); saveFactsSchema(updated);
  }

  function resetFacts() {
    if (!confirm('Reset facts schema to built-in defaults?')) return;
    resetFactsSchema(); setSchema(getFactsSchema());
  }

  // ── Rules handlers ──────────────────────────────────────────────────────────
  function saveRule(rule: RuleJson) {
    const updated = modal.kind === 'add-rule'
      ? [...rules, rule]
      : rules.map((r) => (r.id === rule.id ? rule : r));
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
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="border-b bg-card px-6 py-3 flex items-center gap-4">
        <span className="font-bold text-base flex-1">
          NutriChain <span className="text-muted-foreground font-normal">/ Admin</span>
        </span>
        <Button variant="ghost" size="sm" onClick={() => setModal({ kind: 'change-pw' })}>
          Change password
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setAuthed(false); window.location.hash = ''; window.location.reload(); }}
        >
          ← Back to app
        </Button>
        {/* <Button variant="ghost" size="sm" onClick={() => setAuthed(false)}>
          Sign out
        </Button> */}
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-12">

        {/* ── Facts Schema ───────────────────────────────────────────────── */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Facts Schema</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Defines the shape of the working-memory Facts object — reference when writing rule bodies.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetFacts}>Reset to defaults</Button>
              <Button size="sm" onClick={() => setModal({ kind: 'add-fact' })}>+ Add fact</Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">Field name</TableHead>
                  <TableHead className="w-28">Type</TableHead>
                  <TableHead>Allowed values</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schema.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      No fact fields defined.
                    </TableCell>
                  </TableRow>
                )}
                {schema.map((fact) => (
                  <TableRow key={fact.name}>
                    <TableCell className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{fact.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">{fact.type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fact.values?.join(', ') ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">{fact.description}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setModal({ kind: 'edit-fact', fact })}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteFact(fact.name)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* ── Rules ──────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Inference Rules</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Sorted by salience (highest fires first).
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetRules}>Reset to defaults</Button>
              <Button size="sm" onClick={() => setModal({ kind: 'add-rule' })}>+ Add rule</Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 text-center">Sal.</TableHead>
                  <TableHead className="w-52">ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      No rules defined.
                    </TableCell>
                  </TableRow>
                )}
                {sortedRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="text-center">
                      <Badge variant={salienceBadge(rule.salience)} className="tabular-nums">
                        {rule.salience}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{rule.id}</TableCell>
                    <TableCell className="text-sm max-w-50 truncate" title={rule.description}>
                      {rule.description}
                    </TableCell>
                    <TableCell
                      className="font-mono text-xs text-muted-foreground max-w-55 truncate"
                      title={rule.condition}
                    >
                      {rule.condition}
                    </TableCell>
                    <TableCell
                      className="font-mono text-xs text-muted-foreground max-w-55 truncate"
                      title={rule.action}
                    >
                      {rule.action}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setModal({ kind: 'edit-rule', rule })}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteRule(rule.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </main>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <FactDialog
        open={modal.kind === 'add-fact' || modal.kind === 'edit-fact'}
        initial={modal.kind === 'edit-fact' ? modal.fact : null}
        onSave={saveFact}
        onClose={closeModal}
      />
      <RuleDialog
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
