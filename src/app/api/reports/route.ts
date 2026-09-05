import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ServerReport = Record<string, unknown> & {
  photoName?: string | null;
  thumbnailName?: string | null;
};

const serverReports: ServerReport[] = [];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawData = formData.get("data");

    if (typeof rawData !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing report data",
        },
        { status: 400 },
      );
    }

    const data = JSON.parse(rawData) as Record<
      string,
      unknown
    >;

    const photo = formData.get("photo");
    const thumbnail = formData.get("thumbnail");

    const report: ServerReport = {
      ...data,
      photoName:
        photo instanceof File ? photo.name : null,
      thumbnailName:
        thumbnail instanceof File
          ? thumbnail.name
          : null,
    };

    const existingIndex = serverReports.findIndex(
      (item) => item.id === report.id,
    );

    if (existingIndex >= 0) {
      serverReports[existingIndex] = report;
    } else {
      serverReports.push(report);
    }

    return NextResponse.json({
      success: true,
      id: report.id,
    });
  } catch (error) {
    console.error(
      "POST /api/reports failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Invalid report payload",
      },
      { status: 400 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    reports: serverReports,
  });
}