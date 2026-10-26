import DeviceForm from "@/components/DeviceForm";
import PageHeader from "@/components/PageHeader";
import { technicianNames } from "@/lib/queries";
import { SEND_TO } from "@/lib/constants";
import { one, todayInput } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add device" };

export default async function NewDevice({ searchParams }) {
  const sp = await searchParams;
  const sendTo = SEND_TO.includes(one(sp.send_to)) ? one(sp.send_to) : "Store";
  const next = /^\/(?!\/)/.test(one(sp.next)) ? one(sp.next) : "/store";
  const technicians = await technicianNames();

  return (
    <div className="page">
      <PageHeader title="Add device" sub="Fill in what you know. Only the device ID is required." />
      <DeviceForm
        technicians={technicians}
        next={next}
        device={{ send_to: sendTo, insert_date: todayInput(), sending_date: sendTo === "Store" ? "" : todayInput() }}
      />
    </div>
  );
}
