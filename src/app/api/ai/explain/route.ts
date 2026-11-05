import { handleExplain } from "@/lib/ai/handlers";
import { aiHandlerDeps } from "@/lib/ai/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleExplain(request, aiHandlerDeps);
}
