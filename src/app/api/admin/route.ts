import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

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
