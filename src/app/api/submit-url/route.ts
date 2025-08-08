import { NextRequest, NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase-server";

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
    userId?: string;
  };
}

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

// Get user from authorization header
async function getUserFromAuth(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
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

    // Get user from authorization header
    const authHeader = request.headers.get("authorization");
    const user = await getUserFromAuth(authHeader);

    // Prepare submission data
    const submissionData: {
      url: string;
      created_at: string;
      status: string;
      user_id?: string;
    } = {
      url: url.trim(),
      created_at: new Date().toISOString(),
      status: "pending"
    };

    // Add user ID if authenticated
    if (user) {
      submissionData.user_id = user.id;
    }

    // Save to Supabase database
    const { data, error } = await supabaseClient
      .from("submissions")
      .insert([submissionData])
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
        userId: data.user_id || undefined,
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
