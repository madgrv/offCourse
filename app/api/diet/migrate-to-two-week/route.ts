import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required. Please provide a valid Bearer token.' },
        { status: 401 }
      );
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Create a Supabase client with the token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Get the user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Only allow admin users to run this migration
    const { data: userData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    // 1. Check if 'week' column exists in diet_food_items table
    const { data: columnInfo, error: columnCheckError } = await supabase
      .rpc('check_column_exists', {
        table_name: 'diet_food_items',
        column_name: 'week'
      });
    
    if (columnCheckError) {
      return NextResponse.json(
        { error: `Error checking column: ${columnCheckError.message}` },
        { status: 500 }
      );
    }
    
    // If column doesn't exist, add it
    if (!columnInfo || !columnInfo.exists) {
      // Add the week column with default value of 1
      const { error: alterTableError } = await supabase.rpc('execute_sql', {
        sql: 'ALTER TABLE diet_food_items ADD COLUMN week INTEGER DEFAULT 1'
      });
      
      if (alterTableError) {
        return NextResponse.json(
          { error: `Error adding week column: ${alterTableError.message}` },
          { status: 500 }
        );
      }
    }
    
    // 2. Fetch all diet plans
    const { data: dietPlans, error: plansError } = await supabase
      .from('diet_plans')
      .select('id, owner_id')
      .eq('is_template', false);
    
    if (plansError) {
      return NextResponse.json(
        { error: `Error fetching diet plans: ${plansError.message}` },
        { status: 500 }
      );
    }
    
    // 3. For each plan, update the data structure to support 2-week format
    const results = [];
    
    for (const plan of dietPlans || []) {
      // Get all food items for this plan
      const { data: foodItems, error: foodItemsError } = await supabase
        .from('diet_food_items')
        .select('id, day, meal_type, week')
        .eq('diet_plan_id', plan.id);
      
      if (foodItemsError) {
        results.push({
          planId: plan.id,
          error: `Error fetching food items: ${foodItemsError.message}`
        });
        continue;
      }
      
      // Group by day and meal type
      const dayMealGroups: Record<string, Set<string>> = {};
      
      for (const item of foodItems || []) {
        const key = `${item.day}-${item.meal_type}`;
        if (!dayMealGroups[key]) {
          dayMealGroups[key] = new Set();
        }
        dayMealGroups[key].add(item.id);
      }
      
      // For each day-meal group, create a copy for week 2 if it doesn't exist
      for (const [key, itemIds] of Object.entries(dayMealGroups)) {
        const [day, mealType] = key.split('-');
        
        // Check if any items already have week=2
        const { data: week2Items, error: week2Error } = await supabase
          .from('diet_food_items')
          .select('id')
          .eq('diet_plan_id', plan.id)
          .eq('day', day)
          .eq('meal_type', mealType)
          .eq('week', 2);
        
        if (week2Error) {
          results.push({
            planId: plan.id,
            day,
            mealType,
            error: `Error checking week 2 items: ${week2Error.message}`
          });
          continue;
        }
        
        // If no week 2 items exist, duplicate the week 1 items
        if (!week2Items || week2Items.length === 0) {
          // Get all week 1 items for this day-meal
          const { data: week1Items, error: week1Error } = await supabase
            .from('diet_food_items')
            .select('*')
            .eq('diet_plan_id', plan.id)
            .eq('day', day)
            .eq('meal_type', mealType)
            .eq('week', 1);
          
          if (week1Error) {
            results.push({
              planId: plan.id,
              day,
              mealType,
              error: `Error fetching week 1 items: ${week1Error.message}`
            });
            continue;
          }
          
          // Create duplicates for week 2
          for (const item of week1Items || []) {
            const { id, created_at, ...rest } = item;
            const newItem = {
              ...rest,
              week: 2,
              created_at: new Date().toISOString()
            };
            
            const { error: insertError } = await supabase
              .from('diet_food_items')
              .insert(newItem);
            
            if (insertError) {
              results.push({
                planId: plan.id,
                day,
                mealType,
                error: `Error creating week 2 item: ${insertError.message}`
              });
            }
          }
          
          results.push({
            planId: plan.id,
            day,
            mealType,
            success: `Created week 2 items from week 1`
          });
        } else {
          results.push({
            planId: plan.id,
            day,
            mealType,
            skipped: `Week 2 items already exist`
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Migration to 2-week diet plan completed',
      results
    });
    
  } catch (error) {
    console.error('Error in migration:', error);
    return NextResponse.json(
      { error: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
