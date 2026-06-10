import { Button } from '@heroui/react/button';
import { Card } from '@heroui/react/card';
import { Label } from '@heroui/react/label';
import { NumberField } from '@heroui/react/number-field';
import { RadioGroup } from '@heroui/react/radio-group';
import { Radio } from '@heroui/react/radio';
import { ToggleButton } from '@heroui/react/toggle-button';
import { ToggleButtonGroup } from '@heroui/react/toggle-button-group';
import type { UserProfile, ExerciseType, DietStyle, StressLevel } from '../engine/types';

interface Props {
  profile: UserProfile;
  onChange: (p: UserProfile) => void;
  onBack: () => void;
  onAnalyze: () => void;
}

const EXERCISE_TYPES: { value: ExerciseType; label: string; desc: string }[] = [
  { value: 'sedentary', label: 'None / Sedentary',  desc: 'Desk job, little to no structured exercise' },
  { value: 'cardio',    label: 'Cardio',             desc: 'Running, cycling, swimming, or HIIT' },
  { value: 'strength',  label: 'Strength Training',  desc: 'Weightlifting or resistance-based workouts' },
  { value: 'mixed',     label: 'Mixed',              desc: 'Combination of cardio and strength training' },
];

const DIET_STYLES: { value: DietStyle; label: string; desc: string }[] = [
  { value: 'omnivore',    label: 'Omnivore',    desc: 'Eats both plant and animal foods' },
  { value: 'vegetarian',  label: 'Vegetarian',  desc: 'No meat or fish; dairy and eggs are OK' },
  { value: 'vegan',       label: 'Vegan',       desc: 'Entirely plant-based, no animal products' },
  { value: 'pescatarian', label: 'Pescatarian', desc: 'No red meat or poultry; fish is OK' },
];

const STRESS_LEVELS: { value: StressLevel; label: string; desc: string }[] = [
  { value: 'low',      label: 'Low',      desc: 'Generally calm, manageable workload' },
  { value: 'moderate', label: 'Moderate', desc: 'Regular daily stress, well managed' },
  { value: 'high',     label: 'High',     desc: 'Persistent high stress affecting energy or sleep' },
];

export function Step3({ profile, onChange, onBack, onAnalyze }: Props) {
  const set = (key: keyof UserProfile, val: unknown) =>
    onChange({ ...profile, [key]: val });

  return (
    <Card className="w-full max-w-lg mx-auto">
      <Card.Header className="pb-2">
        <Card.Title className="text-xl font-bold text-gray-900">Lifestyle &amp; Preferences</Card.Title>
        <Card.Description className="text-sm text-gray-600">
          Help us personalize your plan with your daily habits and diet preferences.
        </Card.Description>
      </Card.Header>

      <Card.Content className="space-y-6">

        {/* Exercise type */}
        <RadioGroup
          value={profile.exercise_type}
          onChange={(val) => set('exercise_type', val as ExerciseType)}
        >
          <Label className="text-sm font-semibold text-gray-700">Exercise Type</Label>
          {EXERCISE_TYPES.map(({ value, label, desc }) => (
            <Radio key={value} value={value}>
              <Radio.Control><Radio.Indicator /></Radio.Control>
              <Radio.Content>
                <span className="font-medium text-gray-800">{label}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{desc}</span>
              </Radio.Content>
            </Radio>
          ))}
        </RadioGroup>

        {/* Exercise days */}
        <NumberField
          minValue={0}
          maxValue={7}
          value={profile.exercise_days}
          onChange={(v) => set('exercise_days', isNaN(v) ? 0 : v)}
          fullWidth
        >
          <Label className="text-sm font-medium text-gray-700">Exercise Days per Week</Label>
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input placeholder="0" />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>

        {/* Sleep hours */}
        <NumberField
          minValue={3}
          maxValue={14}
          value={profile.sleep_hours}
          onChange={(v) => set('sleep_hours', isNaN(v) ? 7 : v)}
          fullWidth
        >
          <Label className="text-sm font-medium text-gray-700">Sleep Hours per Night</Label>
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input placeholder="7" />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>

        {/* Meals per day */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">Meals per Day</span>
          <ToggleButtonGroup
            selectionMode="single"
            selectedKeys={new Set([String(profile.meals_per_day)])}
            onSelectionChange={(keys) => {
              const val = [...keys][0] as string;
              if (val) set('meals_per_day', parseInt(val));
            }}
          >
            {['2', '3', '4', '5'].map((n) => (
              <ToggleButton key={n} id={n} className="flex-1">{n}</ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>

        {/* Eats breakfast */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">Do you eat breakfast?</span>
          <ToggleButtonGroup
            selectionMode="single"
            selectedKeys={new Set([profile.eats_breakfast ? 'yes' : 'no'])}
            onSelectionChange={(keys) => {
              const val = [...keys][0] as string;
              if (val) set('eats_breakfast', val === 'yes');
            }}
          >
            <ToggleButton id="yes" className="flex-1">Yes</ToggleButton>
            <ToggleButton id="no" className="flex-1">No</ToggleButton>
          </ToggleButtonGroup>
        </div>

        {/* Diet style */}
        <RadioGroup
          value={profile.diet_style}
          onChange={(val) => set('diet_style', val as DietStyle)}
        >
          <Label className="text-sm font-semibold text-gray-700">Dietary Style</Label>
          {DIET_STYLES.map(({ value, label, desc }) => (
            <Radio key={value} value={value}>
              <Radio.Control><Radio.Indicator /></Radio.Control>
              <Radio.Content>
                <span className="font-medium text-gray-800">{label}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{desc}</span>
              </Radio.Content>
            </Radio>
          ))}
        </RadioGroup>

        {/* Stress level */}
        <RadioGroup
          value={profile.stress_level}
          onChange={(val) => set('stress_level', val as StressLevel)}
        >
          <Label className="text-sm font-semibold text-gray-700">Current Stress Level</Label>
          {STRESS_LEVELS.map(({ value, label, desc }) => (
            <Radio key={value} value={value}>
              <Radio.Control><Radio.Indicator /></Radio.Control>
              <Radio.Content>
                <span className="font-medium text-gray-800">{label}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{desc}</span>
              </Radio.Content>
            </Radio>
          ))}
        </RadioGroup>

      </Card.Content>

      <Card.Footer className="flex justify-between pt-2">
        <Button variant="ghost" size="lg" onPress={onBack}>Back</Button>
        <Button
          variant="primary"
          size="lg"
          onPress={onAnalyze}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Analyze
        </Button>
      </Card.Footer>
    </Card>
  );
}
