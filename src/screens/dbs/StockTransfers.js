import React from "react";
import { useAuth } from "../../store/auth";
import StockTransfersView from "../shared/StockTransfersView";

export default function DbsStockTransfers() {
  const { user } = useAuth();
  const dbsId = user?.dbsId || null;

  return (
    <StockTransfersView
      dbsId={dbsId}
      requireSelectionTitle="No DBS selected"
      requireSelectionSubtitle="Your account needs an assigned DBS to view transfers."
    />
  );
}
