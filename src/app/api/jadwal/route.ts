import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../_lib/firebaseAdmin';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tahun_akademik_id = searchParams.get('tahun_akademik_id');
        const tanggal = searchParams.get('tanggal');
        const hari = searchParams.get('hari');

        if (!tahun_akademik_id) {
            return NextResponse.json({
                success: false,
                message: 'tahun_akademik_id required',
            }, { status: 400 });
        }

        let query = adminDb.collection('master_jadwal');
        
        // Filter by tahun akademik
        let snapshot = await query
            .where('tahun_akademik_id', '==', tahun_akademik_id)
            .get();

        let jadwal = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[];

        // Filter by hari if provided
        if (hari) {
            jadwal = jadwal.filter((j: any) => j.hari === hari);
        }

        // If tanggal provided, determine hari and filter
        if (tanggal && !hari) {
            const date = new Date(tanggal);
            const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc
            const hariNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const hariName = hariNames[dayOfWeek];
            jadwal = jadwal.filter((j: any) => j.hari === hariName);
        }

        // Load related data (materi, kelompok, tahap)
        const enrichedJadwal = [];
        for (const j of jadwal) {
            const materiDoc = j.materi_id ? await adminDb.collection('master_materi').doc(j.materi_id).get() : null;
            const kelompokDoc = j.kelompok_id ? await adminDb.collection('master_kelompok').doc(j.kelompok_id).get() : null;
            const tahapDoc = j.tahap_id ? await adminDb.collection('master_tahap').doc(j.tahap_id).get() : null;

            enrichedJadwal.push({
                ...j,
                materi: materiDoc?.exists ? { id: materiDoc.id, ...materiDoc.data() } : null,
                kelompok: kelompokDoc?.exists ? { id: kelompokDoc.id, ...kelompokDoc.data() } : null,
                tahap: tahapDoc?.exists ? { id: tahapDoc.id, ...tahapDoc.data() } : null,
            });
        }

        // Sort by jam_mulai
        enrichedJadwal.sort((a, b) => {
            return (a.jam_mulai || '').localeCompare(b.jam_mulai || '');
        });

        return NextResponse.json({
            success: true,
            data: enrichedJadwal,
        });
    } catch (error) {
        console.error('Get jadwal error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data jadwal',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
