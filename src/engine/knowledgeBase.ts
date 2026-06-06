import type { Rule } from './types';
import { ALLERGEN_FOODS, DIET_FOODS } from './foods';

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const RULES: Rule[] = [
  // ── Salience 30: Safety / Allergy ─────────────────────────────────────────

  {
    id: 'R_Allergy_Nuts',
    description: 'Nut allergy → blacklist all nut-containing foods',
    salience: 30,
    condition: (f) => Array.isArray(f.allergies) && f.allergies.includes('nuts') && !f.blacklisted_foods?.some(x => x.includes('Peanuts')),
    action: () => ({ blacklisted_foods: ALLERGEN_FOODS.nuts }),
  },
  {
    id: 'R_Allergy_Lactose',
    description: 'Lactose allergy → blacklist dairy foods',
    salience: 30,
    condition: (f) => Array.isArray(f.allergies) && f.allergies.includes('lactose') && !f.blacklisted_foods?.some(x => x.includes('Milk')),
    action: () => ({ blacklisted_foods: ALLERGEN_FOODS.lactose }),
  },
  {
    id: 'R_Allergy_Gluten',
    description: 'Gluten allergy → blacklist gluten-containing foods',
    salience: 30,
    condition: (f) => Array.isArray(f.allergies) && f.allergies.includes('gluten') && !f.blacklisted_foods?.some(x => x.includes('Wheat')),
    action: () => ({ blacklisted_foods: ALLERGEN_FOODS.gluten }),
  },
  {
    id: 'R_Allergy_Seafood',
    description: 'Seafood allergy → blacklist all seafood',
    salience: 30,
    condition: (f) => Array.isArray(f.allergies) && f.allergies.includes('seafood') && !f.blacklisted_foods?.some(x => x.includes('Fish')),
    action: () => ({ blacklisted_foods: ALLERGEN_FOODS.seafood }),
  },
  {
    id: 'R_Allergy_Eggs',
    description: 'Egg allergy → blacklist egg-based foods',
    salience: 30,
    condition: (f) => Array.isArray(f.allergies) && f.allergies.includes('eggs') && !f.blacklisted_foods?.some(x => x.includes('Eggs')),
    action: () => ({ blacklisted_foods: ALLERGEN_FOODS.eggs }),
  },

  // ── Salience 21: Both conditions (higher than individual medical rules) ────

  {
    id: 'R_Both_Hypertension_Diabetes',
    description: 'Both hypertension & diabetes → DASH diet with reduced carbs',
    salience: 21,
    condition: (f) =>
      Array.isArray(f.medical_conditions) &&
      f.medical_conditions.includes('hypertension') &&
      f.medical_conditions.includes('diabetes') &&
      f.diet_type === undefined,
    action: () => ({
      diet_type: 'DASH' as const,
      sodium_limit_mg: 1500,
      carb_limit_pct: 45,
      protein_pct: 25,
      fat_pct: 30,
    }),
  },

  // ── Salience 20: Medical Condition Rules ──────────────────────────────────

  {
    id: 'R_Hypertension_Diet',
    description: 'Hypertension → assign DASH diet',
    salience: 20,
    condition: (f) =>
      Array.isArray(f.medical_conditions) &&
      f.medical_conditions.includes('hypertension') &&
      f.diet_type === undefined,
    action: () => ({ diet_type: 'DASH' as const }),
  },
  {
    id: 'R_Hypertension_Sodium',
    description: 'DASH diet → limit sodium to 1500 mg/day',
    salience: 20,
    condition: (f) => f.diet_type === 'DASH' && f.sodium_limit_mg === undefined,
    action: () => ({ sodium_limit_mg: 1500 }),
  },
  {
    id: 'R_Diabetes_Diet',
    description: 'Diabetes → assign Low-GI diet',
    salience: 20,
    condition: (f) =>
      Array.isArray(f.medical_conditions) &&
      f.medical_conditions.includes('diabetes') &&
      f.diet_type === undefined,
    action: () => ({ diet_type: 'Low-GI' as const }),
  },
  {
    id: 'R_Diabetes_Carb',
    description: 'Low-GI diet → carbs 40%, protein 30%, fat 30%',
    salience: 20,
    condition: (f) => f.diet_type === 'Low-GI' && f.carb_limit_pct === undefined,
    action: () => ({ carb_limit_pct: 40, protein_pct: 30, fat_pct: 30 }),
  },

  // ── Salience 10: Biometric Calculation Rules ──────────────────────────────

  {
    id: 'R_Compute_BMI',
    description: 'Compute BMI from weight and height',
    salience: 10,
    condition: (f) => f.weight_kg !== undefined && f.height_cm !== undefined && f.bmi === undefined,
    action: (f) => {
      const h = f.height_cm! / 100;
      return { bmi: parseFloat((f.weight_kg! / (h * h)).toFixed(1)) };
    },
  },
  {
    id: 'R_Classify_BMI',
    description: 'Classify BMI into Underweight / Normal / Overweight / Obese',
    salience: 10,
    condition: (f) => f.bmi !== undefined && f.bmi_category === undefined,
    action: (f) => {
      const bmi = f.bmi!;
      if (bmi < 18.5) return { bmi_category: 'Underweight' as const };
      if (bmi < 25)   return { bmi_category: 'Normal' as const };
      if (bmi < 30)   return { bmi_category: 'Overweight' as const };
      return { bmi_category: 'Obese' as const };
    },
  },
  {
    id: 'R_Compute_BMR',
    description: 'Compute BMR using Mifflin-St Jeor formula',
    salience: 10,
    condition: (f) =>
      f.age !== undefined && f.gender !== undefined &&
      f.weight_kg !== undefined && f.height_cm !== undefined &&
      f.bmr === undefined,
    action: (f) => {
      const base = 10 * f.weight_kg! + 6.25 * f.height_cm! - 5 * f.age!;
      const bmr = f.gender === 'male' ? base + 5 : base - 161;
      return { bmr: Math.round(bmr) };
    },
  },
  {
    id: 'R_Compute_TDEE',
    description: 'Compute TDEE from BMR × activity multiplier',
    salience: 10,
    condition: (f) => f.bmr !== undefined && f.activity_level !== undefined && f.tdee === undefined,
    action: (f) => ({
      tdee: Math.round(f.bmr! * ACTIVITY_MULTIPLIERS[f.activity_level!]),
    }),
  },

  // ── Salience 5: Goal & Calorie Adjustment ─────────────────────────────────

  {
    id: 'R_Lose_Overweight',
    description: 'Lose weight + Overweight/Obese → TDEE − 500 kcal',
    salience: 5,
    condition: (f) =>
      f.goal === 'lose_weight' && f.tdee !== undefined &&
      (f.bmi_category === 'Overweight' || f.bmi_category === 'Obese') &&
      f.target_calories === undefined,
    action: (f) => ({ target_calories: Math.max(1200, f.tdee! - 500) }),
  },
  {
    id: 'R_Lose_Normal',
    description: 'Lose weight + Normal BMI → TDEE − 250 kcal',
    salience: 5,
    condition: (f) =>
      f.goal === 'lose_weight' && f.tdee !== undefined &&
      f.bmi_category === 'Normal' && f.target_calories === undefined,
    action: (f) => ({ target_calories: Math.max(1200, f.tdee! - 250) }),
  },
  {
    id: 'R_Lose_Underweight',
    description: 'Lose weight + Underweight → do not cut, use TDEE',
    salience: 5,
    condition: (f) =>
      f.goal === 'lose_weight' && f.tdee !== undefined &&
      f.bmi_category === 'Underweight' && f.target_calories === undefined,
    action: (f) => ({ target_calories: f.tdee! }),
  },
  {
    id: 'R_Maintain',
    description: 'Maintain weight → target = TDEE',
    salience: 5,
    condition: (f) =>
      f.goal === 'maintain' && f.tdee !== undefined && f.target_calories === undefined,
    action: (f) => ({ target_calories: f.tdee! }),
  },
  {
    id: 'R_Gain_Underweight',
    description: 'Gain weight + Underweight → TDEE + 300 kcal',
    salience: 5,
    condition: (f) =>
      f.goal === 'gain_weight' && f.tdee !== undefined &&
      f.bmi_category === 'Underweight' && f.target_calories === undefined,
    action: (f) => ({ target_calories: f.tdee! + 300 }),
  },
  {
    id: 'R_Gain_Normal',
    description: 'Gain weight + Normal/Overweight → TDEE + 200 kcal',
    salience: 5,
    condition: (f) =>
      f.goal === 'gain_weight' && f.tdee !== undefined &&
      f.bmi_category !== 'Underweight' && f.target_calories === undefined,
    action: (f) => ({ target_calories: f.tdee! + 200 }),
  },

  // ── Salience 4: Macronutrient Calculation ─────────────────────────────────

  {
    id: 'R_Macros_DASH',
    description: 'DASH diet → macros: 55% carb / 27% fat / 18% protein',
    salience: 4,
    condition: (f) => f.diet_type === 'DASH' && f.target_calories !== undefined && f.carb_g === undefined,
    action: (f) => {
      const cal = f.target_calories!;
      return {
        carb_g: Math.round((cal * 0.55) / 4),
        fat_g:  Math.round((cal * 0.27) / 9),
        protein_g: Math.round((cal * 0.18) / 4),
      };
    },
  },
  {
    id: 'R_Macros_LowGI',
    description: 'Low-GI diet → macros: 40% carb / 30% fat / 30% protein',
    salience: 4,
    condition: (f) => f.diet_type === 'Low-GI' && f.target_calories !== undefined && f.carb_g === undefined,
    action: (f) => {
      const cal = f.target_calories!;
      return {
        carb_g: Math.round((cal * 0.40) / 4),
        fat_g:  Math.round((cal * 0.30) / 9),
        protein_g: Math.round((cal * 0.30) / 4),
      };
    },
  },
  {
    id: 'R_Macros_Balanced',
    description: 'Balanced diet → macros: 50% carb / 30% fat / 20% protein',
    salience: 4,
    condition: (f) => f.diet_type === 'Balanced' && f.target_calories !== undefined && f.carb_g === undefined,
    action: (f) => {
      const cal = f.target_calories!;
      return {
        carb_g: Math.round((cal * 0.50) / 4),
        fat_g:  Math.round((cal * 0.30) / 9),
        protein_g: Math.round((cal * 0.20) / 4),
      };
    },
  },

  // ── Salience 3: Default Diet Assignment ───────────────────────────────────

  {
    id: 'R_Default_Balanced',
    description: 'No medical condition → assign Balanced diet',
    salience: 3,
    condition: (f) => f.medical_conditions !== undefined && f.diet_type === undefined,
    action: () => ({ diet_type: 'Balanced' as const }),
  },

  // ── Salience 2: Food Recommendation ───────────────────────────────────────

  {
    id: 'R_Recommend_DASH',
    description: 'DASH diet → populate recommended food list',
    salience: 2,
    condition: (f) => f.diet_type === 'DASH' && f.recommended_foods === undefined,
    action: () => ({ recommended_foods: DIET_FOODS.DASH.recommended }),
  },
  {
    id: 'R_Recommend_LowGI',
    description: 'Low-GI diet → populate recommended food list',
    salience: 2,
    condition: (f) => f.diet_type === 'Low-GI' && f.recommended_foods === undefined,
    action: () => ({ recommended_foods: DIET_FOODS['Low-GI'].recommended }),
  },
  {
    id: 'R_Recommend_Balanced',
    description: 'Balanced diet → populate recommended food list',
    salience: 2,
    condition: (f) => f.diet_type === 'Balanced' && f.recommended_foods === undefined,
    action: () => ({ recommended_foods: DIET_FOODS.Balanced.recommended }),
  },
];
