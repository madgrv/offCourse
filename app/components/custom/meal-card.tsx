import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/app/components/ui/card";
import { FoodItem } from "@/app/lib/types";

interface MealCardProps {
  title: string;
  foodItems: FoodItem[];
  totalCalories?: number;
}

export function MealCard({ title, foodItems, totalCalories }: MealCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{title}</span>
          {totalCalories && (
            <span className="text-sm font-normal bg-secondary px-2 py-1 rounded-md">
              {totalCalories} kcal
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {foodItems.map((item, index) => (
            <li key={index} className="flex justify-between items-center border-b pb-2">
              <span>{item.food}</span>
              {item.calories && (
                <span className="text-sm text-muted-foreground">
                  {item.calories} kcal
                </span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
      {totalCalories && (
        <CardFooter className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-medium">{totalCalories} kcal</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}