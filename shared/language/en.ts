// Centralised localisation file for all user-facing text in the diet app (British English)
// Add new keys as needed for new features. This file should be imported wherever text is needed.

const en = {
  // --- Diet Plan Page ---
  dietPlan: {
    defaultTitle: 'Weekly Diet Plan',
    defaultDescription: 'Your personalised nutrition plan',
    noMealsPlanned: 'No meals planned for this day',
  },
  // --- Diet Plan Cloning (API) ---
  cloneMissingTemplateId: 'Template ID is required.',
  cloneAuthRequired: 'Authentication required.',
  cloneTemplateNotFound: 'Template not found.',
  cloneCreatePlanFailed: 'Failed to create user plan.',
  cloneFetchDaysFailed: 'Failed to fetch template days.',
  clonePartialSuccess: 'Plan cloned with some errors. See details.',
  cloneServerError: 'A server error occurred while cloning the plan.',
  cloneInvalidRequest: 'Invalid request format.',
  // --- Auth & Login ---
  password: 'Password',
  forgotPassword: 'Forgot password?',
  resetEmailSent: 'If this email is registered, a password reset link has been sent.',
  sending: 'Sending...',
  sendResetLink: 'Send reset link',
  email: 'Email',
  weeklyDietPlan: 'Weekly Diet Plan',
  dailyTotal: 'Daily Total:',
  total: 'Total:',
  calories: 'kcal',
  markAsCompleted: 'Mark as completed',
  editMeal: 'Edit meal',
  remove: 'Remove', // Remove a food item
  addFood: 'Add food', // Add a new food item
  save: 'Save',
  cancel: 'Cancel',
  food: 'Food',
  weight: 'Weight (g)',
  quantity: 'Quantity',
  unit: 'Unit',
  nutritionalInfo: 'Nutritional Information',
  showDetails: 'Show details',
  hideDetails: 'Hide details',
  carbs: 'Carbohydrates',
  sugars: 'Sugars',
  protein: 'Protein',
  fat: 'Fat',
  mealCompleted: 'Meal completed',
  adjustMeal: 'Adjust meal',
  caloriesEaten: 'Calories',
  passwordsDoNotMatch: 'Passwords do not match',
  registrationSuccess: 'Registration successful! Please check your email to verify your account.',
  loginSuccess: 'Login successful! Redirecting...',
  logout: 'Logout',
  selectDietPlan: 'Select a diet plan',
  chooseDietPlan: 'Choose a diet plan',
  useThisPlan: 'Use this plan',
  cloning: 'Cloning…',
  loading: 'Loading…',
  failedToFetchTemplates: 'Failed to fetch diet templates.',
  cloneFailed: 'Failed to clone diet plan.',
  trackDietIntro: 'Track your diet and nutrition with this interactive application.'
};

export default en;
