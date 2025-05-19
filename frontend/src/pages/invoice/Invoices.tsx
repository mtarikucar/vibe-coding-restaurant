import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { invoiceAPI } from "../../services/invoiceAPI";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { useToast } from "../../components/common/ToastProvider";

// Define types directly in this file
export enum InvoiceStatus {
  DRAFT = "draft",
  ISSUED = "issued",
  PAID = "paid",
  CANCELLED = "cancelled",
}

export enum InvoiceType {
  STANDARD = "standard",
  PROFORMA = "proforma",
  CREDIT = "credit",
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
  };
  orderId: string;
  payment?: {
    id: string;
    method: string;
    status: string;
  };
  paymentId?: string;
  status: InvoiceStatus;
  type: InvoiceType;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  customerName?: string;
  customerAddress?: string;
  customerTaxId?: string;
  customerEmail?: string;
  customerPhone?: string;
  fileUrl?: string;
  createdBy: {
    id: string;
    fullName: string;
  };
  createdById: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoiceAPI.getInvoices();
      setInvoices(data);
    } catch (err: any) {
      console.error("Error fetching invoices:", err);
      setError(err.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (id: string) => {
    try {
      await invoiceAPI.downloadInvoice(id);
    } catch (err: any) {
      showToast("error", err.message || "Failed to download invoice");
    }
  };

  const handleRegenerateInvoice = async (id: string) => {
    try {
      await invoiceAPI.regenerateInvoice(id);
      showToast("success", "Invoice regenerated successfully");
    } catch (err: any) {
      showToast("error", err.message || "Failed to regenerate invoice");
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) {
      return;
    }

    try {
      await invoiceAPI.deleteInvoice(id);
      showToast("success", "Invoice deleted successfully");
      fetchInvoices();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete invoice");
    }
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.DRAFT:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
      case InvoiceStatus.ISSUED:
        return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
      case InvoiceStatus.PAID:
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case InvoiceStatus.CANCELLED:
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.DRAFT:
        return "bg-gray-100 text-gray-800";
      case InvoiceStatus.ISSUED:
        return "bg-blue-100 text-blue-800";
      case InvoiceStatus.PAID:
        return "bg-green-100 text-green-800";
      case InvoiceStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    // Filter by status
    if (statusFilter !== "all" && invoice.status !== statusFilter) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.order.orderNumber.toLowerCase().includes(query) ||
        (invoice.customerName &&
          invoice.customerName.toLowerCase().includes(query))
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button
          onClick={fetchInvoices}
          className="mt-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Invoice Management</h2>
        <Link
          to="/app/invoices/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Invoice
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <select
                  id="status"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value={InvoiceStatus.DRAFT}>Draft</option>
                  <option value={InvoiceStatus.ISSUED}>Issued</option>
                  <option value={InvoiceStatus.PAID}>Paid</option>
                  <option value={InvoiceStatus.CANCELLED}>Cancelled</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Search
                </label>
                <input
                  type="text"
                  id="search"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Invoice #, Order #, Customer"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <button
                onClick={fetchInvoices}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No invoices found
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(invoice.status)}
                        <div className="ml-2 text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {invoice.order.orderNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {invoice.customerName || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          invoice.status
                        )}`}
                      >
                        {invoice.status.charAt(0).toUpperCase() +
                          invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(invoice.issueDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            navigate(`/app/invoices/${invoice.id}`)
                          }
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(invoice.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleRegenerateInvoice(invoice.id)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Regenerate"
                        >
                          <DocumentDuplicateIcon className="h-5 w-5" />
                        </button>
                        {invoice.status === InvoiceStatus.DRAFT && (
                          <button
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
