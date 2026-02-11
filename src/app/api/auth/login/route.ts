import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../_lib/firebaseAdmin';
import * as bcrypt from 'bcryptjs';
import type { LoginRequest, LoginResponse } from '../../_lib/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as LoginRequest;
        const { code, password } = body;

        if (!code || !password) {
            return NextResponse.json({
                success: false,
                message: 'Code dan password harus diisi',
            }, { status: 400 });
        }

        // Query user berdasarkan code (no_induk atau username admin)
        const usersRef = adminDb.collection('users');
        const snapshot = await usersRef.where('code', '==', code).limit(1).get();

        if (snapshot.empty) {
            return NextResponse.json({
                success: false,
                message: 'Code atau password salah',
            }, { status: 401 });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, userData.password_hash);

        if (!isPasswordValid) {
            return NextResponse.json({
                success: false,
                message: 'Code atau password salah',
            }, { status: 401 });
        }

        // Generate custom token untuk Firebase Auth
        const customToken = await adminAuth.createCustomToken(userDoc.id, {
            role: userData.role,
            code: userData.code,
        });

        const response: LoginResponse = {
            success: true,
            token: customToken,
            user: {
                id: userDoc.id,
                code: userData.code,
                role: userData.role,
                nama: userData.nama,
                siswa_id: userData.siswa_id || undefined,
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan server',
        }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
