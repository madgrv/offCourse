import { useState, useCallback, useEffect } from 'react';
import { useDietPlan } from '../context/DietPlanContext';
import { useUser } from '../context/UserContext';
import * as dietPlanApi from '../api/dietPlanApi';
import { FoodItem } from '../lib/types';
import en from '@/shared/language/en';

// Centralises all business logic and state for diet plan actions, making the page component declarative and easy to maintain.
export function useDietPlanActions() {
  const [editingMeals, setEditingMeals] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  const { dietPlan, loading: dietPlanLoading, refreshDietPlan } = useDietPlan();
  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    if (dietPlan && user) {
      setActionErrors({});
    }
  }, [dietPlan, user]);

  // Wrapped in useCallback to avoid dependency issues
  const checkRequiredData = useCallback(
    (actionType: string): boolean => {
      if (userLoading || dietPlanLoading) {
        setActionErrors((prev) => ({
          ...prev,
          [actionType]: en.dietPlan.waitingForData,
        }));
        return false;
      }

      if (!user) {
        setActionErrors((prev) => ({
          ...prev,
          [actionType]: `${en.dietPlan.missingData}: User not found`,
        }));
        return false;
      }

      if (!user.id) {
        setActionErrors((prev) => ({
          ...prev,
          [actionType]: `${en.dietPlan.missingData}: User ID not found`,
        }));
        return false;
      }

      if (!dietPlan) {
        setActionErrors((prev) => ({
          ...prev,
          [actionType]: `${en.dietPlan.missingData}: Diet plan not found`,
        }));
        return false;
      }

      if (!dietPlan.id) {
        setActionErrors((prev) => ({
          ...prev,
          [actionType]: `${en.dietPlan.missingData}: Diet plan ID not found`,
        }));
        return false;
      }

      return true;
    },
    [dietPlan, user, dietPlanLoading, userLoading, setActionErrors]
  );

  const handleEditMeal = useCallback((day: string, mealType: string) => {
    setEditingMeals((prev) => ({ ...prev, [`${day}-${mealType}`]: true }));

    setActionErrors((prev) => ({ ...prev, [`edit-${day}-${mealType}`]: '' }));
  }, []);

  const handleSaveMeal = useCallback(
    async (day: string, mealType: string, updatedFoodItems: FoodItem[]) => {
      const actionKey = `save-${day}-${mealType}`;

      if (isProcessing[actionKey]) {
        setActionErrors((prev) => ({
          ...prev,
          [actionKey]: en.dietPlan.actionInProgress,
        }));
        return;
      }

      if (!checkRequiredData(actionKey)) {
        return;
      }

      try {
        setIsProcessing((prev) => ({ ...prev, [actionKey]: true }));

        setActionErrors((prev) => ({ ...prev, [actionKey]: '' }));

        await dietPlanApi.saveMealFoodItems({
          dietPlanId: dietPlan!.id as string,
          userId: user!.id as string,
          day,
          mealType,
          foodItems: updatedFoodItems,
        });

        setEditingMeals((prev) => ({ ...prev, [`${day}-${mealType}`]: false }));
        refreshDietPlan();
      } catch (err) {
        console.error('Error saving meal:', err);
        setActionErrors((prev) => ({
          ...prev,
          [actionKey]:
            err instanceof Error
              ? err.message
              : en.dietPlan.errorInsertingFoodItem,
        }));
      } finally {
        setIsProcessing((prev) => ({ ...prev, [actionKey]: false }));
      }
    },
    [dietPlan, user, refreshDietPlan, isProcessing, checkRequiredData]
  );

  type HandleMealCompleteType = (
    day: string,
    mealType: string,
    completed: boolean
  ) => Promise<void>;
  type HandleFoodItemCompleteType = (
    day: string,
    mealType: string,
    foodIndex: number,
    completed: boolean
  ) => Promise<void>;

  const handleMealComplete: HandleMealCompleteType = useCallback(
    async (day: string, mealType: string, completed: boolean) => {
      const actionKey = `meal-complete-${day}-${mealType}`;

      if (isProcessing[actionKey]) return;
      if (!checkRequiredData(actionKey)) return;
      setActionErrors((prev) => ({ ...prev, [actionKey]: '' }));
      dietPlanApi
        .setMealCompletion({
          userId: user!.id as string,
          dietPlanId: dietPlan!.id as string,
          day,
          mealType,
          completed,
        })
        .catch((err) => {});

      // Mark all food items as complete for consistency
      if (dietPlan?.days[day]?.meals?.[mealType]) {
        const foodItems = dietPlan.days[day].meals[mealType];

        foodItems.forEach((foodItem) => {
          if (!foodItem || !foodItem.id) return;

          dietPlanApi
            .setFoodItemCompletion({
              userId: user!.id as string,
              dietPlanId: dietPlan.id as string,
              foodItemId: foodItem.id,
              completed,
            })
            .catch((err) => {});
        });
      }

      // Short delay gives UI time to update before fetching new data
      setTimeout(() => {
        refreshDietPlan();
      }, 500);
    },
    [dietPlan, user, refreshDietPlan, isProcessing, checkRequiredData]
  );

  const handleFoodItemComplete: HandleFoodItemCompleteType = useCallback(
    async (
      day: string,
      mealType: string,
      foodIndex: number,
      completed: boolean
    ) => {
      const actionKey = `food-complete-${day}-${mealType}-${foodIndex}`;

      if (isProcessing[actionKey]) return;
      if (!checkRequiredData(actionKey)) return;
      setActionErrors((prev) => ({ ...prev, [actionKey]: '' }));

      const foodItems = dietPlan?.days[day]?.meals?.[mealType] || [];
      const foodItem = foodItems[foodIndex];
      if (!foodItem || !foodItem.id) {
        setActionErrors((prev) => ({
          ...prev,
          [actionKey]: 'Food item not found',
        }));
        return;
      }
      const foodItemId = foodItem.id;
      dietPlanApi
        .setFoodItemCompletion({
          userId: user!.id as string,
          dietPlanId: dietPlan!.id as string,
          foodItemId,
          completed,
        })
        .catch((err) => {});

      const allCompleted = foodItems.every((item, idx) =>
        idx === foodIndex ? completed : item.completed || false
      );

      if (allCompleted && completed) {
        handleMealComplete(day, mealType, true).catch((err) => {});
      }

      setTimeout(() => refreshDietPlan(), 500);
    },
    [
      dietPlan,
      user,
      refreshDietPlan,
      handleMealComplete,
      isProcessing,
      checkRequiredData,
    ]
  );

  return {
    editingMeals,
    isProcessing,
    actionErrors,
    isLoading: dietPlanLoading || userLoading,

    handleEditMeal,
    handleSaveMeal,
    handleMealComplete,
    handleFoodItemComplete,
  };
}

export default useDietPlanActions;
