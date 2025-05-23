'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/app/components/ui/card';

import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useEffect } from 'react';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useDietPlan } from '@/app/context/DietPlanContext';

export default function AnalyticsPage() {
  const days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const { dietPlan, loading, error } = useDietPlan();

  useEffect(() => {
    if (dietPlan) {
    }
  }, [dietPlan]);

  if (loading || !dietPlan) {
    return (
      <DashboardLayout>
        <div className='container mx-auto px-4 py-8'>
          <Skeleton className='h-10 w-1/3 mb-6' />
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className='h-32 w-full' />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className='container mx-auto px-4 py-8'>
          <h1 className='text-3xl font-bold mb-6'>Error Loading Analytics</h1>
          <div className='p-6 bg-red-50 text-red-800 rounded-lg'>
            <p>{error}</p>
            <p className='mt-2'>Please try refreshing the page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const calorieData = days.map((day: string) => {
    const dayData = dietPlan.days[day];
    return {
      day,
      calories: dayData?.totalCalories || 0,
    };
  });

  const totalCalories = calorieData.reduce(
    (sum: number, day: { calories: number }) => sum + day.calories,
    0
  );
  const averageCalories = Math.round(totalCalories / calorieData.length);
  type CalorieDay = { day: string; calories: number };
  const maxCalorieDay = calorieData.reduce(
    (max: CalorieDay, day: CalorieDay) =>
      day.calories > max.calories ? day : max,
    calorieData[0]
  );
  const minCalorieDay = calorieData.reduce(
    (min: CalorieDay, day: CalorieDay) =>
      day.calories < min.calories && day.calories > 0 ? day : min,
    calorieData[0]
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className='container mx-auto px-4 py-8'>
          <h1 className='text-3xl font-bold mb-6'>Nutrition Analytics</h1>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            <Card>
              <CardHeader>
                <CardTitle>Average Daily Calories</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-3xl font-bold'>{averageCalories} kcal</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Highest Calorie Day</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-3xl font-bold'>
                  {maxCalorieDay.calories} kcal
                </p>
                <p className='text-sm text-muted-foreground'>
                  {maxCalorieDay.day}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Lowest Calorie Day</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-3xl font-bold'>
                  {minCalorieDay.calories} kcal
                </p>
                <p className='text-sm text-muted-foreground'>
                  {minCalorieDay.day}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className='mb-8'>
            <CardHeader>
              <CardTitle>Weekly Calorie Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-80 w-full'>
                <div className='h-full flex items-end justify-between gap-2'>
                  {calorieData.map((day) => {
                    // Calculate bar height as percentage of max calories (max height = 90%)
                    const maxCalories = Math.max(
                      ...calorieData.map((d) => d.calories)
                    );
                    const heightPercentage = day.calories
                      ? (day.calories / maxCalories) * 90
                      : 0;
                    return (
                      <div
                        key={day.day}
                        className='flex flex-col items-center flex-1'
                      >
                        <div
                          className='w-full bg-primary rounded-t-md transition-all duration-500'
                          style={{ height: `${heightPercentage}%` }}
                        ></div>
                        <div className='mt-2 text-xs font-medium'>
                          {day.day.substring(0, 3)}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {day.calories} kcal
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Daily Intake</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex justify-between items-center'>
                  <span>Adult Male</span>
                  <span className='font-medium'>
                    {dietPlan.nutritionalInfo?.adultMale
                      ?.recommendedDailyIntake || 2500}{' '}
                    kcal
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span>Adult Female</span>
                  <span className='font-medium'>
                    {dietPlan.nutritionalInfo?.adultFemale
                      ?.recommendedDailyIntake || 2000}{' '}
                    kcal
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
