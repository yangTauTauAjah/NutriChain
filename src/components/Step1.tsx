import { useMemo } from 'react';
import { Button } from '@heroui/react/button';
import { Card } from '@heroui/react/card';
import { Chip } from '@heroui/react/chip';
import { Label } from '@heroui/react/label';
import { NumberField } from '@heroui/react/number-field';
import { ToggleButton } from '@heroui/react/toggle-button';
import { ToggleButtonGroup } from '@heroui/react/toggle-button-group';
import { Select } from '@heroui/react/select';
import { ListBox } from '@heroui/react/list-box';
import { ListBoxItem } from '@heroui/react/list-box-item';
import { runInference } from '../engine/inferenceEngine';
import type { UserProfile, ActivityLevel, Gender, BMICategory } from '../engine/types';

interface Props {
  profile: UserProfile;
  onChange: (p: UserProfile) => void;
  onNext: () => void;
}

const ACTIVITY_OPTIONS: { id: ActivityLevel; label: string }[] = [
  { id: 'sedentary',   label: 'Sedentary — little or no exercise' },
  { id: 'light',       label: 'Light — 1–3 days/week exercise' },
  { id: 'moderate',    label: 'Moderate — 3–5 days/week exercise' },
  { id: 'active',      label: 'Active — 6–7 days/week exercise' },
  { id: 'very_active', label: 'Very Active — physical job or 2× training/day' },
];

const BMI_COLOR: Record<BMICategory, 'default' | 'success' | 'warning' | 'danger'> = {
  Underweight: 'default',
  Normal:      'success',
  Overweight:  'warning',
  Obese:       'danger',
};

export function Step1({ profile, onChange, onNext }: Props) {
  const set = (key: keyof UserProfile, val: unknown) =>
    onChange({ ...profile, [key]: val });

  const valid =
    profile.age > 0 && profile.age <= 120 &&
    profile.weight_kg > 0 && profile.weight_kg <= 500 &&
    profile.height_cm > 0 && profile.height_cm <= 300;

  const preview = useMemo(() => {
    if (!valid) return null;
    try { return runInference({ ...profile }).facts; } catch { return null; }
  }, [profile, valid]);

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="text-center p-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">BMI</span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block">{preview?.bmi || 'N/A'}</span>
          {preview?.bmi_category && (
            <Chip size="md" variant='primary' color={BMI_COLOR[preview.bmi_category]} className="mt-2">
              {preview.bmi_category}
            </Chip>
          )}
        </Card>

        <Card className="text-center p-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">BMR</span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block">{preview?.bmr|| 'N/A'}</span>
          <span className="text-xs text-gray-400 mt-1 block">kcal/day (rest)</span>
        </Card>

        <Card className="text-center p-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">TDEE</span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block">{preview?.tdee || 'N/A'}</span>
          <span className="text-xs text-gray-400 mt-1 block">kcal/day (active)</span>
        </Card>

        <Card className="text-center p-4 border-green-300 bg-green-50">
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Target ★</span>
          <span className="text-2xl font-bold text-green-800 mt-1 block">{preview?.target_calories || 'N/A'}</span>
          <span className="text-xs text-green-600 mt-1 block">kcal/day</span>
        </Card>
      </div>
      
      <Card className="w-full">
        <Card.Header className="pb-2">
          <Card.Title className="text-xl font-bold text-gray-900">Personal Profile</Card.Title>
          <Card.Description className="text-sm text-gray-600">
            Enter your basic measurements so we can calculate your biometrics.
          </Card.Description>
        </Card.Header>

        <Card.Content className="space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <NumberField
              minValue={1}
              maxValue={120}
              value={profile.age === 0 ? NaN : profile.age}
              onChange={(v) => set('age', isNaN(v) ? 0 : v)}
              fullWidth
            >
              <Label className="text-sm font-medium text-gray-700">Age</Label>
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input placeholder="e.g. 30" />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-gray-700">Gender</span>
              <ToggleButtonGroup
                selectionMode="single"
                selectedKeys={new Set([profile.gender])}
                onSelectionChange={(keys) => {
                  const val = [...keys][0] as Gender;
                  if (val) set('gender', val);
                }}
              >
                <ToggleButton id="male" className="flex-1">Male</ToggleButton>
                <ToggleButton id="female" className="flex-1">Female</ToggleButton>
              </ToggleButtonGroup>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumberField
              minValue={1}
              maxValue={500}
              value={profile.weight_kg === 0 ? NaN : profile.weight_kg}
              onChange={(v) => set('weight_kg', isNaN(v) ? 0 : v)}
              fullWidth
            >
              <Label className="text-sm font-medium text-gray-700">Weight (kg)</Label>
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input placeholder="e.g. 70" />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>

            <NumberField
              minValue={1}
              maxValue={300}
              value={profile.height_cm === 0 ? NaN : profile.height_cm}
              onChange={(v) => set('height_cm', isNaN(v) ? 0 : v)}
              fullWidth
            >
              <Label className="text-sm font-medium text-gray-700">Height (cm)</Label>
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input placeholder="e.g. 170" />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>
          </div>

          <Select
            selectedKey={profile.activity_level}
            onSelectionChange={(key) => set('activity_level', key as ActivityLevel)}
            fullWidth
          >
            <Label className="text-sm font-medium text-gray-700">Daily Activity Level</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {ACTIVITY_OPTIONS.map((opt) => (
                  <ListBoxItem key={opt.id} id={opt.id}>{opt.label}</ListBoxItem>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </Card.Content>

        <Card.Footer className="flex justify-end pt-2">
          <Button
            variant="primary"
            size="lg"
            isDisabled={!valid}
            onPress={onNext}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Next
          </Button>
        </Card.Footer>
      </Card>

    </div>
  );
}
