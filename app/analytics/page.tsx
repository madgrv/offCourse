"use client";

import { getDietData } from "@/app/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { DietData } from "@/app/lib/types";

import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function AnalyticsPage() {
  // Days of the week
  const days = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  // State for diet data and loading
  const [dietData, setDietData] = useState<DietData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Extract calorie data for each day
  const calorieData = days.map((day: string) => {
    const dayData = dietData.days[day];
    return {
      day: day.charAt(0).toUpperCase() + day.slice(1),
      calories: dayData?.totalCalories || 0
    };
  });

  // Calculate average daily calories
  const totalCalories = calorieData.reduce((sum: number, day: {calories: number}) => sum + day.calories, 0);
  const averageCalories = Math.round(totalCalories / calorieData.length);

  // Find max and min calorie days
  // Use a type that always includes 'day' for reduce
  type CalorieDay = { day: string; calories: number };
  const maxCalorieDay = calorieData.reduce((max: CalorieDay, day: CalorieDay) => day.calories > max.calories ? day : max, calorieData[0]);
  const minCalorieDay = calorieData.reduce((min: CalorieDay, day: CalorieDay) => day.calories < min.calories && day.calories > 0 ? day : min, calorieData[0]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Nutrition Analytics</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Average Daily Calories</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{averageCalories} kcal</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Highest Calorie Day</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{maxCalorieDay.calories} kcal</p>
                <p className="text-sm text-muted-foreground">{maxCalorieDay.day}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Lowest Calorie Day</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{minCalorieDay.calories} kcal</p>
                <p className="text-sm text-muted-foreground">{minCalorieDay.day}</p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Calorie Distribution Bar Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Weekly Calorie Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <div className="h-full flex items-end justify-between gap-2">
                  {calorieData.map((day) => {
                    // Calculate bar height as percentage of max calories (max height = 90%)
                    const maxCalories = Math.max(...calorieData.map(d => d.calories));
                    const heightPercentage = day.calories ? (day.calories / maxCalories) * 90 : 0;
                    return (
                      <div key={day.day} className="flex flex-col items-center flex-1">
                        <div
                          className="w-full bg-primary rounded-t-md transition-all duration-500"
                          style={{ height: `${heightPercentage}%` }}
                        ></div>
                        <div className="mt-2 text-xs font-medium">{day.day.substring(0, 3)}</div>
                        <div className="text-xs text-muted-foreground">{day.calories} kcal</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Daily Intake Section */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Daily Intake</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Adult Male</span>
                  <span className="font-medium">{dietData.nutritionalInfo.adultMale.recommendedDailyIntake} kcal</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Adult Female</span>
                  <span className="font-medium">{dietData.nutritionalInfo.adultFemale.recommendedDailyIntake} kcal</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}