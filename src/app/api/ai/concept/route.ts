import { handleConcept } from "@/lib/ai/handlers";
import { aiHandlerDeps } from "@/lib/ai/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleConcept(request, aiHandlerDeps);
}
