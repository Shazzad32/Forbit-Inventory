import PageHeader from "@/components/PageHeader";
import SellForm from "@/components/SellForm";
import { Where } from "@/components/FormParts";
import { loadWorkflow } from "@/lib/workflow";
import { todayInput } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sell device" };

export default async function Page({ params, searchParams }) {
  const { device, next, to } = await loadWorkflow(params, searchParams);
  const editHref = `/devices/${device.id}?next=${encodeURIComponent(next)}`;
  return (
    <div className="page narrow">
      <PageHeader title={`Sell ${device.device_id}`} sub={<>With <b>{device.issue_by || "no technician"}</b>{device.district ? `, ${device.district}` : ""}</>} />
      <SellForm device={device} next={next} today={todayInput()} editHref={editHref} />
    </div>
  );
}
