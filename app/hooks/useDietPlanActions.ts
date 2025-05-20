import { useState, useCallback, useEffect } from 'react';
import { useDietPlan } from '../context/DietPlanContext';
import { useUser } from '../context/UserContext';
import * as dietPlanApi from '../api/dietPlanApi';
import { FoodItem } from '../lib/types';
import en from '@/shared/language/en';

// Why: Centralises all business logic and state for diet plan actions, making the page component declarative and easy to maintain.
export function useDietPlanActions() {
  const [editingMeals, setEditingMeals] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  
  const { dietPlan, loading: dietPlanLoading, refreshDietPlan } = useDietPlan();
  const { user, loading: userLoading } = useUser();
  
  // Clear errors when diet plan or user changes
  useEffect(() => {
    if (dietPlan && user) {
      setActionErrors({});
    }
  }, [dietPlan, user]);
  
  // Helper function to check if we have the required data - wrapped in useCallback to avoid dependency issues
  const checkRequiredData = useCallback((actionType: string): boolean => {
    if (dietPlanLoading || userLoading) {
      setActionErrors(prev => ({ ...prev, [actionType]: en.dietPlan.waitingForData }));
      return false;
    }
    
    if (!dietPlan || !user || !dietPlan.id || !user.id) {
      setActionErrors(prev => ({ ...prev, [actionType]: en.dietPlan.missingData }));
      return false;
    }
    
    return true;
  }, [dietPlan, user, dietPlanLoading, userLoading]);

  const handleEditMeal = useCallback((day: string, mealType: string) => {
    // This is a simple UI state change, no need for data validation
    setEditingMeals((prev) => ({ ...prev, [`${day}-${mealType}`]: true }));
    // Clear any previous errors for this action
    setActionErrors((prev) => ({ ...prev, [`edit-${day}-${mealType}`]: '' }));
  }, []);

  // Save edited meal (update food items in DB)
  const handleSaveMeal = useCallback(
    async (day: string, mealType: string, updatedFoodItems: FoodItem[]) => {
      const actionKey = `save-${day}-${mealType}`;
      
      // Check if this action is already in progress
      if (isProcessing[actionKey]) {
        setActionErrors(prev => ({ ...prev, [actionKey]: en.dietPlan.actionInProgress }));
        return;
      }
      
      // Check if we have the required data
      if (!checkRequiredData(actionKey)) {
        return;
      }
      
      try {
        // Set processing state
        setIsProcessing(prev => ({ ...prev, [actionKey]: true }));
        // Clear any previous errors
        setActionErrors(prev => ({ ...prev, [actionKey]: '' }));
        
        await dietPlanApi.saveMealFoodItems({
          dietPlanId: dietPlan!.id as string,
          userId: user!.id as string,
          day,
          mealType,
          foodItems: updatedFoodItems,
        });
        
        // Update UI state
        setEditingMeals((prev) => ({ ...prev, [`${day}-${mealType}`]: false }));
        refreshDietPlan();
      } catch (err) {
        console.error('Error saving meal:', err);
        setActionErrors(prev => ({
          ...prev,
          [actionKey]: err instanceof Error ? err.message : en.dietPlan.errorInsertingFoodItem
        }));
      } finally {
        // Clear processing state
        setIsProcessing(prev => ({ ...prev, [actionKey]: false }));
      }
    },
    [dietPlan, user, refreshDietPlan, isProcessing, checkRequiredData]
  );

  // Type declarations to avoid circular dependency issues
  type HandleMealCompleteType = (day: string, mealType: string, completed: boolean) => Promise<void>;
  type HandleFoodItemCompleteType = (day: string, mealType: string, foodIndex: number, completed: boolean) => Promise<void>;

  // Toggle meal completion
  // Why: This must be declared before handleFoodItemComplete to avoid circular dependency
  const handleMealComplete: HandleMealCompleteType = useCallback(
    async (day: string, mealType: string, completed: boolean) => {
      const actionKey = `meal-complete-${day}-${mealType}`;
      
      // Check if this action is already in progress
      if (isProcessing[actionKey]) {
        setActionErrors(prev => ({ ...prev, [actionKey]: en.dietPlan.actionInProgress }));
        return;
      }
      
      // Check if we have the required data
      if (!checkRequiredData(actionKey)) {
        return;
      }
      
      try {
        // Set processing state
        setIsProcessing(prev => ({ ...prev, [actionKey]: true }));
        // Clear any previous errors
        setActionErrors(prev => ({ ...prev, [actionKey]: '' }));
        
        await dietPlanApi.setMealCompletion({
          userId: user!.id as string,
          dietPlanId: dietPlan!.id as string,
          day,
          mealType,
          completed,
        });
        
        refreshDietPlan();
        
        // If marking a meal as complete, also mark all food items as complete for consistency
        if (completed && dietPlan!.days[day]?.meals?.[mealType]) {
          const foodItems = dietPlan!.days[day].meals[mealType];
          // We're not calling handleFoodItemComplete here to avoid circular dependency
          // Instead, directly update each food item's completion status
          for (let i = 0; i < foodItems.length; i++) {
            const foodItem = foodItems[i];
            if (!foodItem || !foodItem.id) continue;
            
            await dietPlanApi.setFoodItemCompletion({
              userId: user!.id as string,
              dietPlanId: dietPlan!.id as string,
              day,
              mealType,
              foodItemId: foodItem.id,
              completed,
            });
          }
          refreshDietPlan();
        }
      } catch (err) {
        console.error('Error updating meal completion:', err);
        setActionErrors(prev => ({
          ...prev,
          [actionKey]: err instanceof Error ? err.message : en.dietPlan.errorUpdatingMealCompletion
        }));
      } finally {
        // Clear processing state
        setIsProcessing(prev => ({ ...prev, [actionKey]: false }));
      }
    },
    [dietPlan, user, refreshDietPlan, isProcessing, checkRequiredData]
  );

  // Toggle food item completion
  const handleFoodItemComplete: HandleFoodItemCompleteType = useCallback(
    async (day: string, mealType: string, foodIndex: number, completed: boolean) => {
      const actionKey = `food-complete-${day}-${mealType}-${foodIndex}`;
      
      // Check if this action is already in progress
      if (isProcessing[actionKey]) {
        setActionErrors(prev => ({ ...prev, [actionKey]: en.dietPlan.actionInProgress }));
        return;
      }
      
      // Check if we have the required data
      if (!checkRequiredData(actionKey)) {
        return;
      }
      
      try {
        // Set processing state
        setIsProcessing(prev => ({ ...prev, [actionKey]: true }));
        // Clear any previous errors
        setActionErrors(prev => ({ ...prev, [actionKey]: '' }));
        
        const foodItems = dietPlan!.days[day]?.meals?.[mealType] || [];
        const foodItem = foodItems[foodIndex];
        if (!foodItem || !foodItem.id) {
          setActionErrors(prev => ({ ...prev, [actionKey]: 'Food item not found' }));
          return;
        }
        
        const foodItemId: string = foodItem.id;
        await dietPlanApi.setFoodItemCompletion({
          userId: user!.id as string,
          dietPlanId: dietPlan!.id as string,
          day,
          mealType,
          foodItemId,
          completed,
        });
        
        refreshDietPlan();
        
        // If all food items in this meal are completed, mark the meal as completed
        const allCompleted = foodItems.every((item, idx) =>
          idx === foodIndex ? completed : item.completed || false
        );
        
        if (allCompleted) {
          await handleMealComplete(day, mealType, true);
        }
      } catch (err) {
        console.error('Error updating food item completion:', err);
        setActionErrors(prev => ({
          ...prev,
          [actionKey]: err instanceof Error ? err.message : en.dietPlan.errorUpdatingFoodCompletion
        }));
      } finally {
        // Clear processing state
        setIsProcessing(prev => ({ ...prev, [actionKey]: false }));
      }
    },
    [dietPlan, user, refreshDietPlan, handleMealComplete, isProcessing, checkRequiredData]
  );

  // Why: This hook returns all handlers and state needed for diet plan actions, keeping business logic out of the UI layer for maintainability and testability.
  return {
    // State
    editingMeals,
    isProcessing,
    actionErrors,
    isLoading: dietPlanLoading || userLoading,
    
    // Actions
    handleEditMeal,
    handleSaveMeal,
    handleMealComplete,
    handleFoodItemComplete
  };
}

export default useDietPlanActions;
