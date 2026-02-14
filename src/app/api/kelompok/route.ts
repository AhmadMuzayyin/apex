import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../_lib/firebaseAdmin';

export async function GET(request: NextRequest) {
    try {
        const snapshot = await adminDb
            .collection('master_kelompok')
            .get();
        
        // Sort in memory by created_at desc
        const kelompok = snapshot.docs
            .sort((a, b) => {
                const aTime = a.data().created_at || '';
                const bTime = b.data().created_at || '';
                return String(bTime).localeCompare(String(aTime));
            })
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        
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
