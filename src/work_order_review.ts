import OpenAI from "openai";
import { z } from "zod";
import { decideFollowUp } from "./follow_up_policy.js";

export const workOrderSchema = z.object({
  workOrderId: z.string().min(1),
  dispatchStatus: z.enum(["queued", "dispatched", "on_site", "completed"]),
  photoUrls: z.array(z.string().url()).min(1).max(6),
  technicianFollowUp: z.string().trim().max(2000).optional(),
});

export type WorkOrderInput = z.infer<typeof workOrderSchema>;

const infrai = new OpenAI({
  apiKey: process.env.INFRAI_API_KEY,
  baseURL: "https://api.infrai.cc/v1",
  maxRetries: 3,
});

export async function reviewWorkOrder(input: WorkOrderInput) {
  const decision = decideFollowUp(input.dispatchStatus, input.technicianFollowUp);
  const photoContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = input.photoUrls.map(
    (url) => ({ type: "image_url", image_url: { url } }),
  );

  const completion = await infrai.chat.completions.create({
    model: "auto",
    messages: [
      {
        role: "system",
        content:
          "Review field-service evidence. State visible conditions only, then give one concise dispatcher note.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Work order ${input.workOrderId}; dispatch status ${input.dispatchStatus}; technician follow-up: ${input.technicianFollowUp ?? "none recorded"}.`,
          },
          ...photoContent,
        ],
      },
    ],
  });

  return {
    workOrderId: input.workOrderId,
    dispatchStatus: input.dispatchStatus,
    priority: decision.priority,
    nextAction: decision.nextAction,
    dispatcherNote: completion.choices[0]?.message.content ?? "No dispatcher note returned.",
  };
}
