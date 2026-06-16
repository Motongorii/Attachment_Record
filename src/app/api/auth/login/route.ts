import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { admissionNumber, password } = await request.json();

    // Basic format validation: JXX-XXXX-XXXX or JXX-XXXXX-XXXX
    const formatRegex = /^[A-Z0-9]{3}-\d{4,5}-\d{4}$/i;
    
    if (!formatRegex.test(admissionNumber)) {
      return NextResponse.json({ error: 'Invalid Admission Number format.' }, { status: 400 });
    }

    // Determine course code
    const prefix = admissionNumber.substring(0, 3).toUpperCase();
    let course = 'Unknown Course';
    if (prefix === 'J17') course = 'Computer Science';
    else if (prefix === 'J18') course = 'Cloud Computing';
    else if (prefix === 'J77') course = 'Information Technology';

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

    // Verify Password
    if (user.passwordHash) {
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Invalid admission number or password' }, { status: 401 });
      }
    } else {
      // Legacy fallback: password must match lowercase admission number
      if (password !== admissionNumber.toLowerCase()) {
        return NextResponse.json({ error: 'Invalid admission number or password' }, { status: 401 });
      }
    }

    // Create session cookie
    await loginSession(user.admissionNumber, user.role);

    return NextResponse.json({ success: true, role: user.role });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error?.message || String(error) || 'Internal Server Error' }, { status: 500 });
  }
}
