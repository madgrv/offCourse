'use client';

import { useDietPlan } from '@/app/context/DietPlanContext';
import { useUser } from '@/app/context/UserContext';
import { useDietPlanActions } from '@/app/hooks/useDietPlanActions';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/app/components/ui/tabs';
import { Skeleton } from '@/app/components/ui/skeleton';
import { MealCard } from '@/app/components/custom/meal-card';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { getCurrentDay } from '@/app/lib/getCurrentDay';
import en from '@/shared/language/en';

export default function DietPlanPage() {
  const days = [
    en.dietPlan.monday,
    en.dietPlan.tuesday,
    en.dietPlan.wednesday,
    en.dietPlan.thursday,
    en.dietPlan.friday,
    en.dietPlan.saturday,
    en.dietPlan.sunday,
  ];

  const { dietPlan, loading: dietPlanLoading } = useDietPlan();
  const { user } = useUser();
  const {
    editingMeals,
    isProcessing,
    actionErrors,
    isLoading: actionsLoading,
    handleEditMeal,
    handleSaveMeal,
    handleMealComplete,
    handleFoodItemComplete,
  } = useDietPlanActions();

  // Combined loading state
  const loading = dietPlanLoading || actionsLoading;

  const currentDay = getCurrentDay();
  const defaultTab = days.includes(currentDay) ? currentDay : days[0];

  if (loading || !dietPlan) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className='container mx-auto px-4 py-8'>
            <h1 className='text-3xl font-bold mb-2'>
              {en.dietPlan.defaultTitle}
            </h1>

            {/* Skeleton loading UI */}
            <div className='space-y-6'>
              <div className='space-y-2'>
                <div className='flex space-x-2 overflow-x-auto pb-2'>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className='flex-shrink-0'>
                      <Skeleton className='h-10 w-20' />
                    </div>
                  ))}
                </div>

                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className='rounded-lg border p-4 space-y-4'>
                    <div className='flex justify-between items-center'>
                      <Skeleton className='h-6 w-24' />
                      <Skeleton className='h-6 w-16' />
                    </div>

                    {Array.from({ length: 3 }).map((_, j) => (
                      <div
                        key={j}
                        className='flex justify-between items-center py-2'
                      >
                        <Skeleton className='h-4 w-48' />
                        <Skeleton className='h-4 w-16' />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className='container mx-auto px-4 py-8'>
          <h1 className='text-3xl font-bold mb-2'>
            {dietPlan.planName || en.dietPlan.defaultTitle}
          </h1>
          <Tabs defaultValue={defaultTab}>
            <TabsList>
              {days.map((day) => (
                <TabsTrigger key={day} value={day}>
                  {day}
                </TabsTrigger>
              ))}
            </TabsList>
            {days.map((day) => (
              <TabsContent key={day} value={day}>
                {dietPlan.days &&
                dietPlan.days[day] &&
                dietPlan.days[day].meals &&
                Object.keys(dietPlan.days[day].meals).length > 0 ? (
                  ['breakfast', 'lunch', 'snack', 'dinner']
                    .filter(mealType => dietPlan.days[day].meals[mealType])
                    .map(mealType => {
                      const mealData = dietPlan.days[day].meals[mealType] || [];
                      return [mealType as string, mealData] as [string, typeof mealData];
                    })
                    .map(([mealType, meal]) => (
                      <div className='mb-2' key={mealType}>
                        <MealCard
                          title={mealType}
                          foodItems={meal ?? []}
                          isEditing={editingMeals[`${day}-${mealType}`]}
                          isLoading={{
                            save:
                              isProcessing[`save-${day}-${mealType}`] || false,
                            mealComplete:
                              isProcessing[
                                `meal-complete-${day}-${mealType}`
                              ] || false,
                            foodComplete: Object.keys(isProcessing).some(
                              (key) =>
                                key.startsWith(
                                  `food-complete-${day}-${mealType}`
                                )
                            ),
                          }}
                          errors={{
                            save: actionErrors[`save-${day}-${mealType}`],
                            mealComplete:
                              actionErrors[`meal-complete-${day}-${mealType}`],
                            foodComplete: Object.entries(actionErrors)
                              .filter(([key]) =>
                                key.startsWith(
                                  `food-complete-${day}-${mealType}`
                                )
                              )
                              .map(([_, value]) => value)
                              .filter(Boolean)[0],
                          }}
                          onEdit={() => handleEditMeal(day, mealType)}
                          onSave={(updatedFoodItems) =>
                            handleSaveMeal(day, mealType, updatedFoodItems)
                          }
                          onComplete={(completed) =>
                            handleMealComplete(day, mealType, completed)
                          }
                          onFoodItemComplete={(foodIndex, completed) =>
                            handleFoodItemComplete(
                              day,
                              mealType,
                              foodIndex,
                              completed
                            )
                          }
                        />
                      </div>
                    )
                  )
                ) : (
                  <div className='text-gray-500 italic py-4'>
                    {en.dietPlan.noMealsPlanned}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
