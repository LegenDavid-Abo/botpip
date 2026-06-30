
import React from "react";
import EmptyState from "../../components/EmptyState.jsx";
export default function PlaygroundGaps() {
  return (
    <div>
      <div className="page-header"><h1 className="page-title">Gap finder</h1></div>
      <EmptyState icon="ti-search" title="No gaps tracked yet" description="Upload your knowledge base first. Gap finder shows every question your bot can't yet answer, based on real conversations." />
    </div>
  );
}
