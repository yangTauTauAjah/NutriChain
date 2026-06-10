import { Button } from '@heroui/react/button';
import { Card } from '@heroui/react/card';
import { Chip } from '@heroui/react/chip';
import { Disclosure } from '@heroui/react/disclosure';
import { Table } from '@heroui/react/table';
import { DIET_FOODS } from '../engine/foods';
import type { InferenceResult, DietType, BMICategory, ExerciseType, DietStyle } from '../engine/types';

interface Props {
  result: InferenceResult;
  onReset: () => void;
}

const BMI_COLOR: Record<BMICategory, 'default' | 'success' | 'warning' | 'danger'> = {
  Underweight: 'default',
  Normal:      'success',
  Overweight:  'warning',
  Obese:       'danger',
};

const DIET_COLOR: Partial<Record<DietType, 'default' | 'success' | 'warning' | 'danger' | 'accent'>> = {
  DASH:     'default',
  'Low-GI': 'accent',
};

const DIET_STYLE_LABELS: Record<DietStyle, string> = {
  omnivore:    'Omnivore',
  vegetarian:  'Vegetarian',
  vegan:       'Vegan',
  pescatarian: 'Pescatarian',
};

const EXERCISE_LABELS: Record<ExerciseType, string> = {
  sedentary: 'Sedentary',
  cardio:    'Cardio',
  strength:  'Strength Training',
  mixed:     'Mixed Training',
};

function formatFactValue(val: unknown): string {
  if (Array.isArray(val))
    return `[${val.slice(0, 2).join(', ')}${val.length > 2 ? `, …+${val.length - 2}` : ''}]`;
  return String(val);
}

type AdviceLevel = 'success' | 'warning' | 'danger';

interface AdviceItem {
  level: AdviceLevel;
  label: string;
  badge: string;
  text: string;
}

const ADVICE_STYLES: Record<AdviceLevel, { border: string; bg: string; label: string; chip: 'success' | 'warning' | 'danger' }> = {
  success: { border: 'border-l-green-400',  bg: 'bg-green-50',  label: 'text-green-700',  chip: 'success' },
  warning: { border: 'border-l-amber-400',  bg: 'bg-amber-50',  label: 'text-amber-700',  chip: 'warning' },
  danger:  { border: 'border-l-red-400',    bg: 'bg-red-50',    label: 'text-red-700',    chip: 'danger'  },
};

function getSleepAdvice(hours?: number): AdviceItem | null {
  if (hours === undefined) return null;
  const badge = `${hours}h/night`;
  if (hours < 6) return { level: 'danger',  label: 'Sleep', badge, text: `${hours} hours is below the safe minimum. Chronic sleep restriction elevates cortisol and ghrelin, increasing hunger and reducing fat-burning efficiency. Prioritize getting 7–9 hours — it's as important as diet for body composition.` };
  if (hours < 7) return { level: 'warning', label: 'Sleep', badge, text: `You're slightly under the recommended 7–9 hours. Even one extra hour can meaningfully improve energy, recovery, and appetite regulation. Try a consistent bedtime routine.` };
  if (hours <= 9) return { level: 'success', label: 'Sleep', badge, text: `You're in the optimal sleep range. Consistent 7–9 hours supports muscle recovery, balanced hunger hormones, and efficient metabolism — keep it up.` };
  return { level: 'warning', label: 'Sleep', badge, text: `Sleeping more than 9 hours regularly can sometimes indicate under-recovery or other health factors. Aim to align sleep with consistent wake times rather than compensating with extra hours.` };
}

function getExerciseAdvice(type?: ExerciseType, days?: number, proteinBoosted?: boolean): AdviceItem | null {
  if (!type) return null;
  const d = days ?? 0;
  const dayStr = d === 1 ? '1 day/week' : `${d} days/week`;
  const protNote = proteinBoosted ? ' Your protein target has been increased by 20% to support muscle repair.' : '';

  if (type === 'sedentary') return {
    level: 'warning', label: 'Exercise', badge: 'Sedentary',
    text: 'No structured exercise detected. Starting with 3× 20-minute brisk walks per week can improve insulin sensitivity and gradually raise your TDEE. Even small increases in daily movement add up significantly.',
  };
  if (type === 'cardio') {
    if (d === 0 || d < 3) return { level: 'warning', label: 'Exercise', badge: dayStr, text: `You're doing cardio but ${d === 0 ? 'logging 0 active days' : `only ${dayStr}`}. Aim for 3–5 sessions of 30–45 min to meet cardiovascular health guidelines and meaningfully impact your calorie balance.` };
    if (d > 6) return { level: 'warning', label: 'Exercise', badge: dayStr, text: `Training 7 days/week without rest raises injury and overtraining risk. Schedule at least 1 full rest day and 1 low-intensity day to allow systemic recovery.` };
    return { level: 'success', label: 'Exercise', badge: dayStr, text: `Strong cardio consistency. Mix 2–3 moderate steady-state sessions (60–70% max HR) with 1 HIIT session per week for the best cardiovascular and metabolic return.` };
  }
  if (type === 'strength') {
    if (d === 0 || d < 3) return { level: 'warning', label: 'Exercise', badge: dayStr, text: `Strength training ${d === 0 ? '0 days' : dayStr} limits hypertrophy stimulus. Progress toward 3–4 sessions/week with progressive overload (adding weight or reps each week).${protNote}` };
    if (d > 5) return { level: 'warning', label: 'Exercise', badge: dayStr, text: `High-frequency strength training requires careful recovery management. Ensure muscle groups have 48 h between sessions, prioritize sleep, and hit your protein target.${protNote}` };
    return { level: 'success', label: 'Exercise', badge: dayStr, text: `Solid strength routine. Focus on progressive overload — log your lifts and aim to add volume or weight each session.${protNote}` };
  }
  if (type === 'mixed') {
    if (d < 3) return { level: 'warning', label: 'Exercise', badge: dayStr, text: `Mixed training at ${dayStr} is a good foundation. Aim for 4–5 sessions with alternating cardio and strength days.${protNote}` };
    return { level: 'success', label: 'Exercise', badge: dayStr, text: `Excellent balanced approach. Alternate cardio and strength days to let muscle groups recover, and use your rest days for active recovery like stretching or walking.${protNote}` };
  }
  return null;
}

function getMealAdvice(meals?: number, breakfast?: boolean, stressLevel?: string): AdviceItem | null {
  if (meals === undefined) return null;
  const parts: string[] = [];

  if (breakfast === false) {
    parts.push('Skipping breakfast can amplify mid-morning hunger and lead to overeating later. A small protein-rich breakfast (eggs, Greek yogurt, or a protein shake) helps regulate ghrelin and sustain focus.');
  }
  if (meals <= 2) {
    parts.push(`Eating only ${meals} meals a day makes hitting your calorie and macro targets harder without overeating in one sitting. Consider adding 1–2 small snacks (e.g. nuts, cottage cheese, fruit + protein) to spread intake more evenly.`);
  } else if (meals === 3) {
    parts.push('Three meals is a solid foundation. If you notice afternoon energy dips, a protein-rich snack (20–30 g) between lunch and dinner can maintain blood sugar and reduce evening overeating.');
  } else {
    parts.push(`${meals} meals/day is excellent for steady blood sugar, sustained energy, and muscle protein synthesis. Keep each meal balanced with protein, complex carbs, and healthy fats.`);
  }
  if (stressLevel === 'high') {
    parts.push('With elevated stress levels, prioritize magnesium-rich foods (dark leafy greens, nuts, seeds) and limit caffeine after midday to support cortisol regulation.');
  }
  return {
    level: meals >= 3 && breakfast !== false ? 'success' : 'warning',
    label: 'Meal Timing',
    badge: `${meals} meals/day`,
    text: parts.join(' '),
  };
}

export function Step4({ result, onReset }: Props) {
  const { facts, trace } = result;
  const dietType = facts.diet_type as DietType | undefined;
  const avoidFoods = dietType ? (DIET_FOODS[dietType]?.avoid ?? []) : [];

  const carbPct = facts.target_calories
    ? Math.round(((facts.carb_g ?? 0) * 4 / facts.target_calories) * 100) : 0;
  const protPct = facts.target_calories
    ? Math.round(((facts.protein_g ?? 0) * 4 / facts.target_calories) * 100) : 0;
  const fatPct = facts.target_calories
    ? Math.round(((facts.fat_g ?? 0) * 9 / facts.target_calories) * 100) : 0;

  const hasLifestyleFactors =
    (facts.diet_style && facts.diet_style !== 'omnivore') ||
    (facts.exercise_type && facts.exercise_type !== 'sedentary') ||
    (facts.sleep_hours !== undefined && facts.sleep_hours < 6) ||
    facts.stress_level === 'high';

  const proteinBoosted =
    facts.exercise_type === 'strength' || facts.exercise_type === 'mixed';

  const adviceItems: AdviceItem[] = [
    getSleepAdvice(facts.sleep_hours),
    getExerciseAdvice(facts.exercise_type as ExerciseType | undefined, facts.exercise_days, proteinBoosted),
    getMealAdvice(facts.meals_per_day, facts.eats_breakfast, facts.stress_level),
  ].filter((x): x is AdviceItem => x !== null);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Page header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Your Personalized Diet Plan</h2>
        <p className="text-gray-500 text-sm mt-1">
          Generated by NutriChain Forward Chaining Engine — {trace.length} inference steps
        </p>
      </div>

      {/* Biometric stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="text-center p-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">BMI</span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block">{facts.bmi}</span>
          {facts.bmi_category && (
            <Chip size="sm" color={BMI_COLOR[facts.bmi_category]} className="mt-2">
              {facts.bmi_category}
            </Chip>
          )}
        </Card>

        <Card className="text-center p-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">BMR</span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block">{facts.bmr}</span>
          <span className="text-xs text-gray-400 mt-1 block">kcal/day (rest)</span>
        </Card>

        <Card className="text-center p-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">TDEE</span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block">{facts.tdee}</span>
          <span className="text-xs text-gray-400 mt-1 block">kcal/day (active)</span>
        </Card>

        <Card className="text-center p-4 border-green-300 bg-green-50">
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Target ★</span>
          <span className="text-2xl font-bold text-green-800 mt-1 block">{facts.target_calories}</span>
          <span className="text-xs text-green-600 mt-1 block">kcal/day</span>
        </Card>
      </div>

      {/* Lifestyle factors applied */}
      {hasLifestyleFactors && (
        <Card>
          <Card.Content>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Lifestyle Factors Applied</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
              {facts.diet_style && facts.diet_style !== 'omnivore' && (
                <span>
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 align-middle" />
                  <span className="font-medium">Diet style:</span> {DIET_STYLE_LABELS[facts.diet_style]}
                </span>
              )}
              {facts.exercise_type && facts.exercise_type !== 'sedentary' && (
                <span>
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5 align-middle" />
                  <span className="font-medium">Exercise:</span> {EXERCISE_LABELS[facts.exercise_type]}
                  {facts.exercise_days !== undefined && facts.exercise_days > 0 && (
                    <> ({facts.exercise_days}×/week)</>
                  )}
                </span>
              )}
              {facts.sleep_hours !== undefined && facts.sleep_hours < 6 && (
                <span>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5 align-middle" />
                  <span className="font-medium">Sleep deficit:</span> {facts.sleep_hours}h/night → −5% calories
                </span>
              )}
              {facts.stress_level === 'high' && (
                <span>
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5 align-middle" />
                  <span className="font-medium">High stress:</span> +5% calories
                </span>
              )}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Diet type + macros card */}
      <Card>
        <Card.Content className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-gray-700">Diet Type</h3>
              {dietType && (
                <Chip color={DIET_COLOR[dietType] ?? 'success'}>
                  {dietType} Diet
                </Chip>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {facts.sodium_limit_mg && (
                <span><span className="font-medium">Sodium:</span> {facts.sodium_limit_mg} mg/day</span>
              )}
              {facts.carb_limit_pct && (
                <span><span className="font-medium">Carb limit:</span> ≤ {facts.carb_limit_pct}%</span>
              )}
            </div>
          </div>

          {facts.carb_g && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-600">Daily Macronutrients</h3>
              <div className="h-4 rounded-full overflow-hidden flex bg-gray-100">
                <div className="bg-blue-400 h-full transition-all" style={{ width: `${carbPct}%` }} title={`Carbs ${carbPct}%`} />
                <div className="bg-green-500 h-full transition-all" style={{ width: `${protPct}%` }} title={`Protein ${protPct}%`} />
                <div className="bg-amber-400 h-full transition-all" style={{ width: `${fatPct}%` }} title={`Fat ${fatPct}%`} />
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-400 mr-1 align-middle" />
                  Carbs {facts.carb_g}g ({carbPct}%)
                </span>
                <span>
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1 align-middle" />
                  Protein {facts.protein_g}g ({protPct}%)
                </span>
                <span>
                  <span className="inline-block w-3 h-3 rounded-full bg-amber-400 mr-1 align-middle" />
                  Fat {facts.fat_g}g ({fatPct}%)
                </span>
              </div>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Food lists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <Card.Content>
            <h3 className="text-sm font-semibold text-green-700 mb-3">Recommended Foods</h3>
            <ul className="space-y-1.5">
              {(facts.recommended_foods ?? []).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-600 font-bold shrink-0">✓</span>{f}
                </li>
              ))}
            </ul>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <h3 className="text-sm font-semibold text-red-600 mb-3">Foods to Avoid</h3>
            <ul className="space-y-1.5">
              {avoidFoods.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-500 font-bold shrink-0">✕</span>{f}
                </li>
              ))}
            </ul>
          </Card.Content>
        </Card>
      </div>

      {/* Lifestyle advice */}
      {adviceItems.length > 0 && (
        <Card>
          <Card.Content>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Personalized Lifestyle Advice</h3>
            <div className="space-y-3">
              {adviceItems.map((item) => {
                const s = ADVICE_STYLES[item.level];
                return (
                  <div key={item.label} className={`border-l-4 ${s.border} ${s.bg} rounded-r-lg p-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold uppercase tracking-wide ${s.label}`}>{item.label}</span>
                      <Chip size="sm" color={s.chip}>{item.badge}</Chip>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Dietary restrictions (allergies + diet style) */}
      {(facts.blacklisted_foods ?? []).length > 0 && (
        <Card>
          <Card.Content>
            <h3 className="text-sm font-semibold text-amber-700 mb-1">Dietary Restrictions</h3>
            <p className="text-xs text-gray-500 mb-3">
              Eliminated from your plan based on your allergies and dietary style.
            </p>
            <ul className="grid grid-cols-2 gap-1.5">
              {(facts.blacklisted_foods ?? []).map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-amber-600 shrink-0">⊘</span>{f}
                </li>
              ))}
            </ul>
          </Card.Content>
        </Card>
      )}

      {/* Inference trace (Disclosure + Table) */}
      <Card>
        <Card.Content>
          <Disclosure>
            <Disclosure.Heading>
              <Disclosure.Trigger className="flex items-center justify-between w-full py-1 text-left font-semibold text-gray-700">
                <span>Inference Trace</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {trace.length} iterations
                  </span>
                  <Disclosure.Indicator />
                </div>
              </Disclosure.Trigger>
            </Disclosure.Heading>
            <Disclosure.Content className="mt-3">
              <Table className="table__scroll-container">
                <Table.Content aria-label="Inference trace" className="min-w-180 w-full text-sm">
                  <Table.Header>
                    <Table.Column className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">#</Table.Column>
                    <Table.Column className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Rule Fired</Table.Column>
                    <Table.Column className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Description</Table.Column>
                    <Table.Column className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">New Facts</Table.Column>
                    <Table.Column className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">CS</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {trace.map((entry) => (
                      <Table.Row key={entry.iteration} id={String(entry.iteration)} className="border-t border-gray-100 hover:bg-gray-50">
                        <Table.Cell className="py-2 px-3 text-gray-500 tabular-nums">{entry.iteration}</Table.Cell>
                        <Table.Cell className="py-2 px-3">
                          <code className="text-xs font-mono text-indigo-600">{entry.rule_fired}</code>
                        </Table.Cell>
                        <Table.Cell className="py-2 px-3 text-gray-600 text-xs max-w-xs">{entry.rule_description}</Table.Cell>
                        <Table.Cell className="py-2 px-3">
                          {Object.entries(entry.new_facts).map(([k, v]) => (
                            <div key={k} className="text-xs font-mono">
                              <span className="text-green-700">{k}</span>
                              {' = '}
                              <span className="text-gray-500">{formatFactValue(v)}</span>
                            </div>
                          ))}
                        </Table.Cell>
                        <Table.Cell className="py-2 px-3 text-center text-gray-500">{entry.conflict_set.length}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table>
            </Disclosure.Content>
          </Disclosure>
        </Card.Content>
      </Card>

      <div className="flex justify-start">
        <Button variant="ghost" size="lg" onPress={onReset}>Start Over</Button>
      </div>
    </div>
  );
}
