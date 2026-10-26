import PageHeader from "@/components/PageHeader";
import ReturnForm from "@/components/ReturnForm";
import { Where } from "@/components/FormParts";
import { loadWorkflow } from "@/lib/workflow";

export const dynamic = "force-dynamic";
export const metadata = { title: "Return device" };

export default async function Page({ params, searchParams }) {
  const { device, next, to } = await loadWorkflow(params, searchParams);
  const editHref = `/devices/${device.id}?next=${encodeURIComponent(next)}`;
  return (
    <div className="page narrow">
      <PageHeader title={`Return ${device.device_id}`} sub={<>With <b>{device.issue_by || "no technician"}</b>{device.district ? `, ${device.district}` : ""}</>} />
      <ReturnForm device={device} next={next} editHref={editHref} />
    </div>
  );
}
