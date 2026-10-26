import mongoose from "mongoose";
import { notFound } from "next/navigation";
import DeviceForm from "@/components/DeviceForm";
import PageHeader from "@/components/PageHeader";
import { getDevice, technicianNames } from "@/lib/queries";
import { SEND_TO } from "@/lib/constants";
import { one, toInputDate, todayInput } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit device" };

export default async function EditDevice({ params, searchParams }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();

  const sp = await searchParams;
  const [d, technicians] = await Promise.all([getDevice(id), technicianNames()]);
  if (!d) notFound();

  // "?to=Retail" (from the row quick-links) pre-selects where the device is going.
  const to = SEND_TO.includes(one(sp.to)) ? one(sp.to) : null;
  const next = /^\/(?!\/)/.test(one(sp.next)) ? one(sp.next) : `/${(to ?? d.send_to ?? "store").toLowerCase()}`;

  const str = (v) => (v == null ? "" : String(v));
  const device = {
    id: d._id,
    device_id: d.device_id,
    device_model: str(d.device_model),
    device_type: str(d.device_type),
    from: str(d.from),
    send_to: to ?? d.send_to ?? "Store",
    install_purpose: str(d.install_purpose),
    issue_by: str(d.issue_by),
    workshop: str(d.workshop),
    problem: str(d.problem),
    district: str(d.district),
    device_price: str(d.device_price),
    technican_charge: str(d.technican_charge),
    insert_date: toInputDate(d.insert_date),
    sending_date: to && to !== d.send_to ? todayInput() : toInputDate(d.sending_date),
    install_date: toInputDate(d.install_date),
    is_complete: Boolean(d.is_complete),
  };

  return (
    <div className="page">
      <PageHeader title={`Edit ${d.device_id}`} sub={to ? `Moving to ${to}` : `Currently in ${d.send_to ?? "Store"}`} />
      <DeviceForm device={device} technicians={technicians} next={next} />
    </div>
  );
}
