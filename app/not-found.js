import Link from "next/link";
import Icon from "@/components/Icon";

export default function NotFound() {
  return (
    <div className="page" style={{ minHeight: "100dvh", justifyContent: "center" }}>
      <div className="panel empty">
        <Icon name="search" />
        <b>Page not found</b>
        <span>This page or device does not exist, or it was deleted.</span>
        <Link href="/" className="btn">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
