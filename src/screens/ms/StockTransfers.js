import React from "react";
import { useAuth } from "../../store/auth";
import MsClusterTransfers from "../shared/MsClusterTransfers";

export default function MsStockTransfers() {
  const { user } = useAuth();
  const msId = user?.msId || null;

  return (
    <MsClusterTransfers
      msId={msId}
      msName={user?.msName}
      requireSelectionTitle="Select a DBS to inspect transfers"
      requireSelectionSubtitle="Pick a connected depot to review live transfer activity."
      emptyClusterTitle="No DBS mapped to this MS"
      emptyClusterSubtitle="Add a DBS linkage to monitor stock transfers from this MS."
    />
  );
}
