
import React from "react";
export default function Toggle({ value, onChange }) {
  return <button className={"toggle" + (value ? " on" : "")} onClick={() => onChange(!value)} aria-pressed={value} />;
}
