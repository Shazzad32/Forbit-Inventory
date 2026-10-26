import Link from "next/link";
import Icon from "./Icon";

/** GET form: works without any client JS. `hidden` keeps other filters when searching. */
export default function SearchBox({ q = "", hidden = {}, clearHref }) {
  return (
    <form method="get" role="search" className="search">
      {Object.entries(hidden).map(([k, v]) =>
        v ? <input key={k} type="hidden" name={k} value={v} /> : null
      )}
      <Icon name="search" />
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Search device ID, model, technician…"
        aria-label="Search devices"
        enterKeyHint="search"
        autoComplete="off"
      />
      {q && clearHref && (
        <Link href={clearHref} className="btn btn-ghost btn-sm">
          Clear
        </Link>
      )}
    </form>
  );
}
