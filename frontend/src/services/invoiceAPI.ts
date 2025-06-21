import api from"./api";
import { InvoiceStatus, InvoiceType } from"../pages/invoice/Invoices";

export const invoiceAPI = {
 // Get all invoices
 getInvoices: async () => {
  try {
   const response = await api.get("/invoices");
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 // Get invoice by ID
 getInvoice: async (id: string) => {
  try {
   const response = await api.get(`/invoices/${id}`);
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 // Get invoice by order ID
 getInvoiceByOrder: async (orderId: string) => {
  try {
   const response = await api.get(`/invoices/order/${orderId}`);
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 // Create invoice
 createInvoice: async (data: {
  orderId: string;
  paymentId?: string;
  status?: InvoiceStatus;
  type?: InvoiceType;
  issueDate?: Date;
  dueDate?: Date;
  notes?: string;
  customerName?: string;
  customerAddress?: string;
  customerTaxId?: string;
  customerEmail?: string;
  customerPhone?: string;
 }) => {
  try {
   const response = await api.post("/invoices", data);
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 // Update invoice
 updateInvoice: async (id: string, data: any) => {
  try {
   const response = await api.patch(`/invoices/${id}`, data);
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 // Update invoice status
 updateInvoiceStatus: async (id: string, status: InvoiceStatus) => {
  try {
   const response = await api.patch(`/invoices/${id}/status`, { status });
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 // Delete invoice
 deleteInvoice: async (id: string) => {
  try {
   const response = await api.delete(`/invoices/${id}`);
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 // Download invoice
 downloadInvoice: async (id: string) => {
  try {
   // This will trigger a file download
   window.open(`/api/invoices/${id}/download`,"_blank");
   return { success: true };
  } catch (error) {
   throw error;
  }
 },

 // Regenerate invoice PDF
 regenerateInvoice: async (id: string) => {
  try {
   const response = await api.post(`/invoices/${id}/regenerate`);
   return response.data;
  } catch (error) {
   throw error;
  }
 },
};

export default invoiceAPI;
