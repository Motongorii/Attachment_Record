import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { admissionNumber: session.admissionNumber },
    include: {
      firms: true
    }
  });

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();

  // Protect sensitive fields from being updated directly by student
  const { id, admissionNumber, role, createdAt, updatedAt, course, firms, ...updateData } = data;

  const updatedUser = await prisma.user.update({
    where: { admissionNumber: session.admissionNumber },
    data: {
      ...updateData,
      firms: {
        deleteMany: {}, // Remove all existing firms for this user to ensure clean state
        create: (firms || []).slice(0, 3).map((firm: any) => ({
          firmName: firm.firmName,
          firmEmail: firm.firmEmail,
          firmCounty: firm.firmCounty,
          exactLocation: firm.exactLocation,
          supervisorName: firm.supervisorName,
          supervisorPhone: firm.supervisorPhone,
          supervisorEmail: firm.supervisorEmail,
          startDate: firm.startDate ? new Date(firm.startDate) : null,
          endDate: firm.endDate ? new Date(firm.endDate) : null,
        }))
      }
    },
    include: {
      firms: true
    }
  });

  return NextResponse.json(updatedUser);
}
