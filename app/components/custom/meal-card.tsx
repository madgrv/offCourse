import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/app/components/ui/card";
import { FoodItem } from "@/app/lib/types";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { PlusCircle, Trash2, Edit, Save, X, ChevronDown, ChevronUp, Info } from "lucide-react";

import en from '@/shared/language/en';

interface MealCardProps {
  title: string;
  foodItems: FoodItem[];
  totalCalories?: number;
  completed?: boolean;
  onComplete?: (completed: boolean) => void;
  editable?: boolean;
  isEditing?: boolean; // Control editing state from parent
  onEdit?: () => void;
  onSave?: (foodItems: FoodItem[]) => void;
  onFoodItemComplete?: (index: number, completed: boolean) => void;
}

export function MealCard({ 
  title, 
  foodItems, 
  totalCalories, 
  completed = false, 
  onComplete, 
  editable = false,
  isEditing: externalIsEditing, // Renamed to avoid conflict
  onEdit, 
  onSave,
  onFoodItemComplete 
}: MealCardProps) {
  // Local state for edit mode (if not controlled by parent)
  const [internalIsEditing, setInternalIsEditing] = React.useState(false);
  const [editItems, setEditItems] = React.useState<FoodItem[]>(foodItems);
  // Track which food items have their details expanded
  const [expandedItems, setExpandedItems] = React.useState<Record<number, boolean>>({});
  
  // Determine if we're in edit mode (controlled by parent or internal state)
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;

  // Update editItems when foodItems change or when entering edit mode
  React.useEffect(() => {
    setEditItems(foodItems);
  }, [foodItems, isEditing]);
  
  // Toggle expanded state for a food item
  const toggleItemExpanded = (index: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Handle toggling meal completion
  const handleMealComplete = () => {
    if (onComplete) onComplete(!completed);
  };

  // Handle toggling individual food item completion
  const handleFoodItemComplete = (idx: number, isCompleted: boolean) => {
    // Create a new array with the updated item
    const updatedItems = foodItems.map((item, i) => 
      i === idx ? { ...item, completed: isCompleted } : item
    );
    
    // Update local state
    setEditItems(updatedItems);
    
    // Call the parent component's handler if provided
    if (onFoodItemComplete) {
      onFoodItemComplete(idx, isCompleted);
    }
    
    // If onSave is provided and we're not in edit mode, save changes immediately
    if (!isEditing && onSave) {
      onSave(updatedItems);
    }
  };

  // Handle entering edit mode
  const handleEdit = () => {
    setInternalIsEditing(true);
    if (onEdit) onEdit();
  };

  // Handle saving edits
  const handleSave = () => {
    setInternalIsEditing(false);
    if (onSave) onSave(editItems);
  };

  // Handle cancelling edits
  const handleCancel = () => {
    setInternalIsEditing(false);
    setEditItems(foodItems); // Reset to original items
  };

  // Handle updating food item properties
  const handleItemChange = (idx: number, key: keyof FoodItem, value: string | number | boolean) => {
    setEditItems(items => items.map((item, i) => i === idx ? { ...item, [key]: value } : item));
  };

  // Handle adding a new item
  const handleAddItem = () => {
    setEditItems([...editItems, { food: '', calories: 0, quantity: 0, unit: 'g', completed: false }]);
  };

  // Handle removing an item
  const handleRemoveItem = (idx: number) => {
    setEditItems(items => items.filter((_, i) => i !== idx));
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* Meal completion checkbox */}
            <Checkbox
              id={`meal-${title.toLowerCase().replace(/\s+/g, '-')}`}
              checked={completed}
              onCheckedChange={handleMealComplete}
              aria-label={en.mealCompleted}
              className="text-green-600"
            />
            <Label 
              htmlFor={`meal-${title.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-lg font-medium"
            >
              {title}
            </Label>
          </div>
          {totalCalories !== undefined && (
            <span className="text-sm font-normal bg-secondary px-2 py-1 rounded-md">
              {totalCalories} {en.calories}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {isEditing ? (
          <div className="space-y-4">
            {editItems.map((item, idx) => (
              <div key={idx} className="flex flex-col space-y-2 border-b pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="text"
                      value={item.food}
                      onChange={e => handleItemChange(idx, 'food', e.target.value)}
                      placeholder={en.food}
                      className="flex-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(idx)}
                    aria-label={en.remove}
                    className="h-8 w-8 text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <Label htmlFor={`quantity-${idx}`} className="text-xs mb-1 block">
                      {en.quantity}
                    </Label>
                    <Input
                      id={`quantity-${idx}`}
                      type="number"
                      value={item.quantity ?? 0}
                      onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`unit-${idx}`} className="text-xs mb-1 block">
                      {en.unit}
                    </Label>
                    <Input
                      id={`unit-${idx}`}
                      type="text"
                      value={item.unit ?? 'g'}
                      onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`calories-${idx}`} className="text-xs mb-1 block">
                      {en.calories}
                    </Label>
                    <Input
                      id={`calories-${idx}`}
                      type="number"
                      value={item.calories ?? 0}
                      onChange={e => handleItemChange(idx, 'calories', Number(e.target.value))}
                      className="h-8"
                    />
                  </div>
                </div>
                
                {/* Macronutrient inputs */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor={`carbs-${idx}`} className="text-xs mb-1 block">
                      {en.carbs} (g)
                    </Label>
                    <Input
                      id={`carbs-${idx}`}
                      type="number"
                      value={item.carbs ?? 0}
                      onChange={e => handleItemChange(idx, 'carbs', Number(e.target.value))}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`sugars-${idx}`} className="text-xs mb-1 block">
                      {en.sugars} (g)
                    </Label>
                    <Input
                      id={`sugars-${idx}`}
                      type="number"
                      value={item.sugars ?? 0}
                      onChange={e => handleItemChange(idx, 'sugars', Number(e.target.value))}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`protein-${idx}`} className="text-xs mb-1 block">
                      {en.protein} (g)
                    </Label>
                    <Input
                      id={`protein-${idx}`}
                      type="number"
                      value={item.protein ?? 0}
                      onChange={e => handleItemChange(idx, 'protein', Number(e.target.value))}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`fat-${idx}`} className="text-xs mb-1 block">
                      {en.fat} (g)
                    </Label>
                    <Input
                      id={`fat-${idx}`}
                      type="number"
                      value={item.fat ?? 0}
                      onChange={e => handleItemChange(idx, 'fat', Number(e.target.value))}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              onClick={handleAddItem}
              className="flex items-center text-primary text-sm"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              {en.addFood}
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {foodItems.map((item, index) => (
              <li key={index} className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Checkbox
                      id={`food-item-${index}`}
                      checked={item.completed || false}
                      onCheckedChange={(checked) => 
                        handleFoodItemComplete(index, checked === true)
                      }
                      aria-label={`${en.markAsCompleted}: ${item.food}`}
                    />
                    <Label 
                      htmlFor={`food-item-${index}`}
                      className={`flex-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                    >
                      <span className="font-medium">{item.food}</span>
                      {item.quantity && item.unit && (
                        <span className="text-sm text-muted-foreground ml-2">
                          {item.quantity} {item.unit}
                        </span>
                      )}
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.calories !== null && (
                      <span className="text-sm font-medium">
                        {item.calories} {en.calories}
                      </span>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => toggleItemExpanded(index)}
                      aria-label={expandedItems[index] ? en.hideDetails : en.showDetails}
                    >
                      {expandedItems[index] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Expanded details section */}
                {expandedItems[index] && (
                  <div className="mt-2 ml-8 p-3 bg-muted/50 rounded-md text-sm">
                    <h4 className="font-medium mb-1 flex items-center gap-1">
                      <Info className="h-3 w-3" /> {en.nutritionalInfo}
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <div className="flex justify-between">
                        <span>{en.carbs}:</span>
                        <span className="font-medium">{item.carbs || 0}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{en.sugars}:</span>
                        <span className="font-medium">{item.sugars || 0}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{en.protein}:</span>
                        <span className="font-medium">{item.protein || 0}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{en.fat}:</span>
                        <span className="font-medium">{item.fat || 0}g</span>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-2">
        {/* Edit/Save buttons */}
        <div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSave}
                className="flex items-center"
              >
                <Save className="h-4 w-4 mr-1" />
                {en.save}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                {en.cancel}
              </Button>
            </div>
          ) : (
            editable && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                {en.editMeal}
              </Button>
            )
          )}
        </div>
        {/* Total calories (shown always) */}
        {totalCalories !== undefined && (
          <div className="text-sm font-medium">
            {en.total} <span className="font-bold">{totalCalories} {en.calories}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}