export type DispatchStatus = "queued" | "dispatched" | "on_site" | "completed";

export type FollowUpDecision = {
  priority: "routine" | "review" | "urgent";
  nextAction: "monitor_dispatch" | "contact_technician" | "close_work_order";
};

export function decideFollowUp(
  status: DispatchStatus,
  technicianFollowUp: string | undefined,
): FollowUpDecision {
  if (status === "completed") {
    return { priority: "routine", nextAction: "close_work_order" };
  }

  if (status === "on_site" && !technicianFollowUp?.trim()) {
    return { priority: "urgent", nextAction: "contact_technician" };
  }

  if (status === "on_site") {
    return { priority: "review", nextAction: "contact_technician" };
  }

  return { priority: "routine", nextAction: "monitor_dispatch" };
}
