import type { ApiResult } from "./apiTypes";

export function getInventory(): Promise<ApiResult<any>>;
export function getInventoryItem(itemId: number): Promise<ApiResult<any>>;
export function createInventoryItem(itemData: Record<string, any>): Promise<ApiResult<any>>;
export function updateInventoryItem(itemId: number, itemData: Record<string, any>): Promise<ApiResult<any>>;
export function deleteInventoryItem(itemId: number): Promise<ApiResult<any>>;
export function addStock(itemId: number, stockData: Record<string, any>): Promise<ApiResult<any>>;
export function consumeStock(itemId: number, usageData: Record<string, any>): Promise<ApiResult<any>>;
export function getLowStockItems(): Promise<ApiResult<any>>;
export function getExpiringItems(): Promise<ApiResult<any>>;
export function getInventorySummary(): Promise<ApiResult<any>>;
export function getStockTransactions(itemId?: number | null): Promise<ApiResult<any>>;
