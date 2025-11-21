import { NextRequest, NextResponse } from 'next/server';
import { EquipmentService } from '@/lib/equipment-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      query: searchParams.get('query') || undefined,
      manufacturer: searchParams.get('manufacturer') || undefined,
      type: searchParams.get('type') || undefined,
      application: searchParams.get('application') || undefined,
    };

    const results = EquipmentService.searchEquipment('speakers', filters);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
