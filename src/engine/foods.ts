import type { DietType } from './types';

export const DIET_FOODS: Record<DietType, { recommended: string[]; avoid: string[] }> = {
  DASH: {
    recommended: [
      'Fruits (apples, pears, berries, bananas, oranges)',
      'Vegetables (spinach, broccoli, carrots, sweet potato)',
      'Whole grains (oats, brown rice, quinoa, whole-wheat bread)',
      'Low-fat dairy (skim milk, low-fat yogurt)',
      'Lean meats (chicken breast, turkey)',
      'Fish (salmon, tuna, sardines, mackerel)',
      'Legumes (lentils, chickpeas, black beans)',
      'Nuts & seeds (walnuts, flaxseed — unsalted)',
      'Olive oil',
    ],
    avoid: [
      'Table salt & high-sodium condiments (soy sauce, fish sauce)',
      'Processed & canned meats (sausage, ham, hot dogs)',
      'Canned soups & pre-packaged sauces',
      'Salty snacks (chips, pretzels, crackers)',
      'Full-fat dairy (butter, cream cheese)',
      'Sugary beverages (soda, sweetened juice)',
      'Fast food & fried foods',
    ],
  },
  'Low-GI': {
    recommended: [
      'Non-starchy vegetables (broccoli, spinach, cucumber, peppers, cauliflower)',
      'Berries (strawberries, blueberries, raspberries)',
      'Low-GI fruits (apples, pears, oranges, kiwi, cherries)',
      'Legumes (lentils, chickpeas, kidney beans, black beans)',
      'Whole grains (oats, barley, bulgur)',
      'Lean proteins (chicken, turkey, tofu, fish)',
      'Eggs',
      'Nuts (almonds, walnuts, pecans)',
      'Plain Greek yogurt',
    ],
    avoid: [
      'White bread & refined flour products (bagels, white rolls)',
      'White rice & instant oatmeal',
      'Sugary drinks (soda, fruit juice, energy drinks)',
      'Candy, cookies, cakes, and pastries',
      'Corn flakes & puffed rice cereals',
      'Mashed potatoes & baked potatoes',
      'Watermelon & overripe bananas',
      'Processed snack foods',
    ],
  },
  Balanced: {
    recommended: [
      'Colorful vegetables (aim for variety)',
      'Fresh fruits (2–3 servings/day)',
      'Whole grains (brown rice, whole-wheat bread, oats)',
      'Lean proteins (chicken, fish, legumes, tofu)',
      'Low-fat dairy or plant-based alternatives',
      'Healthy fats (avocado, olive oil, nuts)',
      'Eggs',
      'Water, herbal teas, and unsweetened beverages',
    ],
    avoid: [
      'Ultra-processed foods (packaged snacks, instant noodles)',
      'Sugary drinks (soda, energy drinks)',
      'Trans fats & deep-fried foods',
      'Excessive red meat (limit to 1–2x/week)',
      'Alcohol',
      'Added sugars & sweetened desserts',
    ],
  },
};

export const ALLERGEN_FOODS: Record<string, string[]> = {
  nuts: [
    'Peanuts & peanut butter',
    'Tree nuts (almonds, walnuts, cashews, pistachios)',
    'Nut oils & nut-based sauces',
    'Nut-containing baked goods & desserts',
  ],
  lactose: [
    'Milk (all types)',
    'Cheese & butter',
    'Ice cream & custard',
    'Yogurt & cream',
    'Lactose-containing dairy products',
  ],
  gluten: [
    'Wheat bread, pasta & couscous',
    'Barley & rye products',
    'Most breakfast cereals',
    'Crackers, biscuits & flour tortillas',
    'Beer & malt beverages',
  ],
  seafood: [
    'Fish (salmon, tuna, cod, tilapia)',
    'Shrimp & prawns',
    'Crab & lobster',
    'Oysters, clams & scallops',
    'Fish sauce & Worcestershire sauce',
  ],
  eggs: [
    'Eggs (all cooking forms)',
    'Mayonnaise & aioli',
    'Custard & egg-based sauces (hollandaise)',
    'Most baked goods (cakes, muffins, cookies)',
    'Egg noodles & pasta',
  ],
};
