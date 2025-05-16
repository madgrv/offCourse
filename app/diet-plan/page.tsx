"use client";

import { useEffect, useState, useCallback } from "react";

// UI Components
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { MealCard } from "@/app/components/custom/meal-card";
import { Skeleton } from "@/app/components/ui/skeleton";
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import DashboardLayout from "@/app/components/layout/DashboardLayout";

// Data and utilities
import { formatDayName, calculateMealCalories } from "@/app/lib/data";
import { FoodItem } from "@/app/lib/types";
import { getCurrentDay } from "@/app/lib/getCurrentDay";
import { useDietPlan } from "@/app/context/DietPlanContext";
import en from "@/shared/language/en";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function DietPlanPage() {
  // Days of the week
  const days = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  // Get diet plan data from context
  const { dietPlan, loading, error, refreshDietPlan } = useDietPlan();
  
  // State to track which meals are being edited
  const [editingMeals, setEditingMeals] = useState<Record<string, boolean>>({});
  
  // Initialize Supabase client
  const supabase = createClientComponentClient();
  
  // Track authentication state
  const [user, setUser] = useState<any>(null);
  
  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setUser(data.session.user);
      }
    };
    
    checkAuth();
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Determine current day for default tab selection
  const currentDay = getCurrentDay();
  const defaultTab = days.includes(currentDay) ? currentDay : 'Monday';

  // Function to load meal and food item completion statuses - memoized with useCallback
  const loadCompletionStatuses = useCallback(async () => {
    if (!dietPlan || !user) return;
    
    try {      
      // Load meal completions
      const { data: mealCompletions, error: mealError } = await supabase
        .from('meal_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('diet_plan_id', dietPlan.id);
      
      if (mealError) {
        console.error('Error loading meal completions:', mealError.message);
      } else if (mealCompletions?.length) {
        console.log(`Loaded ${mealCompletions.length} meal completion records`);
      }
      
      // Load food completions
      const { data: foodCompletions, error: foodError } = await supabase
        .from('food_completions')
        .select('*')
        .eq('user_id', user.id);
      
      if (foodError) {
        console.error('Error loading food completions:', foodError.message);
      } else if (foodCompletions?.length) {
        console.log(`Loaded ${foodCompletions.length} food completion records`);
      }
    } catch (err) {
      console.error('Error loading completion statuses:', err);
    }
  }, [dietPlan, user, supabase]);
  
  // Load meal completion statuses when diet plan loads or user changes
  useEffect(() => {
    if (dietPlan && !loading && user) {
      loadCompletionStatuses();
    }
  }, [dietPlan, loading, user, loadCompletionStatuses]);
  
  // Handle meal completion toggle
  const handleMealComplete = async (day: string, mealType: string, completed: boolean) => {
    if (!dietPlan) return;
    
    try {
      // Use the cached user object instead of fetching it again
      if (!user) {
        console.error('Authentication required to track meal completion');
        return;
      }
      
      // Update the meal completion status in the database
      const { error } = await supabase
        .from('meal_completions')
        .upsert({
          user_id: user.id,
          diet_plan_id: dietPlan.id,
          day: day,
          meal_type: mealType,
          completed: completed,
          completed_at: completed ? new Date().toISOString() : null
        });
      
      if (error) {
        console.error('Error updating meal completion status:', error.message);
      } else {
        console.log(`Meal ${mealType} on ${day} marked as ${completed ? 'completed' : 'incomplete'}`);
        // Refresh diet plan data to reflect changes
        refreshDietPlan();
        
        // If marking a meal as complete, also mark all food items as complete
        if (completed && dietPlan.days[day]?.meals?.[mealType]) {
          const foodItems = dietPlan.days[day].meals[mealType];
          for (let i = 0; i < foodItems.length; i++) {
            handleFoodItemComplete(day, mealType, i, completed);
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error updating meal completion:', err);
    }
  };
  
  // Handle food item completion toggle
  const handleFoodItemComplete = async (day: string, mealType: string, foodIndex: number, completed: boolean) => {
    if (!dietPlan) return;
    
    try {
      // Use the cached user object instead of fetching it again
      if (!user) {
        console.error('Authentication required to track food item completion');
        return;
      }
      
      // Get the food item ID
      const foodItems = dietPlan.days[day]?.meals?.[mealType] || [];
      const foodItem = foodItems[foodIndex];
      
      if (!foodItem || !foodItem.id) {
        console.error('Food item not found or missing ID');
        return;
      }
      
      // First, update the food_completions table
      const { error: completionError } = await supabase
        .from('food_completions')
        .upsert({
          user_id: user.id,
          diet_food_item_id: foodItem.id,
          completed: completed,
          completed_at: completed ? new Date().toISOString() : null
        });
      
      if (completionError) {
        console.error('Error updating food completion status:', completionError.message);
        return;
      }
      
      // Also update the completed flag in diet_food_items for compatibility
      const { error: updateError } = await supabase
        .from('diet_food_items')
        .update({ completed: completed })
        .eq('id', foodItem.id);
      
      if (updateError) {
        console.error('Error updating food item status:', updateError.message);
      } else {
        console.log(`Food item ${foodItem.food} marked as ${completed ? 'completed' : 'incomplete'}`);
        // Refresh diet plan data to reflect changes
        refreshDietPlan();
        
        // Check if all food items in this meal are completed
        const allCompleted = foodItems.every((item, idx) => 
          idx === foodIndex ? completed : (item.completed || false)
        );
        
        // If all food items are completed, mark the meal as completed too
        if (allCompleted) {
          handleMealComplete(day, mealType, true);
        }
      }
    } catch (err) {
      console.error('Unexpected error updating food item completion:', err);
    }
  };
  
  // Handle saving edited meal
  const handleSaveMeal = async (day: string, mealType: string, updatedFoodItems: FoodItem[]) => {
    if (!dietPlan) return;
    
    try {
      // Get the user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        
        return;
      }
      
      // Update food items in the database
      for (const foodItem of updatedFoodItems) {
        if (foodItem.id) {
          // Update existing food item
          const { error } = await supabase
            .from('diet_food_items')
            .update({
              food_name: foodItem.food,
              calories: foodItem.calories,
              quantity: foodItem.quantity,
              unit: foodItem.unit,
              carbohydrates: foodItem.carbs, // Store total carbs
              sugars: foodItem.sugars, // Store sugars separately (subset of carbs)
              protein: foodItem.protein,
              fat: foodItem.fat,
              completed: foodItem.completed || false
            })
            .eq('id', foodItem.id);
          
          if (error) {
            console.error('Error updating food item:', error);
          }
        } else {
          // Create new food item
          const { error } = await supabase
            .from('food_items')
            .insert({
              diet_plan_id: dietPlan.id,
              day: day,
              meal_type: mealType,
              food: foodItem.food,
              calories: foodItem.calories,
              quantity: foodItem.quantity,
              unit: foodItem.unit,
              completed: foodItem.completed || false
            });
          
          if (error) {
            
          }
        }
      }
      
      // Remove editing state for this meal
      setEditingMeals(prev => ({ ...prev, [`${day}-${mealType}`]: false }));
      
      // Refresh diet plan data to reflect changes
      refreshDietPlan();
    } catch (err) {
      
    }
  };
  
  // Set a meal as being edited
  const handleEditMeal = (day: string, mealType: string) => {
    setEditingMeals(prev => ({ ...prev, [`${day}-${mealType}`]: true }));
  };

  // Render loading skeleton while fetching
  if (loading || !dietPlan) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-1/3 mb-6" />
          <Skeleton className="h-12 w-full mb-8" />
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Show error state if there was a problem loading the diet plan
  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Error Loading Diet Plan</h1>
          <div className="p-6 bg-red-50 text-red-800 rounded-lg">
            <p>{error}</p>
            <p className="mt-2">Please try refreshing the page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">{dietPlan.planName || en.dietPlan.defaultTitle}</h1>
          {dietPlan.planDescription && (
            <p className="text-muted-foreground mb-6">{dietPlan.planDescription}</p>
          )}

          {/* Check if there are any days with meals */}
          {Object.keys(dietPlan.days).length === 0 ? (
            <div className="text-center p-8 bg-muted rounded-lg mt-4">
              <h2 className="text-xl font-medium mb-2">No meal plan found</h2>
              <p className="text-muted-foreground mb-6">
                You need to select a template and create your diet plan first.
              </p>
              <a 
                href="/"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Select a Diet Template
              </a>
            </div>
          ) : (
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="w-full flex justify-between mb-8 overflow-x-auto">
                {days.map((day: string) => (
                  <TabsTrigger key={day} value={day} className="flex-1">
                    {formatDayName(day)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {days.map((day: string) => {
                const dayData = dietPlan.days[day];

                return (
                  <TabsContent key={day} value={day} className="space-y-8">
                    {dayData && dayData.meals ? (
                      Object.entries(dayData.meals).map(([mealType, foodItems]) => {
                        // Defensive: always provide an array to MealCard, never undefined
                        // This prevents rendering bugs if the backend or mapping returns undefined
                        const safeFoodItems = Array.isArray(foodItems) ? foodItems : [];
  
                        // Calculate total calories for the meal
                        const totalCalories = calculateMealCalories(safeFoodItems);

                        // Check if this meal is being edited
                        const isEditing = editingMeals[`${day}-${mealType}`] || false;
                        
                        // Get meal completion status (could be stored in the database)
                        const mealCompleted = safeFoodItems.every(item => item.completed);
                        
                        return (
                          // Pass mealType as 'title' to match MealCardProps interface
                          <MealCard
                            key={mealType}
                            title={mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                            foodItems={safeFoodItems} // Always pass an array, never undefined
                            totalCalories={totalCalories}
                            completed={mealCompleted}
                            onComplete={(completed) => handleMealComplete(day, mealType, completed)}
                            editable={true}
                            isEditing={isEditing}
                            onEdit={() => handleEditMeal(day, mealType)}
                            onSave={(updatedItems) => handleSaveMeal(day, mealType, updatedItems)}
                            onFoodItemComplete={(index, completed) => 
                              handleFoodItemComplete(day, mealType, index, completed)
                            }
                          />
                        );
                      })
                    ) : (
                      <div className="p-6 text-center bg-muted rounded-lg">
                        <h3 className="font-medium mb-2">No meals planned for {formatDayName(day)}</h3>
                        <p className="text-muted-foreground">Your diet plan doesn&apos;t have any meals scheduled for this day.</p>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}