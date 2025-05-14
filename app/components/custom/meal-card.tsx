import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/app/components/ui/card";
import { FoodItem } from "@/app/lib/types";

import en from '@/shared/language/en';

interface MealCardProps {
  title: string;
  foodItems: FoodItem[];
  totalCalories?: number;
  completed?: boolean;
  onComplete?: (completed: boolean) => void;
  editable?: boolean;
  onEdit?: () => void;
  onSave?: (foodItems: FoodItem[]) => void;
}

export function MealCard({ title, foodItems, totalCalories, completed = false, onComplete, editable = false, onEdit, onSave }: MealCardProps) {
  // Local state for edit mode
  const [isEditing, setIsEditing] = React.useState(false);
  const [editItems, setEditItems] = React.useState<FoodItem[]>(foodItems);

  // Handle toggling completion
  const handleTick = () => {
    if (onComplete) onComplete(!completed);
  };

  // Handle entering edit mode
  const handleEdit = () => {
    setIsEditing(true);
    if (onEdit) onEdit();
  };

  // Handle saving edits
  const handleSave = () => {
    setIsEditing(false);
    if (onSave) onSave(editItems);
  };

  // Handle updating food/calories
  const handleItemChange = (idx: number, key: keyof FoodItem, value: string | number) => {
    setEditItems(items => items.map((item, i) => i === idx ? { ...item, [key]: value } : item));
  };

  // Handle adding a new item
  const handleAddItem = () => {
    setEditItems([...editItems, { food: '', calories: 0 }]);
  };

  // Handle removing an item
  const handleRemoveItem = (idx: number) => {
    setEditItems(items => items.filter((_, i) => i !== idx));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* Completion tick (checkbox) */}
            <input
              type="checkbox"
              checked={completed}
              onChange={handleTick}
              aria-label={en.mealCompleted}
              className="accent-green-600"
            />
            <span>{title}</span>
          </div>
          {totalCalories !== undefined && (
            <span className="text-sm font-normal bg-secondary px-2 py-1 rounded-md">
              {totalCalories} kcal
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <ul className="space-y-2">
            {editItems.map((item, idx) => (
              <li key={idx} className="flex gap-2 items-center border-b pb-2">
                <input
                  type="text"
                  value={item.food}
                  onChange={e => handleItemChange(idx, 'food', e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                  placeholder={en.food}
                  aria-label={en.food}
                />
                <input
                  type="number"
                  value={item.calories ?? 0}
                  onChange={e => handleItemChange(idx, 'calories', Number(e.target.value))}
                  className="border rounded px-2 py-1 w-20 text-sm"
                  placeholder={en.calories}
                  aria-label={en.calories}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="text-xs text-red-600 hover:underline"
                  aria-label={en.remove}
                >
                  {en.remove}
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-primary hover:underline mt-2"
                aria-label={en.addFood}
              >
                + {en.addFood}
              </button>
            </li>
          </ul>
        ) : (
          <ul className="space-y-2">
            {foodItems.map((item, index) => (
              <li key={index} className="flex justify-between items-center border-b pb-2">
                <span>{item.food}</span>
                {item.calories !== null && (
                  <span className="text-sm text-muted-foreground">
                    {item.calories} kcal
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        {/* Edit/Save buttons */}
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs text-green-600 hover:underline"
              aria-label={en.save}
            >
              {en.save}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-muted-foreground hover:underline ml-4"
              aria-label={en.cancel}
            >
              {en.cancel}
            </button>
          </>
        ) : (
          editable && (
            <button
              type="button"
              onClick={handleEdit}
              className="text-xs text-blue-600 hover:underline"
              aria-label={en.editMeal}
            >
              {en.editMeal}
            </button>
          )
        )}
        {/* Total calories (shown always) */}
        {totalCalories !== undefined && (
          <div className="text-sm text-muted-foreground">
            {en.total} <span className="font-medium">{totalCalories} kcal</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}