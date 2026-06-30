
import React from "react";
export default function EmptyState({ icon="ti-inbox", title, description, action }) {
  return (
    <div className="empty-state">
      <i className={"ti " + icon} />
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
