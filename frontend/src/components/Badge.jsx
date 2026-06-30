
import React from "react";
const MAP = { purple:"badge-purple", green:"badge-green", amber:"badge-amber", red:"badge-red", blue:"badge-blue", gray:"badge-gray" };
export default function Badge({ color="gray", children }) {
  return <span className={"badge " + (MAP[color] || "badge-gray")}>{children}</span>;
}
