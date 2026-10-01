import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'wellbeing-latest.json');

// Ensure data directory exists
function ensureDataDir() {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function GET() {
  try {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json({ success: true, data: null });
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(content);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to read wellbeing data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    ensureDataDir();

    // Standardize incoming payload
    // Can accept: { apps: [{ appName: "YouTube", duration: "1h 20m" }] }
    // Or text: { rawText: "YouTube 1h 20m\nChrome 45m" }
    const payload = {
      receivedAt: new Date().toISOString(),
      apps: Array.isArray(body.apps) ? body.apps : [],
      rawText: body.rawText || '',
      dayId: body.dayId || null,
    };

    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Digital wellbeing data received and saved successfully',
      data: payload,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }
}

