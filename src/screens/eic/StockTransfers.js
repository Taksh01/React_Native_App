import React from "react";
import { useAuth } from "../../store/auth";
import MsClusterTransfers from "../shared/MsClusterTransfers";

import { apiGetStockTransfers, apiGetMsCluster } from "../../lib/eicApi";

export default function EicStockTransfers() {
  const { user } = useAuth();
  const msId = user?.msId || null;

  return (
    <MsClusterTransfers
      msId={msId}
      fetchApi={apiGetStockTransfers}
      fetchClusterApi={apiGetMsCluster}
      msName={user?.msName}
      requireSelectionTitle="Select a DBS to review transfers"
      requireSelectionSubtitle="Choose a depot under this MS to inspect inbound flow."
      emptyClusterTitle="No DBS configured for this MS"
      emptyClusterSubtitle="Configure DBS mapping to unlock transfer visibility."
      missingMsTitle="MS not linked to your EIC profile"
      missingMsSubtitle="Assign yourself to an MS to view stock transfers."
    />
  );
}
