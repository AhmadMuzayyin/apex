import { NextRequest, NextResponse } from 'next/server';
import { masterDataService } from '@/services/masterDataService';

export async function GET(request: NextRequest) {
    try {
        const kelompok = await masterDataService.getAllKelompok();
        
        return NextResponse.json({
            success: true,
            data: kelompok,
        });
    } catch (error) {
        console.error('Get kelompok error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data kelompok',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
