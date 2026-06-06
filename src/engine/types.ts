export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Gender = 'male' | 'female';
export type Goal = 'lose_weight' | 'maintain' | 'gain_weight';
export type MedicalCondition = 'hypertension' | 'diabetes';
export type BMICategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
export type DietType = 'DASH' | 'Low-GI' | 'Balanced';

export interface UserProfile {
  age: number;
  gender: Gender;
  weight_kg: number;
  height_cm: number;
  activity_level: ActivityLevel;
  medical_conditions: MedicalCondition[];
  allergies: string[];
  goal: Goal;
}

export interface Facts {
  // Input facts
  age?: number;
  gender?: Gender;
  weight_kg?: number;
  height_cm?: number;
  activity_level?: ActivityLevel;
  medical_conditions?: MedicalCondition[];
  allergies?: string[];
  goal?: Goal;

  // Derived biometric facts
  bmi?: number;
  bmi_category?: BMICategory;
  bmr?: number;
  tdee?: number;
  target_calories?: number;

  // Diet facts
  diet_type?: DietType;
  sodium_limit_mg?: number;
  carb_limit_pct?: number;
  protein_pct?: number;
  fat_pct?: number;

  // Macros in grams
  carb_g?: number;
  fat_g?: number;
  protein_g?: number;

  // Food lists
  blacklisted_foods?: string[];
  recommended_foods?: string[];
}

export interface Rule {
  id: string;
  description: string;
  salience: number;
  condition: (facts: Facts) => boolean;
  action: (facts: Facts) => Partial<Facts>;
}

export interface TraceEntry {
  iteration: number;
  conflict_set: string[];
  rule_fired: string;
  rule_description: string;
  new_facts: Record<string, unknown>;
}

export interface InferenceResult {
  facts: Facts;
  trace: TraceEntry[];
}
