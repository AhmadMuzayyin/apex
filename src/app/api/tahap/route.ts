import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../_lib/firebaseAdmin';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tahun_akademik_id = searchParams.get('tahun_akademik_id');

        let query = adminDb.collection('master_tahap');
        
        if (tahun_akademik_id) {
            const snapshot = await query
                .where('tahun_akademik_id', '==', tahun_akademik_id)
                .get();
            
            // Sort by urutan in memory
            const tahap = snapshot.docs
                .sort((a, b) => {
                    const aUrutan = a.data().urutan || 999;
                    const bUrutan = b.data().urutan || 999;
                    return aUrutan - bUrutan;
                })
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            
            return NextResponse.json({
                success: true,
                data: tahap,
            });
        }

        // Get all tahap
        const snapshot = await query.get();
        const tahap = snapshot.docs
            .sort((a, b) => {
                const aUrutan = a.data().urutan || 999;
                const bUrutan = b.data().urutan || 999;
                return aUrutan - bUrutan;
            })
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        return NextResponse.json({
            success: true,
            data: tahap,
        });
    } catch (error) {
        console.error('Get tahap error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data tahap',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
