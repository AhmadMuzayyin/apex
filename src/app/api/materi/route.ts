import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../_lib/firebaseAdmin';

export async function GET(request: NextRequest) {
    try {
        const snapshot = await adminDb
            .collection('master_materi')
            .get();
        
        // Sort by created_at desc in memory
        const materi = snapshot.docs
            .sort((a, b) => {
                const aTime = String(a.data().created_at || '');
                const bTime = String(b.data().created_at || '');
                return bTime.localeCompare(aTime);
            })
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        
        return NextResponse.json({
            success: true,
            data: materi,
        });
    } catch (error) {
        console.error('Get materi error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data materi',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
