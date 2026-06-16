import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { admissionNumber: session.admissionNumber }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save to DB
    await prisma.user.update({
      where: { admissionNumber: session.admissionNumber },
      data: {
        resetCode: code,
        resetCodeExpires: expires
      }
    });

    // Attempt to send email
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Machakos University <onboarding@resend.dev>', // Free tier Resend sender
        to: email,
        subject: 'Password Change Verification Code',
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Password Change Verification</h2>
            <p>Hello,</p>
            <p>You requested to change your password for the Machakos University Attachment Record system.</p>
            <p>Your 4-digit verification code is:</p>
            <h1 style="letter-spacing: 5px; color: #2E1A47;">${code}</h1>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this change, please ignore this email.</p>
          </div>
        `
      });
      console.log(`Email sent via Resend to ${email}`);
    } else {
      // Fallback for testing when no API key is provided
      console.log(`\n\n=== PASSWORD RESET CODE ===\nUser: ${user.admissionNumber}\nEmail: ${email}\nCode: ${code}\n===========================\n\n`);
    }

    return NextResponse.json({ success: true, message: 'Code sent successfully' });
  } catch (error: any) {
    console.error('Request code error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to request code' }, { status: 500 });
  }
}
