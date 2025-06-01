import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/app/components/ui/card';
import { FoodItem, TwoWeekMeal } from '@/app/lib/types';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge'; // Import shadcn badge for calories chip
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  PlusCircle,
  Trash2,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  Loader,
} from 'lucide-react';

import { Skeleton } from '@/app/components/ui/skeleton';

import en from '@/shared/language/en';

interface MealCardProps {
  title: string;
  mealType: string;
  foodItems: FoodItem[] | TwoWeekMeal;
  totalCalories?: number;
  completed?: boolean;
  onComplete?: (completed: boolean) => void;
  editable?: boolean;
  isEditing?: boolean; // Control editing state from parent
  isLoading?: {
    save?: boolean;
    mealComplete?: boolean;
    foodComplete?: boolean;
  };
  errors?: {
    save?: string;
    mealComplete?: string;
    foodComplete?: string;
  };
  onEdit?: () => void;
  onSave?: (foodItems: FoodItem[]) => void;
  onFoodItemComplete?: (index: number, completed: boolean) => void;
  isCompletionInFlight: (key: string) => boolean;
  day: string;
}

// Helper function to process foodItems which could be FoodItem[] or TwoWeekMeal
const processFoodItems = (items: FoodItem[] | TwoWeekMeal, selectedWeek?: number): FoodItem[] => {
  if (Array.isArray(items)) {
    return items;
  } else if (items && typeof items === 'object') {
    // It's a TwoWeekMeal object
    return selectedWeek === 2 ? items.week2 : items.week1;
  }
  return [];
};

export function MealCard({
  title,
  mealType,
  foodItems,
  totalCalories,
  completed = false,
  onComplete,
  editable = false,
  isEditing: externalIsEditing,
  isLoading = {},
  errors = {},
  onEdit,
  onSave,
  onFoodItemComplete,
  isCompletionInFlight,
  day,
}: MealCardProps) {
  // Extract the current week from the day string if it contains 'week'
  const weekMatch = day && day.match(/week(\d+)_/);
  const currentWeek = weekMatch ? parseInt(weekMatch[1]) : 1;
  
  // Process the foodItems to ensure we're working with FoodItem[]
  const processedFoodItems = processFoodItems(foodItems, currentWeek);
  
  const [internalIsEditing, setInternalIsEditing] = React.useState(false);
  const [editItems, setEditItems] = React.useState<FoodItem[]>(processedFoodItems);
  const [expandedItems, setExpandedItems] = React.useState<
    Record<number, boolean>
  >({});

  const isEditing =
    externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;

  React.useEffect(() => {
    setEditItems(processedFoodItems);
  }, [processedFoodItems, currentWeek, isEditing]);

  const toggleItemExpanded = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleMealComplete = () => {
    if (onComplete) onComplete(!completed);
  };

  const handleFoodItemComplete = (idx: number, isCompleted: boolean) => {
    const updatedItems = processedFoodItems.map((item: FoodItem, i: number) =>
      i === idx ? { ...item, completed: isCompleted } : item
    );
    setEditItems(updatedItems);

    if (onFoodItemComplete) {
      onFoodItemComplete(idx, isCompleted);
    }
    if (!isEditing && onSave) {
      onSave(updatedItems);
    }
  };

  const handleEdit = () => {
    setInternalIsEditing(true);
    if (onEdit) onEdit();
  };

  const handleSave = () => {
    setInternalIsEditing(false);
    if (onSave) onSave(editItems);
  };

  const handleCancel = () => {
    setInternalIsEditing(false);
    setEditItems(processedFoodItems); // Reset to original items
  };

  const handleItemChange = (
    idx: number,
    key: keyof FoodItem,
    value: string | number | boolean
  ) => {
    setEditItems((items) =>
      items.map((item, i) => (i === idx ? { ...item, [key]: value } : item))
    );
  };

  const handleAddItem = () => {
    setEditItems([
      ...editItems,
      { food: '', calories: 0, quantity: 0, unit: 'g', completed: false },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    setEditItems((items) => items.filter((_, i) => i !== idx));
  };

  return (
    <Card className='w-full'>
      <CardHeader className='pb-2'>
        <CardTitle className='flex justify-between items-center'>
          <div className='flex items-center gap-2'>
            <span className='text-lg font-medium'>{title}</span>
          </div>

          {totalCalories !== undefined && (
            <span className='text-sm font-normal bg-secondary px-2 py-1 rounded-md'>
              {totalCalories} {en.calories}
            </span>
          )}
        </CardTitle>

        {onComplete && (
          <div className='flex items-center gap-2 mt-2'>
            {(() => {
              const mealKey = `meal-complete-${day}-${title}`;
              const mealLoading = isCompletionInFlight(mealKey);

              return (
                <>
                  <Checkbox
                    id={`meal-${title.replace(/\s+/g, '-').toLowerCase()}`}
                    checked={completed}
                    onCheckedChange={handleMealComplete}
                    disabled={mealLoading}
                    aria-label={`${en.markAsCompleted}: ${title}`}
                  />
                  <Label
                    htmlFor={`meal-${title.replace(/\s+/g, '-').toLowerCase()}`}
                    className={completed ? 'text-muted-foreground' : ''}
                  >
                    {en.markAsCompleted}
                    {mealLoading && (
                      <Loader className='h-3 w-3 ml-1 inline animate-spin' />
                    )}
                  </Label>
                </>
              );
            })()}
          </div>
        )}
      </CardHeader>
      <CardContent className='pt-0'>
        {(errors.save || errors.mealComplete || errors.foodComplete) && (
          <div className='mb-3 p-2 border border-red-200 bg-red-50 rounded-md text-red-600 text-sm'>
            {errors.save || errors.mealComplete || errors.foodComplete}
          </div>
        )}
        {isEditing ? (
          <div className='space-y-4'>
            {editItems.map((item, idx) => (
              <div key={idx} className='flex flex-col space-y-2 border-b pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2 flex-1'>
                    <Input
                      type='text'
                      value={item.food}
                      onChange={(e) =>
                        handleItemChange(idx, 'food', e.target.value)
                      }
                      placeholder={en.food}
                      className='flex-1'
                    />
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => handleRemoveItem(idx)}
                    aria-label={en.remove}
                    className='h-8 w-8 text-red-600'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
                <div className='grid grid-cols-3 gap-2 mb-2'>
                  <div>
                    <Label
                      htmlFor={`quantity-${idx}`}
                      className='text-xs mb-1 block'
                    >
                      {en.quantity}
                    </Label>
                    <Input
                      id={`quantity-${idx}`}
                      type='number'
                      value={item.quantity ?? 0}
                      onChange={(e) =>
                        handleItemChange(
                          idx,
                          'quantity',
                          Number(e.target.value)
                        )
                      }
                      className='h-8'
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor={`unit-${idx}`}
                      className='text-xs mb-1 block'
                    >
                      {en.unit}
                    </Label>
                    <Input
                      id={`unit-${idx}`}
                      type='text'
                      value={item.unit ?? 'g'}
                      onChange={(e) =>
                        handleItemChange(idx, 'unit', e.target.value)
                      }
                      className='h-8'
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor={`calories-${idx}`}
                      className='text-xs mb-1 block'
                    >
                      {en.calories}
                    </Label>
                    <Input
                      id={`calories-${idx}`}
                      type='number'
                      value={item.calories ?? 0}
                      onChange={(e) =>
                        handleItemChange(
                          idx,
                          'calories',
                          Number(e.target.value)
                        )
                      }
                      className='h-8'
                    />
                  </div>
                </div>

                {/* Macronutrient inputs */}
                <div className='grid grid-cols-4 gap-2'>
                  <div>
                    <Label
                      htmlFor={`carbs-${idx}`}
                      className='text-xs mb-1 block'
                    >
                      {en.carbs} (g)
                    </Label>
                    <Input
                      id={`carbs-${idx}`}
                      type='number'
                      value={item.carbs ?? 0}
                      onChange={(e) =>
                        handleItemChange(idx, 'carbs', Number(e.target.value))
                      }
                      className='h-8'
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor={`sugars-${idx}`}
                      className='text-xs mb-1 block'
                    >
                      {en.sugars} (g)
                    </Label>
                    <Input
                      id={`sugars-${idx}`}
                      type='number'
                      value={item.sugars ?? 0}
                      onChange={(e) =>
                        handleItemChange(idx, 'sugars', Number(e.target.value))
                      }
                      className='h-8'
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor={`protein-${idx}`}
                      className='text-xs mb-1 block'
                    >
                      {en.protein} (g)
                    </Label>
                    <Input
                      id={`protein-${idx}`}
                      type='number'
                      value={item.protein ?? 0}
                      onChange={(e) =>
                        handleItemChange(idx, 'protein', Number(e.target.value))
                      }
                      className='h-8'
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor={`fat-${idx}`}
                      className='text-xs mb-1 block'
                    >
                      {en.fat} (g)
                    </Label>
                    <Input
                      id={`fat-${idx}`}
                      type='number'
                      value={item.fat ?? 0}
                      onChange={(e) =>
                        handleItemChange(idx, 'fat', Number(e.target.value))
                      }
                      className='h-8'
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type='button'
              variant='ghost'
              onClick={handleAddItem}
              className='flex items-center text-primary text-sm'
            >
              <PlusCircle className='h-4 w-4 mr-1' />
              {en.addFood}
            </Button>
          </div>
        ) : (
          <ul className='space-y-4'>
            {processedFoodItems.map((item: FoodItem, index: number) => {
              // Use mealType (not title) for key generation to match action logic
              const foodKey =
                day && mealType !== undefined
                  ? `food-complete-${day}-${mealType}-${index}`
                  : undefined;
              const itemLoading =
                foodKey && isCompletionInFlight
                  ? isCompletionInFlight(foodKey)
                  : isLoading.foodComplete;
              return (
                <li key={index} className='border-b pb-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2 flex-1'>
                      <Checkbox
                        id={`food-item-${index}`}
                        checked={item.completed || false}
                        onCheckedChange={(checked) =>
                          handleFoodItemComplete(index, checked === true)
                        }
                        disabled={itemLoading}
                        aria-label={`${en.markAsCompleted}: ${item.food}`}
                      />
                      {itemLoading && (
                        <Loader className='h-3 w-3 ml-1 animate-spin text-muted-foreground' />
                      )}
                      <Label
                        htmlFor={`food-item-${index}`}
                        className={`flex-1 ${
                          item.completed
                            ? 'line-through text-muted-foreground'
                            : ''
                        }`}
                      >
                        <span className='font-medium'>{item.food}</span>
                        {item.quantity && item.unit && (
                          <span className='text-sm text-muted-foreground ml-2'>
                            {item.quantity} {item.unit}
                          </span>
                        )}
                      </Label>
                    </div>
                    {/* Toggle for expanded food item details */}
                    {/* Calories badge is placed at the end of the row for clarity and consistency with day buttons. It uses a neutral/grey background, is non-clickable, and matches the day button's border radius (rounded-md). */}
<Badge
  className="ml-2 bg-muted text-muted-foreground rounded-md pointer-events-none select-none h-7 px-2 flex items-center"
  variant="secondary"
>
  {item.calories} {en.calories}
</Badge>
<button
  type='button'
  className='ml-2 text-muted-foreground'
  onClick={() => toggleItemExpanded(index)}
  aria-label={
    expandedItems[index] ? en.hideDetails : en.showDetails
  }
>
  {expandedItems[index] ? (
    <ChevronUp className='h-4 w-4' />
  ) : (
    <ChevronDown className='h-4 w-4' />
  )}
</button>
                  </div>
                  {/* Nutrition transparency: show all food item macros for user clarity */}
                  {expandedItems[index] && (
                    <div className='mt-2 ml-8 p-3 bg-muted/50 rounded-md text-sm'>
                      {/* This section is shown to provide full macro breakdown for each food item, supporting user nutrition transparency and compliance with app business rules. */}
                      <div className='grid grid-cols-2 gap-x-4 gap-y-1'>
                        <div className='flex justify-between'>
                          <span>{en.carbs}:</span>
                          <span className='font-medium'>
                            {item.carbs || 0}g
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span>{en.sugars}:</span>
                          <span className='font-medium'>
                            {item.sugars || 0}g
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span>{en.protein}:</span>
                          <span className='font-medium'>
                            {item.protein || 0}g
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span>{en.fat}:</span>
                          <span className='font-medium'>{item.fat || 0}g</span>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      <CardFooter className='flex justify-between items-center pt-2'>
        {/* Edit/Save buttons */}
        <div>
          {isEditing ? (
            <div className='flex gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleSave}
                className='flex items-center'
                disabled={isLoading.save}
              >
                {isLoading.save ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-1 animate-spin' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='h-4 w-4 mr-1' />
                    {en.save}
                  </>
                )}
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={handleCancel}
                className='flex items-center'
              >
                <X className='h-4 w-4 mr-1' />
                {en.cancel}
              </Button>
            </div>
          ) : (
            editable && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => onEdit?.()}
                className='flex items-center'
                disabled={
                  isLoading.save ||
                  isLoading.mealComplete ||
                  isLoading.foodComplete
                }
              >
                <Edit className='h-4 w-4 mr-1' />
                {en.editMeal}
              </Button>
            )
          )}
        </div>
        {/* Total calories (shown always) */}
        {totalCalories !== undefined && (
          <div className='text-sm font-medium'>
            {en.total}{' '}
            <span className='font-bold'>
              {totalCalories} {en.calories}
            </span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
