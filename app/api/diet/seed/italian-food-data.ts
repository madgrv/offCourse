// Type for food nutrition data
type NutritionData = {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
};

// Italian food items with nutritional data
export const italianFoodData: { [foodName: string]: NutritionData } = {
  // Breakfast items
  "Caffè espresso": { calories: 5, carbs: 0.5, protein: 0.1, fat: 0 },
  "Cappuccino": { calories: 120, carbs: 12, protein: 8, fat: 4 },
  "Cornetto vuoto": { calories: 220, carbs: 30, protein: 5, fat: 10 },
  "Cornetto alla crema": { calories: 280, carbs: 35, protein: 5, fat: 13 },
  "Cornetto alla marmellata": { calories: 250, carbs: 33, protein: 5, fat: 11 },
  "Fette biscottate": { calories: 40, carbs: 7, protein: 1, fat: 1 }, // per piece
  "Marmellata di albicocche": { calories: 30, carbs: 7, protein: 0, fat: 0 }, // per tablespoon
  "Miele": { calories: 65, carbs: 17, protein: 0, fat: 0 }, // per tablespoon
  "Yogurt bianco": { calories: 120, carbs: 10, protein: 6, fat: 5 },
  "Yogurt alla frutta": { calories: 150, carbs: 20, protein: 6, fat: 5 },
  "Frutta fresca (mela)": { calories: 80, carbs: 21, protein: 0.3, fat: 0.2 },
  "Frutta fresca (banana)": { calories: 105, carbs: 27, protein: 1.3, fat: 0.4 },
  "Frutta fresca (arancia)": { calories: 65, carbs: 16, protein: 1.2, fat: 0.2 },
  "Pane tostato": { calories: 80, carbs: 15, protein: 3, fat: 1 }, // per slice
  "Burro": { calories: 100, carbs: 0, protein: 0.1, fat: 11 }, // per tablespoon
  
  // Lunch and dinner items
  "Pasta al pomodoro": { calories: 320, carbs: 60, protein: 10, fat: 5 },
  "Pasta alla carbonara": { calories: 450, carbs: 60, protein: 15, fat: 18 },
  "Pasta al pesto": { calories: 400, carbs: 60, protein: 12, fat: 15 },
  "Risotto ai funghi": { calories: 350, carbs: 65, protein: 8, fat: 8 },
  "Risotto alla milanese": { calories: 380, carbs: 65, protein: 8, fat: 10 },
  "Pizza margherita": { calories: 270, carbs: 33, protein: 12, fat: 10 }, // per slice
  "Lasagna alla bolognese": { calories: 380, carbs: 35, protein: 20, fat: 18 },
  "Minestrone di verdure": { calories: 160, carbs: 20, protein: 5, fat: 5 },
  "Pollo arrosto": { calories: 220, carbs: 0, protein: 30, fat: 10 },
  "Bistecca di manzo": { calories: 250, carbs: 0, protein: 35, fat: 12 },
  "Pesce alla griglia (orata)": { calories: 180, carbs: 0, protein: 28, fat: 8 },
  "Insalata mista": { calories: 70, carbs: 5, protein: 2, fat: 4 },
  "Insalata caprese": { calories: 250, carbs: 6, protein: 14, fat: 18 },
  "Verdure grigliate": { calories: 90, carbs: 10, protein: 3, fat: 4 },
  "Patate al forno": { calories: 180, carbs: 35, protein: 3, fat: 4 },
  "Pane (ciabatta)": { calories: 120, carbs: 24, protein: 4, fat: 1 }, // per slice
  "Frittata di verdure": { calories: 220, carbs: 5, protein: 15, fat: 15 },
  "Polpette al sugo": { calories: 280, carbs: 10, protein: 20, fat: 18 },
  "Melanzane alla parmigiana": { calories: 300, carbs: 15, protein: 10, fat: 22 },
  
  // Snack items
  "Frutta secca (mandorle)": { calories: 170, carbs: 6, protein: 6, fat: 15 }, // per 30g
  "Frutta secca (noci)": { calories: 190, carbs: 4, protein: 4, fat: 18 }, // per 30g
  "Yogurt greco": { calories: 150, carbs: 6, protein: 15, fat: 8 },
  "Formaggio (parmigiano)": { calories: 110, carbs: 1, protein: 10, fat: 7 }, // per 30g
  "Formaggio (mozzarella)": { calories: 90, carbs: 1, protein: 6, fat: 7 }, // per 30g
  "Prosciutto crudo": { calories: 70, carbs: 0, protein: 10, fat: 3 }, // per 30g
  "Prosciutto cotto": { calories: 60, carbs: 1, protein: 8, fat: 3 }, // per 30g
  "Frutta fresca (pera)": { calories: 100, carbs: 25, protein: 0.6, fat: 0.2 },
  "Frutta fresca (pesche)": { calories: 60, carbs: 15, protein: 1, fat: 0.1 },
  "Frutta fresca (uva)": { calories: 70, carbs: 18, protein: 0.6, fat: 0.2 }, // per 100g
  "Crackers integrali": { calories: 80, carbs: 15, protein: 2, fat: 2 }, // per 4 crackers
  "Grissini": { calories: 45, carbs: 8, protein: 1, fat: 1 }, // per 2 breadsticks
  "Bruschetta al pomodoro": { calories: 130, carbs: 18, protein: 3, fat: 5 },
  
  // Desserts
  "Gelato alla crema": { calories: 200, carbs: 25, protein: 4, fat: 10 },
  "Gelato al cioccolato": { calories: 220, carbs: 28, protein: 4, fat: 11 },
  "Tiramisù": { calories: 300, carbs: 30, protein: 6, fat: 18 },
  "Panna cotta": { calories: 250, carbs: 25, protein: 4, fat: 15 },
  "Cannolo siciliano": { calories: 270, carbs: 30, protein: 5, fat: 14 },
  "Frutta fresca (fragole)": { calories: 45, carbs: 10, protein: 1, fat: 0.4 }, // per 100g
  "Macedonia di frutta": { calories: 80, carbs: 20, protein: 1, fat: 0.2 },
  
  // Beverages
  "Acqua": { calories: 0, carbs: 0, protein: 0, fat: 0 },
  "Vino rosso": { calories: 125, carbs: 4, protein: 0, fat: 0 }, // per 150ml
  "Vino bianco": { calories: 120, carbs: 4, protein: 0, fat: 0 }, // per 150ml
  "Birra": { calories: 150, carbs: 13, protein: 1, fat: 0 }, // per 330ml
  "Succo d'arancia": { calories: 110, carbs: 26, protein: 1, fat: 0 }, // per 250ml
  "Limonata": { calories: 120, carbs: 30, protein: 0, fat: 0 }, // per 250ml
  "Tè al limone": { calories: 40, carbs: 10, protein: 0, fat: 0 }, // per 250ml
};

// Recommended daily caloric intake for Italian adults
export const italianNutritionalInfo = {
  adultMale: {
    recommendedDailyIntake: 2500, // calories
    recommendedMacros: {
      carbs: 300, // grams
      protein: 75, // grams
      fat: 80, // grams
    }
  },
  adultFemale: {
    recommendedDailyIntake: 2000, // calories
    recommendedMacros: {
      carbs: 230, // grams
      protein: 60, // grams
      fat: 65, // grams
    }
  }
};
