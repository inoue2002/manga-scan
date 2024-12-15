// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const response = await fetch('https://mangatopia-mangatopia.up.railway.app/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}