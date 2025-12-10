import React from "react";
import { useAuth } from "../../store/auth";
import StockTransfersView from "../shared/StockTransfersView";
import { useScreenPermissionSync } from "../../hooks/useScreenPermissionSync";

import { getStockTransfers } from "../../lib/dbsApi";

export default function DbsStockTransfers() {
  useScreenPermissionSync("DbsStockTransfers");
  const { user } = useAuth();
  const dbsId = user?.dbsId || null;

  return (
    <StockTransfersView
      dbsId={dbsId}
      fetchApi={getStockTransfers}
      requireSelectionTitle="No DBS selected"
      requireSelectionSubtitle="Your account needs an assigned DBS to view transfers."
    />
  );
}
