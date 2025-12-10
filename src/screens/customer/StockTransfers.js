import React from "react";
import { useAuth } from "../../store/auth";
import StockTransfersView from "../shared/StockTransfersView";
import { useScreenPermissionSync } from "../../hooks/useScreenPermissionSync";

import { getStockTransfers } from "../../lib/sglCustomerApi";

export default function CustomerStockTransfers() {
  useScreenPermissionSync("CustomerStockTransfers");
  const { user } = useAuth();
  const dbsId = user?.dbsId;

  return <StockTransfersView dbsId={dbsId} fetchApi={(ignored, filters) => getStockTransfers(null, filters)} />;
}
