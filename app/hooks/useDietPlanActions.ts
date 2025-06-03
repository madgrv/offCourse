import React, { useState, useCallback, useEffect } from 'react';
import { useDietPlan } from '../context/DietPlanContext';
import { useAuth } from '../context/auth-context';
import * as dietPlanApi from '../api/dietPlanApi';
import { FoodItem } from '../lib/types';
import en from '@/shared/language/en';
import { mutate } from 'swr';
import { DIET_PLAN_CACHE_KEY } from './useDietPlanData';

// Centralises all business logic and state for diet plan actions, making the page component declarative and easy to maintain.
export function useDietPlanActions() {
  const [editingMeals, setEditingMeals] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  const { dietPlan, loading: dietPlanLoading, refreshDietPlan } = useDietPlan();
  const { user, loading: userLoading } = useAuth();

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
        // setActionErrors((prev) => ({
        //   ...prev,
        //   [actionKey]: en.dietPlan.actionInProgress,
        // }));
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

  // Tracks in-flight completion actions to prevent double-toggling the same item/meal
  const inFlightCompletions = React.useRef<Set<string>>(new Set());

  const handleMealComplete: HandleMealCompleteType = useCallback(
    async (day: string, mealType: string, completed: boolean) => {
      const actionKey = `meal-complete-${day}-${mealType}`;
      // Prevent double-toggling the same meal while allowing other actions
      if (inFlightCompletions.current.has(actionKey)) {
        // Silently ignore double-toggling the same completion action
        return;
      }
      if (!checkRequiredData(actionKey)) return;
      setActionErrors((prev) => ({ ...prev, [actionKey]: '' }));
      inFlightCompletions.current.add(actionKey);

      // Optimistically update the SWR cache for immediate UI feedback
      await mutate(
        DIET_PLAN_CACHE_KEY,
        (current: any) => {
          if (!current) return current;
          const updated = { ...current };
          if (
            updated.days &&
            updated.days[day] &&
            updated.days[day].meals &&
            updated.days[day].meals[mealType]
          ) {
            // Update meal completion
            updated.days[day].meals[mealType] = updated.days[day].meals[
              mealType
            ].map((item: FoodItem) => ({ ...item, completed }));
            // Optionally, store a meal-level completion flag if your UI uses it
            if (updated.days[day].mealCompletion) {
              updated.days[day].mealCompletion[mealType] = completed;
            }
          }
          return updated;
        },
        false // Do not revalidate yet
      );

      try {
        await dietPlanApi.setMealCompletion({
          userId: user!.id as string,
          dietPlanId: dietPlan!.id as string,
          day,
          mealType,
          completed,
        });
        // No need to revalidate here; API already does it after mutation
      } catch (err) {
        // Roll back optimistic update if server call fails
        await mutate(DIET_PLAN_CACHE_KEY);
        setActionErrors((prev) => ({
          ...prev,
          [actionKey]: en.dietPlan.errorUpdatingMealCompletion,
        }));
      } finally {
        inFlightCompletions.current.delete(actionKey);
      }
    },

    [dietPlan, user, checkRequiredData]
  );

  const handleFoodItemComplete: HandleFoodItemCompleteType = useCallback(
    async (
      day: string,
      mealType: string,
      foodIndex: number,
      completed: boolean
    ) => {
      const actionKey = `food-complete-${day}-${mealType}-${foodIndex}`;
      // Prevent double-toggling the same food item while allowing other actions
      if (inFlightCompletions.current.has(actionKey)) {
        // Silently ignore double-toggling the same completion action
        return;
      }
      if (!checkRequiredData(actionKey)) return;
      setActionErrors((prev) => ({ ...prev, [actionKey]: '' }));
      inFlightCompletions.current.add(actionKey);

      // Defensive: Only treat as array if it actually is, due to possible union type (FoodItem[] | TwoWeekMeal)
      const foodItemsRaw = dietPlan?.days[day]?.meals?.[mealType];
      const foodItems: FoodItem[] = Array.isArray(foodItemsRaw) ? foodItemsRaw : [];
      const foodItem = foodItems[foodIndex];
      if (!foodItem || !foodItem.id) {
        setActionErrors((prev) => ({
          ...prev,
          [actionKey]: 'Food item not found',
        }));
        return;
      }
      const foodItemId = foodItem.id;

      // Optimistically update the SWR cache for immediate UI feedback
      await mutate(
        DIET_PLAN_CACHE_KEY,
        (current: any) => {
          if (!current) return current;
          const updated = { ...current };
          if (
            updated.days &&
            updated.days[day] &&
            updated.days[day].meals &&
            updated.days[day].meals[mealType]
          ) {
            updated.days[day].meals[mealType] = updated.days[day].meals[
              mealType
            ].map((item: FoodItem, idx: number) =>
              idx === foodIndex ? { ...item, completed } : item
            );
          }
          return updated;
        },
        false // Do not revalidate yet
      );

      try {
        await dietPlanApi.setFoodItemCompletion({
          userId: user!.id as string,
          dietPlanId: dietPlan!.id as string,
          foodItemId,
          completed,
        });
        // No need to revalidate here; API already does it after mutation
      } catch (err) {
        // Roll back optimistic update if server call fails
        await mutate(DIET_PLAN_CACHE_KEY);
        setActionErrors((prev) => ({
          ...prev,
          [actionKey]: en.dietPlan.errorUpdatingFoodCompletion,
        }));
      } finally {
        inFlightCompletions.current.delete(actionKey);
      }
    },
    // Only include true dependencies; do not include isProcessing
    [dietPlan, user, checkRequiredData]
  );

  // Helper to check if a completion action is in flight for a given key
  const isCompletionInFlight = (key: string) => inFlightCompletions.current.has(key);

  return {
    editingMeals,
    isProcessing,
    actionErrors,
    isLoading: dietPlanLoading || userLoading,

    handleEditMeal,
    handleSaveMeal,
    handleMealComplete,
    handleFoodItemComplete,
    isCompletionInFlight,
  };
}

export default useDietPlanActions;
