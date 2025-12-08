import React from "react";
import { useAuth } from "../../store/auth";
import StockTransfersView from "../shared/StockTransfersView";

import { getStockTransfers } from "../../lib/dbsApi";

export default function CustomerStockTransfers() {
  const { user } = useAuth();
  const dbsId = user?.dbsId ?? "DBS-09";

  return <StockTransfersView dbsId={dbsId} fetchApi={getStockTransfers} />;
}
