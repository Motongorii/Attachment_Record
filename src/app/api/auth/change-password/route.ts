import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, newPassword } = await request.json();

    if (!code || !newPassword) {
      return NextResponse.json({ error: 'Code and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { admissionNumber: session.admissionNumber }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.resetCode || !user.resetCodeExpires) {
      return NextResponse.json({ error: 'No password reset requested' }, { status: 400 });
    }

    if (user.resetCode !== code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    if (user.resetCodeExpires < new Date()) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // Securely hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Save to DB and clear reset codes
    await prisma.user.update({
      where: { admissionNumber: session.admissionNumber },
      data: {
        passwordHash: hashedPassword,
        resetCode: null,
        resetCodeExpires: null
      }
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to change password' }, { status: 500 });
  }
}
