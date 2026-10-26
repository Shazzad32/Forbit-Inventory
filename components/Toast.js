"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Icon from "./Icon";

/** Shows "?ok=..." once, then removes it from the address so a refresh does not repeat it. */
export default function Toast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const ok = params.get("ok");
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (!ok) return;
    setShown(ok);
    const rest = new URLSearchParams(params.toString());
    rest.delete("ok");
    const qs = rest.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [ok]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!shown) return;
    const t = setTimeout(() => setShown(""), 4200);
    return () => clearTimeout(t);
  }, [shown]);

  if (!shown) return null;
  return (
    <div className="toast" role="status">
      <Icon name="check" />
      <span>{shown}</span>
      <button type="button" className="toast-x" onClick={() => setShown("")} aria-label="Dismiss">
        <Icon name="x" />
      </button>
    </div>
  );
}
