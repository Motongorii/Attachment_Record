import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { loginSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { admissionNumber, password } = await request.json();

    // Basic format validation: JXX-XXXX-XXXX
    const formatRegex = /^[A-Z0-9]{3}-\d{4}-\d{4}$/i;
    
    if (!formatRegex.test(admissionNumber)) {
      return NextResponse.json({ error: 'Invalid Admission Number format.' }, { status: 400 });
    }

    if (admissionNumber.toLowerCase() !== password) {
      return NextResponse.json({ error: 'Invalid Credentials.' }, { status: 401 });
    }

    // Determine course code
    const prefix = admissionNumber.substring(0, 3).toUpperCase();
    let course = 'Unknown Course';
    if (prefix === 'J17') course = 'Computer Science';
    else if (prefix === 'J18') course = 'Cloud Computing';
    else if (prefix === 'J44') course = 'Information Technology';

    // Find or create user
    const user = await prisma.user.upsert({
      where: { admissionNumber: admissionNumber.toUpperCase() },
      update: {}, // Don't overwrite existing data on login
      create: {
        admissionNumber: admissionNumber.toUpperCase(),
        course,
        role: 'student', // By default, new registrations are students
      },
    });

    // Create session cookie
    await loginSession(user.admissionNumber, user.role);

    return NextResponse.json({ success: true, role: user.role });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error?.message || String(error) || 'Internal Server Error' }, { status: 500 });
  }
}
