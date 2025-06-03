import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to get Supabase admin client
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    throw new Error('Missing required environment variables for Supabase client');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    // Initialize Supabase client only when the route is called
    const supabase = getSupabaseAdmin();
    
    const body = await req.json();
    const { userId, foodItemId, completed } = body;

    if (!userId || !foodItemId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }
    
    // Processing food item completion request
    
    // First, get the meal_food_item record to update
    const { data: mealFoodItem, error: mealFoodItemError } = await supabase
      .from('meal_food_items')
      .select('*')
      .eq('id', foodItemId)
      .single();
      
    if (mealFoodItemError) {
      console.error('Error finding meal food item');
      return NextResponse.json(
        {
          success: false,
          error: `Food item not found: ${mealFoodItemError.message}`,
        },
        { status: 404 }
      );
    }
    
    // Update the meal_food_item record
    const { error: updateError } = await supabase
      .from('meal_food_items')
      .update({ completed })
      .eq('id', foodItemId);

    if (updateError) {
      console.error('Error updating meal food item');
      return NextResponse.json(
        {
          success: false,
          error: `Error updating food item: ${updateError.message}`,
        },
        { status: 500 }
      );
    }
    
    // Now handle the user completion record
    const { data: existingRecord } = await supabase
      .from('user_food_item_completion')
      .select('*')
      .eq('user_id', userId)
      .eq('meal_food_item_id', foodItemId)
      .maybeSingle();

    let completionError = null;

    if (existingRecord) {
      const { error } = await supabase
        .from('user_food_item_completion')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('user_id', userId)
        .eq('meal_food_item_id', foodItemId);

      completionError = error;
    } else {
      const { error } = await supabase
        .from('user_food_item_completion')
        .insert({
          user_id: userId,
          meal_food_item_id: foodItemId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        });

      completionError = error;
    }

    if (completionError) {
      console.error('Error updating user food item completion');
      return NextResponse.json(
        {
          success: false,
          error: `Error updating food completion: ${completionError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Food item completion status updated successfully',
    });
  } catch (error) {
    console.error('Error processing food completion request');
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
