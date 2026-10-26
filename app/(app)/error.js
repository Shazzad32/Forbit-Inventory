"use client";

import Icon from "@/components/Icon";

export default function Error({ reset }) {
  return (
    <div className="page">
      <div className="panel empty" role="alert">
        <Icon name="alert" />
        <b>Something went wrong</b>
        <span>The page could not load its data. Check the database connection (MONGODB_URI) and try again.</span>
        <button type="button" className="btn" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}
