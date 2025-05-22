import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import en from '../../../../shared/language/en';

// Ensure environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables for Supabase client');
}

// Create admin client with service role key to bypass RLS
const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, dietPlanId, day, mealType, completed } = body;
    
    if (!userId || !dietPlanId || !day || !mealType) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }
    const { data: existingRecord } = await supabaseAdmin
      .from('meal_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('diet_plan_id', dietPlanId)
      .eq('day', day)
      .eq('meal_type', mealType)
      .maybeSingle();
    
    let completionError = null;
    
    if (existingRecord) {

      const { error } = await supabaseAdmin
        .from('meal_completions')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('user_id', userId)
        .eq('diet_plan_id', dietPlanId)
        .eq('day', day)
        .eq('meal_type', mealType);
      
      completionError = error;
    } else {

      const { error } = await supabaseAdmin
        .from('meal_completions')
        .insert({
          user_id: userId,
          diet_plan_id: dietPlanId,
          day,
          meal_type: mealType,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        });
      
      completionError = error;
    }
      
    if (completionError) {
      return NextResponse.json({
        success: false,
        error: `Error updating meal completion: ${completionError.message}`
      }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      message: 'Meal completion status updated successfully'
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
