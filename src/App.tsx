import { useState, useEffect } from 'react';
import { runInference } from './engine/inferenceEngine';
import AdminPage from './admin/AdminPage';
import type { UserProfile, InferenceResult } from './engine/types';
import { ProgressStepper } from './components/ProgressStepper';
import { Step1 } from './components/Step1';
import { Step2 } from './components/Step2';
import { Step3 } from './components/Step3';
import { Step4 } from './components/Step4';

const DEFAULT_PROFILE: UserProfile = {
  age: 0,
  gender: 'male',
  weight_kg: 0,
  height_cm: 0,
  activity_level: 'moderate',
  medical_conditions: [],
  allergies: [],
  goal: 'maintain',
  exercise_type: 'sedentary',
  exercise_days: 0,
  sleep_hours: 7,
  diet_style: 'omnivore',
  meals_per_day: 3,
  eats_breakfast: true,
  stress_level: 'moderate',
};

export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [step, setStep] = useState(1);
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
    setStep(4);
  }

  function handleReset() {
    setProfile(DEFAULT_PROFILE);
    setResult(null);
    setStep(1);
  }

  return (
    <div className="app flex flex-col min-h-screen bg-gray-50">
      <header className="flex  gap-8 items-center bg-green-800 text-white px-6 py-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <span className="text-xl font-bold tracking-tight">NutriChain</span>
        </div>
        <p className="text-green-100 text-sm mt-0.5">
          AI-Powered Dietary Recommendation via Forward Chaining
        </p>
      </header>

      <main className="flex-1 px-4 py-8">
        <ProgressStepper step={step} />

        {step === 1 && (
          <Step1 profile={profile} onChange={setProfile} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <Step2
            profile={profile}
            onChange={setProfile}
            onBack={() => setStep(1)}
            onAnalyze={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3
            profile={profile}
            onChange={setProfile}
            onBack={() => setStep(2)}
            onAnalyze={handleAnalyze}
          />
        )}
        {step === 4 && result && (
          <Step4 result={result} onReset={handleReset} />
        )}
      </main>

      <footer className="bg-gray-800 text-gray-400 text-xs text-center py-3 shrink-0">
        NutriChain — Expert System using Forward Chaining | For educational purposes only
      </footer>
    </div>
  );
}
