import { italianFoodData, italianNutritionalInfo } from './italian-food-data';
import { FoodItem } from '@/app/lib/types';

// Helper function to create food items with the correct structure
const createFoodItem = (
  food: string,
  quantity: number = 1,
  unit: string = 'porzione'
): FoodItem => {
  const nutritionData = italianFoodData[food] || { calories: 0, carbs: 0, protein: 0, fat: 0 };
  
  return {
    food,
    calories: nutritionData.calories,
    quantity,
    unit,
    carbs: nutritionData.carbs,
    protein: nutritionData.protein,
    fat: nutritionData.fat,
    completed: false,
  };
};

// Define the type for the diet plan template with index signature
type DietPlanTemplate = {
  planName: string;
  planDescription: string;
  startDate: string;
  nutritionalInfo: typeof italianNutritionalInfo;
  days: {
    [key: string]: {
      meals: {
        [mealType: string]: FoodItem[];
      };
    };
  };
};

// Create the two-week diet plan template
export const twoWeekDietPlanTemplate: DietPlanTemplate = {
  planName: "Piano Alimentare Italiano (2 Settimane)",
  planDescription: "Un piano alimentare italiano equilibrato che alterna due settimane di pasti diversi.",
  startDate: new Date().toISOString(), // Current date as ISO string
  nutritionalInfo: italianNutritionalInfo,
  days: {
    // Week 1
    "week1_Monday": {
      meals: {
        breakfast: [
          createFoodItem("Caffè espresso"),
          createFoodItem("Cornetto vuoto"),
          createFoodItem("Frutta fresca (mela)"),
        ],
        lunch: [
          createFoodItem("Pasta al pomodoro", 1, "porzione"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Pane (ciabatta)", 1, "fetta"),
          createFoodItem("Frutta fresca (pera)", 1),
        ],
        snack: [
          createFoodItem("Yogurt greco", 1, "vasetto"),
          createFoodItem("Frutta secca (mandorle)", 30, "g"),
        ],
        dinner: [
          createFoodItem("Minestrone di verdure", 1, "porzione"),
          createFoodItem("Pollo arrosto", 150, "g"),
          createFoodItem("Verdure grigliate", 1, "porzione"),
          createFoodItem("Pane (ciabatta)", 1, "fetta"),
        ],
      },
    },
    "week1_Tuesday": {
      meals: {
        breakfast: [
          createFoodItem("Cappuccino", 1),
          createFoodItem("Fette biscottate", 3, "fette"),
          createFoodItem("Marmellata di albicocche", 1, "cucchiaio"),
        ],
        lunch: [
          createFoodItem("Risotto ai funghi", 1, "porzione"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Frutta fresca (arancia)", 1),
        ],
        snack: [
          createFoodItem("Frutta fresca (banana)", 1),
        ],
        dinner: [
          createFoodItem("Pesce alla griglia (orata)", 150, "g"),
          createFoodItem("Patate al forno", 1, "porzione"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Frutta fresca (fragole)", 100, "g"),
        ],
      },
    },
    "week1_Wednesday": {
      meals: {
        breakfast: [
          createFoodItem("Yogurt bianco", 1, "vasetto"),
          createFoodItem("Miele", 1, "cucchiaio"),
          createFoodItem("Frutta fresca (banana)", 1),
        ],
        lunch: [
          createFoodItem("Pasta al pesto", 1, "porzione"),
          createFoodItem("Formaggio (mozzarella)", 60, "g"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Frutta fresca (pera)", 1),
        ],
        snack: [
          createFoodItem("Crackers integrali", 4, "pezzi"),
          createFoodItem("Formaggio (parmigiano)", 30, "g"),
        ],
        dinner: [
          createFoodItem("Frittata di verdure", 1, "porzione"),
          createFoodItem("Verdure grigliate", 1, "porzione"),
          createFoodItem("Pane (ciabatta)", 1, "fetta"),
          createFoodItem("Macedonia di frutta", 1, "porzione"),
        ],
      },
    },
    "week1_Thursday": {
      meals: {
        breakfast: [
          createFoodItem("Caffè espresso", 1),
          createFoodItem("Pane tostato", 2, "fette"),
          createFoodItem("Marmellata di albicocche", 1, "cucchiaio"),
        ],
        lunch: [
          createFoodItem("Insalata caprese", 1, "porzione"),
          createFoodItem("Pane (ciabatta)", 1, "fetta"),
          createFoodItem("Frutta fresca (pesche)", 1),
        ],
        snack: [
          createFoodItem("Yogurt alla frutta", 1, "vasetto"),
        ],
        dinner: [
          createFoodItem("Risotto alla milanese", 1, "porzione"),
          createFoodItem("Bistecca di manzo", 150, "g"),
          createFoodItem("Verdure grigliate", 1, "porzione"),
          createFoodItem("Frutta fresca (uva)", 100, "g"),
        ],
      },
    },
    "week1_Friday": {
      meals: {
        breakfast: [
          createFoodItem("Cappuccino", 1),
          createFoodItem("Cornetto alla marmellata", 1),
        ],
        lunch: [
          createFoodItem("Pizza margherita", 2, "fette"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Frutta fresca (mela)", 1),
        ],
        snack: [
          createFoodItem("Frutta secca (noci)", 30, "g"),
        ],
        dinner: [
          createFoodItem("Pesce alla griglia (orata)", 150, "g"),
          createFoodItem("Patate al forno", 1, "porzione"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Gelato alla crema", 1, "pallina"),
        ],
      },
    },
    "week1_Saturday": {
      meals: {
        breakfast: [
          createFoodItem("Yogurt bianco", 1, "vasetto"),
          createFoodItem("Miele", 1, "cucchiaio"),
          createFoodItem("Frutta fresca (banana)", 1),
        ],
        lunch: [
          createFoodItem("Lasagna alla bolognese", 1, "porzione"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Frutta fresca (arancia)", 1),
        ],
        snack: [
          createFoodItem("Bruschetta al pomodoro", 1),
        ],
        dinner: [
          createFoodItem("Minestrone di verdure", 1, "porzione"),
          createFoodItem("Prosciutto crudo", 60, "g"),
          createFoodItem("Formaggio (mozzarella)", 60, "g"),
          createFoodItem("Pane (ciabatta)", 1, "fetta"),
          createFoodItem("Frutta fresca (fragole)", 100, "g"),
        ],
      },
    },
    "week1_Sunday": {
      meals: {
        breakfast: [
          createFoodItem("Cappuccino", 1),
          createFoodItem("Cornetto alla crema", 1),
          createFoodItem("Frutta fresca (arancia)", 1),
        ],
        lunch: [
          createFoodItem("Pasta alla carbonara", 1, "porzione"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Pane (ciabatta)", 1, "fetta"),
          createFoodItem("Tiramisù", 1, "porzione piccola"),
        ],
        snack: [
          createFoodItem("Macedonia di frutta", 1, "porzione"),
        ],
        dinner: [
          createFoodItem("Polpette al sugo", 1, "porzione"),
          createFoodItem("Verdure grigliate", 1, "porzione"),
          createFoodItem("Pane (ciabatta)", 1, "fetta"),
          createFoodItem("Frutta fresca (pera)", 1),
        ],
      },
    },

    // Week 2
    "week2_Monday": {
      meals: {
        breakfast: [
          createFoodItem("Caffè espresso", 1),
          createFoodItem("Fette biscottate", 3, "fette"),
          createFoodItem("Miele", 1, "cucchiaio"),
          createFoodItem("Frutta fresca (arancia)", 1),
        ],
        lunch: [
          createFoodItem("Pasta al pesto", 1, "porzione"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Frutta fresca (mela)", 1),
        ],
        snack: [
          createFoodItem("Yogurt greco", 1, "vasetto"),
        ],
        dinner: [
          createFoodItem("Pollo arrosto", 150, "g"),
          createFoodItem("Patate al forno", 1, "porzione"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Frutta fresca (pera)", 1),
        ],
      },
    },
    "week2_Tuesday": {
      meals: {
        breakfast: [
          createFoodItem("Cappuccino", 1),
          createFoodItem("Cornetto vuoto", 1),
        ],
        lunch: [
          createFoodItem("Insalata caprese", 1, "porzione"),
          createFoodItem("Pane (ciabatta)", 1, "fetta"),
          createFoodItem("Frutta fresca (pesche)", 1),
        ],
        snack: [
          createFoodItem("Frutta secca (mandorle)", 30, "g"),
        ],
        dinner: [
          createFoodItem("Risotto ai funghi", 1, "porzione"),
          createFoodItem("Bistecca di manzo", 150, "g"),
          createFoodItem("Verdure grigliate", 1, "porzione"),
          createFoodItem("Gelato al cioccolato", 1, "pallina"),
        ],
      },
    },
    "week2_Wednesday": {
      meals: {
        breakfast: [
          createFoodItem("Yogurt alla frutta", 1, "vasetto"),
          createFoodItem("Frutta fresca (banana)", 1),
        ],
        lunch: [
          createFoodItem("Pasta al pomodoro", 1, "porzione"),
          createFoodItem("Formaggio (mozzarella)", 60, "g"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Frutta fresca (fragole)", 100, "g"),
        ],
        snack: [
          createFoodItem("Crackers integrali", 4, "pezzi"),
        ],
        dinner: [
          createFoodItem("Melanzane alla parmigiana", 1, "porzione"),
          createFoodItem("Pane (ciabatta)", 1, "fetta"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Frutta fresca (uva)", 100, "g"),
        ],
      },
    },
    "week2_Thursday": {
      meals: {
        breakfast: [
          createFoodItem("Caffè espresso", 1),
          createFoodItem("Pane tostato", 2, "fette"),
          createFoodItem("Burro", 1, "cucchiaio"),
          createFoodItem("Marmellata di albicocche", 1, "cucchiaio"),
        ],
        lunch: [
          createFoodItem("Minestrone di verdure", 1, "porzione"),
          createFoodItem("Prosciutto cotto", 60, "g"),
          createFoodItem("Formaggio (parmigiano)", 30, "g"),
          createFoodItem("Pane (ciabatta)", 1, "fetta"),
          createFoodItem("Frutta fresca (mela)", 1),
        ],
        snack: [
          createFoodItem("Yogurt bianco", 1, "vasetto"),
          createFoodItem("Miele", 1, "cucchiaio"),
        ],
        dinner: [
          createFoodItem("Pesce alla griglia (orata)", 150, "g"),
          createFoodItem("Verdure grigliate", 1, "porzione"),
          createFoodItem("Pane (ciabatta)", 1, "fetta"),
          createFoodItem("Macedonia di frutta", 1, "porzione"),
        ],
      },
    },
    "week2_Friday": {
      meals: {
        breakfast: [
          createFoodItem("Cappuccino", 1),
          createFoodItem("Cornetto alla marmellata", 1),
        ],
        lunch: [
          createFoodItem("Risotto alla milanese", 1, "porzione"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Frutta fresca (pera)", 1),
        ],
        snack: [
          createFoodItem("Frutta secca (noci)", 30, "g"),
        ],
        dinner: [
          createFoodItem("Pizza margherita", 2, "fette"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Panna cotta", 1, "porzione piccola"),
        ],
      },
    },
    "week2_Saturday": {
      meals: {
        breakfast: [
          createFoodItem("Yogurt bianco", 1, "vasetto"),
          createFoodItem("Frutta fresca (banana)", 1),
          createFoodItem("Frutta secca (mandorle)", 30, "g"),
        ],
        lunch: [
          createFoodItem("Pasta alla carbonara", 1, "porzione"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Frutta fresca (arancia)", 1),
        ],
        snack: [
          createFoodItem("Bruschetta al pomodoro", 1),
        ],
        dinner: [
          createFoodItem("Frittata di verdure", 1, "porzione"),
          createFoodItem("Verdure grigliate", 1, "porzione"),
          createFoodItem("Pane (ciabatta)", 1, "fetta"),
          createFoodItem("Cannolo siciliano", 1),
        ],
      },
    },
    "week2_Sunday": {
      meals: {
        breakfast: [
          createFoodItem("Cappuccino", 1),
          createFoodItem("Cornetto alla crema", 1),
          createFoodItem("Frutta fresca (arancia)", 1),
        ],
        lunch: [
          createFoodItem("Lasagna alla bolognese", 1, "porzione"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Pane (ciabatta)", 1, "fetta"),
          createFoodItem("Tiramisù", 1, "porzione piccola"),
        ],
        snack: [
          createFoodItem("Macedonia di frutta", 1, "porzione"),
        ],
        dinner: [
          createFoodItem("Polpette al sugo", 1, "porzione"),
          createFoodItem("Patate al forno", 1, "porzione"),
          createFoodItem("Insalata mista", 1, "porzione"),
          createFoodItem("Frutta fresca (fragole)", 100, "g"),
        ],
      },
    },
  },
};
