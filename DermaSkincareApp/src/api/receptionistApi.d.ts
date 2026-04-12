import type { ApiResult } from "./apiTypes";

export function getReceptionistDashboard(receptionistId: number): Promise<ApiResult<any>>;
export function getAppointments(params?: Record<string, any>): Promise<ApiResult<any>>;
export function getTodaysAppointments(): Promise<ApiResult<any>>;
export function updateAppointmentStatus(appointmentId: number, status: string): Promise<ApiResult<any>>;
export function getPatients(): Promise<ApiResult<any>>;
export function createPatient(patientData: Record<string, any>): Promise<ApiResult<any>>;
export function getPatient(patientId: number): Promise<ApiResult<any>>;
export function updatePatient(patientId: number, patientData: Record<string, any>): Promise<ApiResult<any>>;
export function deletePatient(patientId: number): Promise<ApiResult<any>>;
export function getDoctors(): Promise<ApiResult<any>>;
export function getServices(): Promise<ApiResult<any>>;
export function createInvoice(invoiceData: Record<string, any>): Promise<ApiResult<any>>;
export function updateInvoice(invoiceId: number, updateData: Record<string, any>): Promise<ApiResult<any>>;
export function markInvoicePaid(invoiceId: number, paymentMethod: string): Promise<ApiResult<any>>;
export function getInvoices(params?: Record<string, any>): Promise<ApiResult<any>>;
export function getInvoice(invoiceId: number): Promise<ApiResult<any>>;
export function deleteInvoice(invoiceId: number): Promise<ApiResult<any>>;
