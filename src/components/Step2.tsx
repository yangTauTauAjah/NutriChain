import { Button } from '@heroui/react/button';
import { Card } from '@heroui/react/card';
import { Label } from '@heroui/react/label';
import { CheckboxGroup } from '@heroui/react/checkbox-group';
import { Checkbox } from '@heroui/react/checkbox';
import { RadioGroup } from '@heroui/react/radio-group';
import { Radio } from '@heroui/react/radio';
import type { UserProfile, MedicalCondition, Goal } from '../engine/types';

interface Props {
  profile: UserProfile;
  onChange: (p: UserProfile) => void;
  onBack: () => void;
  onAnalyze: () => void;
}

const MEDICAL_CONDITIONS: { value: MedicalCondition; label: string }[] = [
  { value: 'hypertension', label: 'Hypertension (High Blood Pressure)' },
  { value: 'diabetes',     label: 'Diabetes (Type 1 or 2)' },
];

const ALLERGIES = ['nuts', 'lactose', 'gluten', 'seafood', 'eggs'];

const GOALS: { value: Goal; label: string; desc: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight',     desc: 'Calorie deficit to reduce body fat' },
  { value: 'maintain',    label: 'Maintain Weight', desc: 'Keep current weight and improve diet quality' },
  { value: 'gain_weight', label: 'Gain Weight',     desc: 'Calorie surplus to build muscle mass' },
];

export function Step2({ profile, onChange, onBack, onAnalyze }: Props) {
  return (
    <Card className="w-full max-w-lg mx-auto">
      <Card.Header className="pb-2">
        <Card.Title className="text-xl font-bold text-gray-900">Health Information</Card.Title>
        <Card.Description className="text-sm text-gray-600">
          This helps the engine apply the right medical and dietary rules.
        </Card.Description>
      </Card.Header>

      <Card.Content className="space-y-6">
        <CheckboxGroup
          value={profile.medical_conditions}
          onChange={(vals) => onChange({ ...profile, medical_conditions: vals as MedicalCondition[] })}
        >
          <Label className="text-sm font-semibold text-gray-700">Medical Conditions</Label>
          {MEDICAL_CONDITIONS.map(({ value, label }) => (
            <Checkbox key={value} value={value}>
              <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
              <Checkbox.Content>{label}</Checkbox.Content>
            </Checkbox>
          ))}
        </CheckboxGroup>

        <CheckboxGroup
          value={profile.allergies}
          onChange={(vals) => onChange({ ...profile, allergies: vals })}
        >
          <Label className="text-sm font-semibold text-gray-700">Food Allergies / Intolerances</Label>
          <div className="grid grid-cols-2 gap-y-1">
            {ALLERGIES.map((a) => (
              <Checkbox key={a} value={a}>
                <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                <Checkbox.Content>{a.charAt(0).toUpperCase() + a.slice(1)}</Checkbox.Content>
              </Checkbox>
            ))}
          </div>
        </CheckboxGroup>

        <RadioGroup
          value={profile.goal}
          onChange={(val) => onChange({ ...profile, goal: val as Goal })}
        >
          <Label className="text-sm font-semibold text-gray-700">Your Goal</Label>
          {GOALS.map(({ value, label, desc }) => (
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
          Next
        </Button>
      </Card.Footer>
    </Card>
  );
}
