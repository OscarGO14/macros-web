// Validation utilities for user input

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface MacroValidationResult {
  calories: ValidationResult;
  proteins: ValidationResult;
  carbs: ValidationResult;
  fats: ValidationResult;
  overall: ValidationResult;
}

// Validation ranges for macronutrients (reasonable values)
const VALIDATION_RANGES = {
  calories: { min: 800, max: 5000 },
  proteins: { min: 10, max: 300 },
  carbs: { min: 20, max: 800 },
  fats: { min: 10, max: 200 }
} as const;

const VALIDATION_MESSAGES = {
  calories: `Las calorías deben estar entre ${VALIDATION_RANGES.calories.min} y ${VALIDATION_RANGES.calories.max} kcal`,
  proteins: `Las proteínas deben estar entre ${VALIDATION_RANGES.proteins.min} y ${VALIDATION_RANGES.proteins.max} gramos`,
  carbs: `Los carbohidratos deben estar entre ${VALIDATION_RANGES.carbs.min} y ${VALIDATION_RANGES.carbs.max} gramos`,
  fats: `Las grasas deben estar entre ${VALIDATION_RANGES.fats.min} y ${VALIDATION_RANGES.fats.max} gramos`
} as const;

/**
 * Validates a single macro value
 */
export const validateMacro = (
  value: number,
  type: keyof typeof VALIDATION_RANGES
): ValidationResult => {
  const range = VALIDATION_RANGES[type];

  if (isNaN(value)) {
    return { isValid: false, error: 'Debe ser un número válido' };
  }

  if (value < range.min || value > range.max) {
    return { isValid: false, error: VALIDATION_MESSAGES[type] };
  }

  return { isValid: true };
};

/**
 * Validates all macronutrient goals
 */
export const validateMacroGoals = (
  calories: number,
  proteins: number,
  carbs: number,
  fats: number
): MacroValidationResult => {
  const caloriesValidation = validateMacro(calories, 'calories');
  const proteinsValidation = validateMacro(proteins, 'proteins');
  const carbsValidation = validateMacro(carbs, 'carbs');
  const fatsValidation = validateMacro(fats, 'fats');

  // Check if calculated calories from macros is reasonable
  const calculatedCalories = (proteins * 4) + (carbs * 4) + (fats * 9);
  const caloriesDifference = Math.abs(calories - calculatedCalories);
  const allowedDifference = calories * 0.3; // 30% tolerance

  let overallValidation: ValidationResult = { isValid: true };

  if (caloriesDifference > allowedDifference) {
    overallValidation = {
      isValid: false,
      error: `Las calorías de los macros (${Math.round(calculatedCalories)}) no coinciden con el objetivo (${calories}). Diferencia: ${Math.round(caloriesDifference)} kcal`
    };
  }

  // Overall validation passes only if all individual validations pass
  if (!caloriesValidation.isValid || !proteinsValidation.isValid ||
      !carbsValidation.isValid || !fatsValidation.isValid) {
    overallValidation.isValid = false;
  }

  return {
    calories: caloriesValidation,
    proteins: proteinsValidation,
    carbs: carbsValidation,
    fats: fatsValidation,
    overall: overallValidation
  };
};

/**
 * Validates display name
 */
export const validateDisplayName = (name: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'El nombre no puede estar vacío' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }

  if (name.trim().length > 50) {
    return { isValid: false, error: 'El nombre no puede tener más de 50 caracteres' };
  }

  return { isValid: true };
};