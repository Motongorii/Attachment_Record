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

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { admissionNumber: session.admissionNumber }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    if (user.passwordHash) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }
    } else {
      // If no hash exists, the current password must be the default (lowercase admission number)
      if (currentPassword !== user.admissionNumber.toLowerCase()) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }
    }

    // Securely hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Save to DB and clear any old reset codes just in case
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
