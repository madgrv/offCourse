import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import en from '@/shared/language/en';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize admin client with service role key if available
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }
    
    const { planId } = requestBody;

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Missing plan ID' },
        { status: 400 }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    let user;

    if (!authHeader) {
      const {
        data: { user: sessionUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !sessionUser) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      user = sessionUser;
    } else {
      try {
        const token = authHeader.replace('Bearer ', '');
        const {
          data: { user: tokenUser },
          error: tokenError,
        } = await supabase.auth.getUser(token);

        if (tokenError || !tokenUser) {
          return NextResponse.json(
            { success: false, error: 'Invalid authentication token' },
            { status: 401 }
          );
        }

        user = tokenUser;
      } catch (authError) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    // Using admin client to bypass RLS if available
    const dbClient = supabaseAdmin || supabase;
    
    // Verify the plan exists and belongs to the user
    const { data: planData, error: planError } = await dbClient
      .from('diet_plans')
      .select('id, name, description')
      .eq('id', planId)
      .eq('owner_id', user.id)
      .single();
      
    if (planError || !planData) {
      return NextResponse.json(
        { 
          success: false, 
          error: planError?.message || 'Plan not found or does not belong to user' 
        },
        { status: 404 }
      );
    }
    
    // The plan exists and belongs to the user
    // Set a cookie to indicate this is the active plan
    const cookieStore = cookies();
    
    // Set a cookie with the selected plan ID
    // This will be used by the client to ensure this plan is loaded
    cookieStore.set('selected_diet_plan_id', planData.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    // Also invalidate any cached diet plan data to force a refresh
    
    return NextResponse.json({
      success: true,
      message: 'Plan selected successfully',
      plan: {
        id: planData.id,
        name: planData.name,
        description: planData.description
      }
    });
    
  } catch (error: any) {
    console.error('Error selecting plan:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to select plan' },
      { status: 500 }
    );
  }
}
