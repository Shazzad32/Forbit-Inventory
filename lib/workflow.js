import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { getDevice } from "@/lib/queries";
import { one, safePath, toInputDate } from "@/lib/format";

const str = (v) => (v == null ? "" : String(v));

/** Shared loader for the send / sell / return pages. Returns plain strings only (safe for client components). */
export async function loadWorkflow(params, searchParams) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();
  const sp = await searchParams;
  const d = await getDevice(id);
  if (!d) notFound();
  const back = `/${String(d.send_to ?? "store").toLowerCase()}`;
  return {
    sp,
    next: safePath(sp.next, back),
    to: one(sp.to),
    device: {
      id: d._id,
      device_id: str(d.device_id),
      device_model: str(d.device_model),
      device_type: str(d.device_type),
      send_to: str(d.send_to) || "Store",
      issue_by: str(d.issue_by),
      district: str(d.district),
      workshop: str(d.workshop),
      problem: str(d.problem),
      install_purpose: str(d.install_purpose),
      device_price: str(d.device_price),
      technican_charge: str(d.technican_charge),
      sending_date: toInputDate(d.sending_date),
      install_date: toInputDate(d.install_date),
      is_complete: Boolean(d.is_complete),
    },
  };
}
