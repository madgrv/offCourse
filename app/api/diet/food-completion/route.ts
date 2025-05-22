import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to get Supabase admin client
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables for Supabase client');
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
    const { data: existingRecord } = await supabase
      .from('food_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('diet_food_item_id', foodItemId)
      .maybeSingle();

    let completionError = null;

    if (existingRecord) {
      const { error } = await supabase
        .from('food_completions')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('user_id', userId)
        .eq('diet_food_item_id', foodItemId);

      completionError = error;
    } else {
      const { error } = await supabase
        .from('food_completions')
        .insert({
          user_id: userId,
          diet_food_item_id: foodItemId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        });

      completionError = error;
    }

    if (completionError) {
      return NextResponse.json(
        {
          success: false,
          error: `Error updating food completion: ${completionError.message}`,
        },
        { status: 500 }
      );
    }
    const { error: updateError } = await supabase
      .from('diet_food_items')
      .update({ completed })
      .eq('id', foodItemId);

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: `Error updating food item: ${updateError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Food item completion status updated successfully',
    });
  } catch (error) {
    console.error('Error processing food completion request:', error);
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
