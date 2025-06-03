import { NextResponse } from 'next/server';
import { getDietData } from '@/app/lib/data';
import { ApiResponse, DietData } from '@/app/lib/types';

// GET handler to retrieve diet data
export async function GET(): Promise<NextResponse<ApiResponse<DietData>>> {
  try {
    const dietData = await getDietData();
    
    return NextResponse.json({
      success: true,
      data: dietData
    });
  } catch (error) {

    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch diet data'
      },
      { status: 500 }
    );
  }
}

// POST handler to update diet data (placeholder)
export async function POST(request: Request): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const body = await request.json();
    
    // In a real application, this would validate and save the data
    
    
    // This is just a placeholder response
    return NextResponse.json({
      success: true,
      data: { message: 'Diet data updated successfully' }
    });
  } catch (error) {
    
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update diet data'
      },
      { status: 500 }
    );
  }
}