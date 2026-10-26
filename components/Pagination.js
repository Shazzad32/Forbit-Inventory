import Link from "next/link";
import Icon from "./Icon";

function href(basePath, params, page) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function Pagination({ basePath, params = {}, page, pages, total }) {
  const prev = page > 1;
  const next = page < pages;
  return (
    <nav className="pager" aria-label="Pagination">
      <span className="num">
        {total} {total === 1 ? "device" : "devices"} · page {page} of {pages}
      </span>
      <span className="pager-btns">
        <Link
          className="btn btn-ghost btn-sm"
          href={href(basePath, params, Math.max(1, page - 1))}
          aria-disabled={!prev}
          tabIndex={prev ? undefined : -1}
        >
          <Icon name="left" /> Prev
        </Link>
        <Link
          className="btn btn-ghost btn-sm"
          href={href(basePath, params, Math.min(pages, page + 1))}
          aria-disabled={!next}
          tabIndex={next ? undefined : -1}
        >
          Next <Icon name="right" />
        </Link>
      </span>
    </nav>
  );
}
