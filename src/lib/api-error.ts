import { NextResponse } from "next/server";
import { RbacError } from "@/lib/rbac";

export function handleApiError(error: unknown) {
  if (error instanceof RbacError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}