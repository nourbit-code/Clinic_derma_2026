import type { ApiResult } from "./apiTypes";

export function getPatients(): Promise<ApiResult<any>>;
export function getDoctors(): Promise<ApiResult<any>>;
export function getServices(): Promise<ApiResult<any>>;
export function createAppointment(appointmentData: Record<string, any>): Promise<ApiResult<any>>;
export function getAppointments(params?: Record<string, any>): Promise<ApiResult<any>>;
export function getAppointment(appointmentId: number): Promise<ApiResult<any>>;
export function updateAppointment(appointmentId: number, updateData: Record<string, any>): Promise<ApiResult<any>>;
export function deleteAppointment(appointmentId: number): Promise<ApiResult<any>>;
export function addServiceToAppointment(appointmentId: number, serviceId: number, cost?: number | null): Promise<ApiResult<any>>;
export function convertTo24Hour(time12h: string): string;
export function convertTo12Hour(time24h: string): string;
