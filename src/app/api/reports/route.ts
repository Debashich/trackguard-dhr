import { NextResponse } from 'next/server';

interface ServerReport {
  id: string;
  data: Record<string, unknown>;
  photoName: string | null;
  receivedAt: string;
}

const serverReports: ServerReport[] = [];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const rawData = formData.get('data');
    const photo = formData.get('photo');

    if (typeof rawData !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing report data',
        },
        { status: 400 }
      );
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawData) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Report data must be valid JSON' },
        { status: 400 }
      );
    }

    if (typeof data.id !== 'string' || data.id.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing report ID',
        },
        { status: 400 }
      );
    }

    const existingIndex =
      serverReports.findIndex(
        (report) => report.id === data.id
      );

    const serverReport: ServerReport = {
      id: data.id,
      data,
      photoName:
        photo instanceof File
          ? photo.name
          : null,
      receivedAt:
        new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      serverReports[existingIndex] =
        serverReport;
    } else {
      serverReports.push(serverReport);
    }

    return NextResponse.json({ success: true, id: data.id, receivedAt: serverReport.receivedAt }, { status: 201 });
  } catch (error) {
    console.error(
      'Failed to receive report:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid report payload',
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ reports: serverReports }, { headers: { 'Cache-Control': 'no-store' } });
}
