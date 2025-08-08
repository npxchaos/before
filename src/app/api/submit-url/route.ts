import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// TypeScript interfaces
interface SubmitUrlRequest {
  url: string;
}

interface SubmitUrlResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    url: string;
    status: string;
    createdAt: string;
  };
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// URL validation function (server-side)
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

// Rate limiting (simple in-memory store - in production, use Redis or similar)
const submissionStore = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_SUBMISSIONS_PER_WINDOW = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const submissions = submissionStore.get(ip) || 0;
  
  if (now - submissions > RATE_LIMIT_WINDOW) {
    submissionStore.set(ip, now);
    return false;
  }
  
  if (submissions >= MAX_SUBMISSIONS_PER_WINDOW) {
    return true;
  }
  
  submissionStore.set(ip, submissions + 1);
  return false;
}

export async function POST(request: NextRequest): Promise<NextResponse<SubmitUrlResponse>> {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwarded?.split(",")[0] || realIp || "unknown";
    
    // Check rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many submissions. Please wait a moment before trying again.",
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body: SubmitUrlRequest = await request.json();
    const { url } = body;

    // Validate input
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "URL is required and must be a string.",
        },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid URL (e.g., https://example.com).",
        },
        { status: 400 }
      );
    }

    // Save to Supabase database
    const { data, error } = await supabase
      .from("submissions")
      .insert([{ 
        url: url.trim(), 
        created_at: new Date().toISOString(),
        status: "pending"
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error.message);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to save URL to database. Please try again.",
        },
        { status: 500 }
      );
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: "URL submitted successfully!",
      data: {
        id: data.id,
        url: data.url,
        status: data.status,
        createdAt: data.created_at,
      },
    });

  } catch (error) {
    console.error("Error processing URL submission:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 }
  );
}
