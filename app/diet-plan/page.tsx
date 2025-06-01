'use client';

import { useState, useEffect } from 'react';
import { useDietPlan } from '@/app/context/DietPlanContext';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { useDietPlanActions } from '@/app/hooks/useDietPlanActions';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/app/components/ui/tabs';
import { Skeleton } from '@/app/components/ui/skeleton';
import { MealCard } from '@/app/components/custom/MealCard';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import {
  getCurrentWeekAndDay,
  formatWeekDay,
} from '@/app/lib/getCurrentWeekAndDay';
import en from '@/shared/language/en';
import { Button } from '@/app/components/ui/button';

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

  // State for tracking selected week (1 or 2)
  const [selectedWeek, setSelectedWeek] = useState<1 | 2>(1);

  const searchParams = useSearchParams();
  const planIdFromUrl = searchParams?.get('planId');
  const forceLoad = searchParams?.get('forceLoad') === 'true';
  
  const { dietPlan, loading: dietPlanLoading, refreshDietPlan } = useDietPlan();
  const { user } = useAuth();
  const {
    editingMeals,
    isProcessing,
    actionErrors,
    isLoading: actionsLoading,
    handleEditMeal,
    handleSaveMeal,
    handleMealComplete,
    handleFoodItemComplete,
    isCompletionInFlight,
  } = useDietPlanActions();

  // Combined loading state
  const loading = dietPlanLoading || actionsLoading;

  // Get current week and day based on diet plan's start date
  const [currentWeekAndDay, setCurrentWeekAndDay] = useState<{
    week: 1 | 2;
    day: string;
  }>({ week: 1, day: 'Monday' });

  // Update current week and day when diet plan data is loaded
  useEffect(() => {
    if (!loading && dietPlan?.startDate) {
      const { week, day } = getCurrentWeekAndDay(dietPlan.startDate);
      setCurrentWeekAndDay({ week, day });
      setSelectedWeek(week); // Set selected week to current week in the cycle
    }
  }, [loading, dietPlan?.startDate]);
  
  // Function to check if diet plan has two weeks of data
  const hasTwoWeeks = () => {
    if (!dietPlan?.days) return false;
    
    // Get all day keys
    const dayKeys = Object.keys(dietPlan.days);
    
    // Method 1: Look for explicit week2 pattern in day keys
    const hasWeek2Pattern = dayKeys.some(key => {
      return key.includes('week2') || key.includes('Week2');
    });
    
    // Method 2: Check if we have both week1 and week2 prefixed days
    const hasWeek1Days = dayKeys.some(key => key.startsWith('week1_'));
    const hasWeek2Days = dayKeys.some(key => key.startsWith('week2_'));
    const hasBothWeeks = hasWeek1Days && hasWeek2Days;
    
    // Method 3: Check if we have 14 days (7 days × 2 weeks)
    // This is a fallback for plans that might use a different naming convention
    const hasFourteenDays = dayKeys.length >= 14;
    
    // A plan has two weeks if any of the detection methods returns true
    const isTwoWeekPlan = hasWeek2Pattern || hasBothWeeks || hasFourteenDays;
    
    return isTwoWeekPlan;
  };

  // Force refresh when plan ID changes in URL or when forceLoad is true
  useEffect(() => {
    if (planIdFromUrl) {
      console.log('Loading diet plan with ID:', planIdFromUrl);
      
      // If forceLoad is true, explicitly refresh the data
      if (forceLoad) {
        console.log('Force loading diet plan data');
        refreshDietPlan();
      }
    }
  }, [planIdFromUrl, forceLoad, refreshDietPlan]);

  // State to track the active tab
  const [activeTab, setActiveTab] = useState<string>('');
  
  // Format the default tab with week prefix
  const currentDay = currentWeekAndDay.day;
  const defaultTab = formatWeekDay(
    selectedWeek,
    days.includes(currentDay) ? currentDay : days[0]
  );
  
  // Set initial active tab when component mounts or when defaultTab changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

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
                <div className='flex space-x-2 justify-center overflow-x-auto scrollbar-none pb-2'>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className='flex-shrink-0'>
                      <Skeleton className='h-10 w-20' />
                    </div>
                  ))}
                </div>

                {Array.from({ length: 4 }).map((_, i) => (
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

          {/* Week selector */}
          <div className='flex justify-between items-center mb-4'>
            <div className='text-sm text-muted-foreground'>
              Today is {currentDay} {hasTwoWeeks() && `(Week ${currentWeekAndDay.week})`}
            </div>
            {hasTwoWeeks() && (
              <div className='flex space-x-2'>
                <Button
                  variant={selectedWeek === 1 ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => {
                    setSelectedWeek(1);
                    // Update the active tab to show the same day in the new week
                    const newActiveTab = formatWeekDay(1, currentDay);
                    setActiveTab(newActiveTab);
                  }}
                  className='px-4'
                >
                  Week 1
                </Button>
                <Button
                  variant={selectedWeek === 2 ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => {
                    setSelectedWeek(2);
                    // Update the active tab to show the same day in the new week
                    const newActiveTab = formatWeekDay(2, currentDay);
                    setActiveTab(newActiveTab);
                  }}
                  className='px-4'
                >
                  Week 2
                </Button>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue={defaultTab} className='mb-4'>
            <TabsList className='flex-nowrap overflow-x-auto scrollbar-none w-full'>
              {days.map((day) => (
                <TabsTrigger
                  key={formatWeekDay(selectedWeek, day)}
                  value={formatWeekDay(selectedWeek, day)}
                  className={day === currentDay ? 'font-bold' : ''}
                >
                  {day}
                </TabsTrigger>
              ))}
            </TabsList>
            {days.map((day) => (
              <TabsContent
                key={formatWeekDay(selectedWeek, day)}
                value={formatWeekDay(selectedWeek, day)}
              >
                {dietPlan.days &&
                dietPlan.days[`week${selectedWeek}_${day}`] &&
                dietPlan.days[`week${selectedWeek}_${day}`].meals &&
                Object.keys(dietPlan.days[`week${selectedWeek}_${day}`].meals)
                  .length > 0 ? (
                  ['breakfast', 'lunch', 'snack', 'dinner']
                    .filter(
                      (mealType) =>
                        dietPlan.days[`week${selectedWeek}_${day}`].meals[
                          mealType
                        ]
                    )
                    .map((mealType) => {
                      const mealData =
                        dietPlan.days[`week${selectedWeek}_${day}`].meals[
                          mealType
                        ] || [];
                      return [mealType as string, mealData] as [
                        string,
                        typeof mealData
                      ];
                    })
                    .map(([mealType, meal]) => (
                      <div className='mb-2' key={mealType}>
                        <MealCard
                          title={mealType}
                          foodItems={meal ?? []}
                          isEditing={
                            editingMeals[
                              `week${selectedWeek}_${day}-${mealType}`
                            ]
                          }
                          mealType={mealType}
                          isCompletionInFlight={isCompletionInFlight}
                          day={day}
                          isLoading={{
                            save:
                              isProcessing[
                                `save-week${selectedWeek}_${day}-${mealType}`
                              ] || false,
                            mealComplete:
                              isProcessing[
                                `meal-complete-week${selectedWeek}_${day}-${mealType}`
                              ] || false,
                            foodComplete: Object.keys(isProcessing).some(
                              (key) =>
                                key.startsWith(
                                  `food-complete-week${selectedWeek}_${day}-${mealType}`
                                )
                            ),
                          }}
                          errors={{
                            save: actionErrors[
                              `save-week${selectedWeek}_${day}-${mealType}`
                            ],
                            mealComplete:
                              actionErrors[
                                `meal-complete-week${selectedWeek}_${day}-${mealType}`
                              ],
                            foodComplete: Object.entries(actionErrors)
                              .filter(([key]) =>
                                key.startsWith(
                                  `food-complete-week${selectedWeek}_${day}-${mealType}`
                                )
                              )
                              .map(([_, value]) => value)
                              .filter(Boolean)[0],
                          }}
                          onEdit={() =>
                            handleEditMeal(
                              `week${selectedWeek}_${day}`,
                              mealType
                            )
                          }
                          onSave={(updatedFoodItems) =>
                            handleSaveMeal(
                              `week${selectedWeek}_${day}`,
                              mealType,
                              updatedFoodItems
                            )
                          }
                          onComplete={(completed) =>
                            handleMealComplete(
                              `week${selectedWeek}_${day}`,
                              mealType,
                              completed
                            )
                          }
                          onFoodItemComplete={(foodIndex, completed) =>
                            handleFoodItemComplete(
                              `week${selectedWeek}_${day}`,
                              mealType,
                              foodIndex,
                              completed
                            )
                          }
                        />
                      </div>
                    ))
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
