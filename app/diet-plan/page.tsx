"use client";

import { useEffect, useState } from "react";

// UI Components
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { MealCard } from "@/app/components/custom/meal-card";
import { Skeleton } from "@/app/components/ui/skeleton";
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import DashboardLayout from "@/app/components/layout/DashboardLayout";

// Data and utilities
import { getDietData, formatDayName, calculateMealCalories } from "@/app/lib/data";
import { DietData, FoodItem } from "@/app/lib/types";
import { getCurrentDay } from "@/app/lib/getCurrentDay";
import en from "@/shared/language/en";

export default function DietPlanPage() {
  // Days of the week
  const days = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  // State for diet data and loading
  const [dietData, setDietData] = useState<DietData | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine current day for default tab selection
  const currentDay = getCurrentDay();
  const defaultTab = days.includes(currentDay) ? currentDay : 'monday';

  useEffect(() => {
    // Fetch diet data on mount
    getDietData().then((data) => {
      setDietData(data);
      setLoading(false);
    });
  }, []);

  // Render loading skeleton while fetching
  if (loading || !dietData) {
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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">{en.weeklyDietPlan}</h1>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="w-full flex justify-between mb-8 overflow-x-auto">
              {days.map((day: string) => (
                <TabsTrigger key={day} value={day} className="flex-1">
                  {formatDayName(day)}
                </TabsTrigger>
              ))}
            </TabsList>

            {days.map((day: string) => {
              const dayData = dietData.days[day];

              return (
                <TabsContent key={day} value={day} className="space-y-8">
                  {dayData && dayData.meals && Object.entries(dayData.meals).map(([mealType, foodItems]: [string, FoodItem[]]) => {
                    // Calculate total calories for the meal
                    const totalCalories = calculateMealCalories(foodItems as FoodItem[]);

                    return (
                      // Pass mealType as 'title' to match MealCardProps interface
                      <MealCard
                        key={mealType}
                        title={mealType}
                        foodItems={foodItems as FoodItem[]}
                        totalCalories={totalCalories}
                      />
                    );
                  })}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}