import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { role: 'student' },
    orderBy: { createdAt: 'desc' },
    include: {
      firms: true
    }
  });

  return NextResponse.json(users);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { firmId, assessmentDone } = await request.json();

    if (!firmId) {
      return NextResponse.json({ error: 'Firm ID is required' }, { status: 400 });
    }

    const updatedFirm = await prisma.firm.update({
      where: { id: firmId },
      data: { assessmentDone }
    });

    return NextResponse.json(updatedFirm);
  } catch (error) {
    console.error('Failed to update assessment status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, studentId } = await request.json();

    if (action === 'resetPassword' && studentId) {
      await prisma.user.update({
        where: { id: studentId },
        data: {
          passwordHash: null,
          resetCode: null,
          resetCodeExpires: null
        }
      });
      return NextResponse.json({ success: true, message: 'Password reset to default (Admission Number).' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
