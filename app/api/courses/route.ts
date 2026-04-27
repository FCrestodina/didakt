import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Course from '@/lib/models/Course';

export async function GET() {
  await connectDB();
  const courses = await Course.find().sort({ updatedAt: -1 }).lean();
  return NextResponse.json(courses);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const course = await Course.create(body);
  return NextResponse.json(course, { status: 201 });
}
