import React from "react";
import { useAuth } from "../../store/auth";
import StockTransfersView from "../shared/StockTransfersView";

export default function FdodoStockTransfers() {
  const { user } = useAuth();
  const dbsId = user?.dbsId ?? "DBS-15";

  return <StockTransfersView dbsId={dbsId} />;
}
