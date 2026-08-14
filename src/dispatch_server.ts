import { createServer } from "node:http";
import { ZodError } from "zod";
import { reviewWorkOrder, workOrderSchema } from "./work_order_review.js";

const port = Number(process.env.PORT ?? 3000);

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/work-orders/review") {
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "Route not found" }));
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const input = workOrderSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const result = await reviewWorkOrder(input);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(result));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      response.writeHead(400, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Invalid work-order body" }));
      return;
    }

    console.error("Work-order review failed", error);
    response.writeHead(502, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "Review could not be completed" }));
  }
});

server.listen(port, () => {
  console.log(`Dispatch review listening on http://localhost:${port}`);
});
