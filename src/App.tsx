import { useState, useEffect } from 'react';
import { runInference } from './engine/inferenceEngine';
import AdminPage from './admin/AdminPage';
import { DIET_FOODS } from './engine/foods';
import type {
  UserProfile,
  ActivityLevel,
  Gender,
  Goal,
  MedicalCondition,
  InferenceResult,
  DietType,
} from './engine/types';
import './App.css';

// ── Default form state ────────────────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = {
  age: 0,
  gender: 'male',
  weight_kg: 0,
  height_cm: 0,
  activity_level: 'moderate',
  medical_conditions: [],
  allergies: [],
  goal: 'maintain',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function bmiColor(cat: string) {
  if (cat === 'Underweight') return 'badge-blue';
  if (cat === 'Normal') return 'badge-green';
  if (cat === 'Overweight') return 'badge-yellow';
  return 'badge-red';
}

function dietColor(diet: DietType) {
  if (diet === 'DASH') return 'badge-blue';
  if (diet === 'Low-GI') return 'badge-purple';
  return 'badge-green';
}

function formatFactValue(val: unknown): string {
  if (Array.isArray(val)) return `[${val.slice(0, 2).join(', ')}${val.length > 2 ? `, …+${val.length - 2}` : ''}]`;
  return String(val);
}

// ── Step 1: Personal Profile ──────────────────────────────────────────────────

interface Step1Props {
  profile: UserProfile;
  onChange: (p: UserProfile) => void;
  onNext: () => void;
}

function Step1({ profile, onChange, onNext }: Step1Props) {
  const set = (key: keyof UserProfile, val: unknown) =>
    onChange({ ...profile, [key]: val });

  const valid =
    profile.age > 0 && profile.age <= 120 &&
    profile.weight_kg > 0 && profile.weight_kg <= 500 &&
    profile.height_cm > 0 && profile.height_cm <= 300;

  return (
    <div className="card">
      <h2 className="card-title">Personal Profile</h2>
      <p className="card-subtitle">Enter your basic measurements so we can calculate your biometrics.</p>

      <div className="form-row">
        <div className="field">
          <label>Age</label>
          <input
            type="number"
            min={1} max={120}
            placeholder="e.g. 30"
            value={profile.age || ''}
            onChange={(e) => set('age', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="field">
          <label>Gender</label>
          <div className="toggle-group">
            {(['male', 'female'] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                className={`toggle-btn ${profile.gender === g ? 'active' : ''}`}
                onClick={() => set('gender', g)}
              >
                {g === 'male' ? 'Male' : 'Female'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label>Weight (kg)</label>
          <input
            type="number"
            min={1} max={500}
            placeholder="e.g. 70"
            value={profile.weight_kg || ''}
            onChange={(e) => set('weight_kg', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="field">
          <label>Height (cm)</label>
          <input
            type="number"
            min={1} max={300}
            placeholder="e.g. 170"
            value={profile.height_cm || ''}
            onChange={(e) => set('height_cm', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="field">
        <label>Daily Activity Level</label>
        <select
          value={profile.activity_level}
          onChange={(e) => set('activity_level', e.target.value as ActivityLevel)}
        >
          <option value="sedentary">Sedentary — little or no exercise</option>
          <option value="light">Light — 1–3 days/week exercise</option>
          <option value="moderate">Moderate — 3–5 days/week exercise</option>
          <option value="active">Active — 6–7 days/week exercise</option>
          <option value="very_active">Very Active — physical job or 2× training/day</option>
        </select>
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" disabled={!valid} onClick={onNext}>
          Next: Health Info →
        </button>
      </div>
    </div>
  );
}

// ── Step 2: Health & Goal ─────────────────────────────────────────────────────

interface Step2Props {
  profile: UserProfile;
  onChange: (p: UserProfile) => void;
  onBack: () => void;
  onAnalyze: () => void;
}

function Step2({ profile, onChange, onBack, onAnalyze }: Step2Props) {
  const toggleMedical = (cond: MedicalCondition) => {
    const list = profile.medical_conditions.includes(cond)
      ? profile.medical_conditions.filter((c) => c !== cond)
      : [...profile.medical_conditions, cond];
    onChange({ ...profile, medical_conditions: list });
  };

  const toggleAllergy = (a: string) => {
    const list = profile.allergies.includes(a)
      ? profile.allergies.filter((x) => x !== a)
      : [...profile.allergies, a];
    onChange({ ...profile, allergies: list });
  };

  return (
    <div className="card">
      <h2 className="card-title">Health Information</h2>
      <p className="card-subtitle">This helps the engine apply the right medical and dietary rules.</p>

      <div className="field">
        <label>Medical Conditions</label>
        <div className="checkbox-group">
          {(['hypertension', 'diabetes'] as MedicalCondition[]).map((c) => (
            <label key={c} className="checkbox-label">
              <input
                type="checkbox"
                checked={profile.medical_conditions.includes(c)}
                onChange={() => toggleMedical(c)}
              />
              <span>{c === 'hypertension' ? 'Hypertension (High Blood Pressure)' : 'Diabetes (Type 1 or 2)'}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Food Allergies / Intolerances</label>
        <div className="checkbox-group">
          {['nuts', 'lactose', 'gluten', 'seafood', 'eggs'].map((a) => (
            <label key={a} className="checkbox-label">
              <input
                type="checkbox"
                checked={profile.allergies.includes(a)}
                onChange={() => toggleAllergy(a)}
              />
              <span>{a.charAt(0).toUpperCase() + a.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Your Goal</label>
        <div className="radio-group">
          {([
            ['lose_weight', 'Lose Weight', 'Calorie deficit to reduce body fat'],
            ['maintain', 'Maintain Weight', 'Keep current weight and improve diet quality'],
            ['gain_weight', 'Gain Weight', 'Calorie surplus to build muscle mass'],
          ] as [Goal, string, string][]).map(([val, label, desc]) => (
            <label key={val} className={`radio-card ${profile.goal === val ? 'active' : ''}`}>
              <input
                type="radio"
                name="goal"
                value={val}
                checked={profile.goal === val}
                onChange={() => onChange({ ...profile, goal: val })}
              />
              <div>
                <span className="radio-label">{label}</span>
                <span className="radio-desc">{desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" onClick={onAnalyze}>Analyze Diet →</button>
      </div>
    </div>
  );
}

// ── Step 3: Results Dashboard ─────────────────────────────────────────────────

interface Step3Props {
  result: InferenceResult;
  onReset: () => void;
}

function Step3({ result, onReset }: Step3Props) {
  const [showTrace, setShowTrace] = useState(false);
  const { facts, trace } = result;
  const dietType = facts.diet_type as DietType;
  const avoidFoods = dietType ? DIET_FOODS[dietType]?.avoid ?? [] : [];

  const carbPct  = facts.target_calories ? Math.round(((facts.carb_g ?? 0) * 4 / facts.target_calories) * 100) : 0;
  const protPct  = facts.target_calories ? Math.round(((facts.protein_g ?? 0) * 4 / facts.target_calories) * 100) : 0;
  const fatPct   = facts.target_calories ? Math.round(((facts.fat_g ?? 0) * 9 / facts.target_calories) * 100) : 0;

  return (
    <div className="results">
      <div className="results-header">
        <h2>Your Personalized Diet Plan</h2>
        <p>Generated by NutriChain Forward Chaining Engine — {trace.length} inference steps</p>
      </div>

      {/* Biometric cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">BMI</span>
          <span className="stat-value">{facts.bmi}</span>
          {facts.bmi_category && (
            <span className={`badge ${bmiColor(facts.bmi_category)}`}>{facts.bmi_category}</span>
          )}
        </div>
        <div className="stat-card">
          <span className="stat-label">BMR</span>
          <span className="stat-value">{facts.bmr}</span>
          <span className="stat-unit">kcal/day (rest)</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">TDEE</span>
          <span className="stat-value">{facts.tdee}</span>
          <span className="stat-unit">kcal/day (active)</span>
        </div>
        <div className="stat-card highlight">
          <span className="stat-label">Target Calories</span>
          <span className="stat-value">{facts.target_calories}</span>
          <span className="stat-unit">kcal/day</span>
        </div>
      </div>

      {/* Diet type & constraints */}
      <div className="card">
        <div className="diet-header">
          <div>
            <h3>Diet Type</h3>
            {dietType && <span className={`badge badge-lg ${dietColor(dietType)}`}>{dietType} Diet</span>}
          </div>
          <div className="diet-constraints">
            {facts.sodium_limit_mg && (
              <div className="constraint">
                <span className="constraint-label">Sodium Limit</span>
                <span className="constraint-value">{facts.sodium_limit_mg} mg/day</span>
              </div>
            )}
            {facts.carb_limit_pct && (
              <div className="constraint">
                <span className="constraint-label">Carb Limit</span>
                <span className="constraint-value">≤ {facts.carb_limit_pct}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Macro bar */}
        {facts.carb_g && (
          <div className="macros">
            <h3>Daily Macronutrients</h3>
            <div className="macro-bar-wrap">
              <div className="macro-bar">
                <div className="macro-seg carb" style={{ width: `${carbPct}%` }} title={`Carbs ${carbPct}%`} />
                <div className="macro-seg prot" style={{ width: `${protPct}%` }} title={`Protein ${protPct}%`} />
                <div className="macro-seg fat"  style={{ width: `${fatPct}%`  }} title={`Fat ${fatPct}%`} />
              </div>
              <div className="macro-legend">
                <span className="legend-dot carb-dot" /> Carbs {facts.carb_g}g ({carbPct}%)
                <span className="legend-dot prot-dot" /> Protein {facts.protein_g}g ({protPct}%)
                <span className="legend-dot fat-dot"  /> Fat {facts.fat_g}g ({fatPct}%)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Food lists */}
      <div className="food-grid">
        <div className="card food-card">
          <h3 className="food-title food-title-green">Recommended Foods</h3>
          <ul className="food-list">
            {(facts.recommended_foods ?? []).map((f, i) => (
              <li key={i}><span className="food-icon">✓</span>{f}</li>
            ))}
          </ul>
        </div>

        <div className="card food-card">
          <h3 className="food-title food-title-red">Foods to Avoid</h3>
          <ul className="food-list">
            {avoidFoods.map((f, i) => (
              <li key={i}><span className="food-icon avoid">✕</span>{f}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Allergen blacklist */}
      {(facts.blacklisted_foods ?? []).length > 0 && (
        <div className="card">
          <h3 className="food-title food-title-orange">Allergen Blacklist</h3>
          <p className="card-subtitle">These items are eliminated from your plan based on declared allergies.</p>
          <ul className="food-list two-col">
            {(facts.blacklisted_foods ?? []).map((f, i) => (
              <li key={i}><span className="food-icon avoid">⊘</span>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Inference trace */}
      <div className="card trace-section">
        <button
          className="trace-toggle"
          onClick={() => setShowTrace((v) => !v)}
        >
          <span>{showTrace ? '▼' : '▶'} Inference Trace</span>
          <span className="trace-badge">{trace.length} iterations</span>
        </button>

        {showTrace && (
          <div className="trace-table-wrap">
            <table className="trace-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Rule Fired</th>
                  <th>Description</th>
                  <th>New Facts Asserted</th>
                  <th>Conflict Set Size</th>
                </tr>
              </thead>
              <tbody>
                {trace.map((entry) => (
                  <tr key={entry.iteration}>
                    <td className="iter-cell">{entry.iteration}</td>
                    <td className="rule-cell">{entry.rule_fired}</td>
                    <td>{entry.rule_description}</td>
                    <td className="facts-cell">
                      {Object.entries(entry.new_facts).map(([k, v]) => (
                        <div key={k}>
                          <code>{k}</code> = <code>{formatFactValue(v)}</code>
                        </div>
                      ))}
                    </td>
                    <td className="center-cell">{entry.conflict_set.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onReset}>← Start Over</button>
      </div>
    </div>
  );
}

// ── Progress indicator ────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const steps = ['Profile', 'Health Info', 'Results'];
  return (
    <div className="progress-bar">
      {steps.map((label, i) => (
        <div key={i} className={`progress-step ${i + 1 <= step ? 'done' : ''} ${i + 1 === step ? 'current' : ''}`}>
          <div className="progress-circle">{i + 1 < step ? '✓' : i + 1}</div>
          <span className="progress-label">{label}</span>
          {i < steps.length - 1 && <div className={`progress-connector ${i + 1 < step ? 'filled' : ''}`} />}
        </div>
      ))}
    </div>
  );
}

// ── App root ──────────────────────────────────────────────────────────────────

export default function App() {
  const [hash, setHash]     = useState(window.location.hash);
  const [step, setStep]     = useState(1);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [result, setResult] = useState<InferenceResult | null>(null);

  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  if (hash === '#/admin') return <AdminPage />;

  function handleAnalyze() {
    const res = runInference({ ...profile });
    setResult(res);
    setStep(3);
  }

  function handleReset() {
    setProfile(DEFAULT_PROFILE);
    setResult(null);
    setStep(1);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">🌿</span>
          <span className="logo-text">NutriChain</span>
        </div>
        <p className="header-sub">AI-Powered Dietary Recommendation via Forward Chaining</p>
      </header>

      <main className="app-main">
        <ProgressBar step={step} />

        {step === 1 && (
          <Step1 profile={profile} onChange={setProfile} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <Step2
            profile={profile}
            onChange={setProfile}
            onBack={() => setStep(1)}
            onAnalyze={handleAnalyze}
          />
        )}
        {step === 3 && result && (
          <Step3 result={result} onReset={handleReset} />
        )}
      </main>

      <footer className="app-footer">
        NutriChain — Expert System using Forward Chaining &nbsp;|&nbsp; For educational purposes only
      </footer>
    </div>
  );
}
