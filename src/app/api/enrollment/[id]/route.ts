import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../_lib/firebaseAdmin';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: enrollmentId } = await params;
        const body = await request.json();

        if (!enrollmentId) {
            return NextResponse.json({
                success: false,
                message: 'ID enrollment tidak valid',
            }, { status: 400 });
        }

        // Update enrollment data
        await adminDb.collection('siswa_enrollment').doc(enrollmentId).update({
            ...body,
            updated_at: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: 'Enrollment berhasil diupdate',
        });
    } catch (error) {
        console.error('Update enrollment error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat mengupdate enrollment',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
