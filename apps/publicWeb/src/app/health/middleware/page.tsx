import { headers } from "next/headers";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";

export default async function TestMiddlewarePage() {
  const headersList = await headers();
  const middlewareData = await getMiddlewareDataFromHeaders();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Middleware Test</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Middleware Data:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(middlewareData, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">All Headers:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm max-h-60 overflow-y-auto">
            {JSON.stringify(Object.fromEntries(headersList.entries()), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
