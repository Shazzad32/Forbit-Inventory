import PageHeader from "@/components/PageHeader";
import SendForm from "@/components/SendForm";
import { Where } from "@/components/FormParts";
import { loadWorkflow } from "@/lib/workflow";
import { technicianNames, workshopNames } from "@/lib/queries";
import { todayInput } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Send device" };

export default async function Page({ params, searchParams }) {
  const { device, next, to } = await loadWorkflow(params, searchParams);
  const editHref = `/devices/${device.id}?next=${encodeURIComponent(next)}`;
  const [technicians, workshops] = await Promise.all([technicianNames(), workshopNames()]);
  const initialTo = ["Store", "Retail", "Rangs"].includes(to) ? to : device.send_to === "Store" ? "Retail" : "Store";
  return (
    <div className="page narrow">
      <PageHeader title={`Send ${device.device_id}`} sub={<>Currently in <Where at={device.send_to} /></>} />
      <SendForm device={device} technicians={technicians} workshops={workshops} next={next} initialTo={initialTo} today={todayInput()} editHref={editHref} />
    </div>
  );
}
