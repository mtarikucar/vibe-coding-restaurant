import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { invoiceAPI } from "../../services/invoiceAPI";
import { formatCurrency, formatDate } from "../../utils/formatters";
// Import types from Invoices component
import { Invoice, InvoiceStatus } from "./Invoices";
import { useToast } from "../../components/common/ToastProvider";

const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const data = await invoiceAPI.getInvoice(id);
        setInvoice(data);
      } catch (err: any) {
        console.error("Error fetching invoice:", err);
        setError(err.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handleDownloadInvoice = async () => {
    if (!invoice) return;

    try {
      await invoiceAPI.downloadInvoice(invoice.id);
    } catch (err: any) {
      showToast("error", err.message || "Failed to download invoice");
    }
  };

  const handleRegenerateInvoice = async () => {
    if (!invoice) return;

    try {
      await invoiceAPI.regenerateInvoice(invoice.id);
      showToast("success", "Invoice regenerated successfully");
      // Refresh invoice data
      const updatedInvoice = await invoiceAPI.getInvoice(invoice.id);
      setInvoice(updatedInvoice);
    } catch (err: any) {
      showToast("error", err.message || "Failed to regenerate invoice");
    }
  };

  const handleUpdateStatus = async (status: InvoiceStatus) => {
    if (!invoice) return;

    try {
      await invoiceAPI.updateInvoiceStatus(invoice.id, status);
      showToast("success", "Invoice status updated successfully");
      // Refresh invoice data
      const updatedInvoice = await invoiceAPI.getInvoice(invoice.id);
      setInvoice(updatedInvoice);
    } catch (err: any) {
      showToast("error", err.message || "Failed to update invoice status");
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoice) return;

    if (!window.confirm("Are you sure you want to delete this invoice?")) {
      return;
    }

    try {
      await invoiceAPI.deleteInvoice(invoice.id);
      showToast("success", "Invoice deleted successfully");
      navigate("/app/invoices");
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete invoice");
    }
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.DRAFT:
        return <ClockIcon className="h-6 w-6 text-gray-500" />;
      case InvoiceStatus.ISSUED:
        return <DocumentTextIcon className="h-6 w-6 text-blue-500" />;
      case InvoiceStatus.PAID:
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case InvoiceStatus.CANCELLED:
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
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
          onClick={() => navigate("/app/invoices")}
          className="mt-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded flex items-center"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Invoices
        </button>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        <p>Invoice not found</p>
        <button
          onClick={() => navigate("/app/invoices")}
          className="mt-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded flex items-center"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Invoices
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate("/app/invoices")}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Invoices
        </button>
        <div className="flex space-x-2">
          <button
            onClick={handleDownloadInvoice}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Download
          </button>
          <button
            onClick={handleRegenerateInvoice}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
            Regenerate
          </button>
          {invoice.status === InvoiceStatus.DRAFT && (
            <>
              <button
                onClick={() => handleUpdateStatus(InvoiceStatus.ISSUED)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Issue
              </button>
              <button
                onClick={handleDeleteInvoice}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center"
              >
                <XCircleIcon className="h-5 w-5 mr-2" />
                Delete
              </button>
            </>
          )}
          {invoice.status === InvoiceStatus.ISSUED && (
            <button
              onClick={() => handleUpdateStatus(InvoiceStatus.PAID)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Mark as Paid
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                {getStatusIcon(invoice.status)}
                <span className="ml-2">Invoice {invoice.invoiceNumber}</span>
              </h2>
              <p className="text-gray-500 mt-1">
                Order: {invoice.order.orderNumber}
              </p>
            </div>
            <span
              className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(
                invoice.status
              )}`}
            >
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Invoice Details
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Issue Date:</span>
                <span className="font-medium">
                  {formatDate(invoice.issueDate)}
                </span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <span className="font-medium">
                    {formatDate(invoice.dueDate)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Type:</span>
                <span className="font-medium">
                  {invoice.type.charAt(0).toUpperCase() + invoice.type.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Customer Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Name:</span>
                <span className="font-medium">
                  {invoice.customerName || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium">
                  {invoice.customerEmail || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone:</span>
                <span className="font-medium">
                  {invoice.customerPhone || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Order Items
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.menuItem.name}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-gray-500">
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {item.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatCurrency(item.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex flex-col items-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax:</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.taxAmount)}
                  </span>
                </div>
              )}
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount:</span>
                  <span className="font-medium">
                    -{formatCurrency(invoice.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-700 font-medium">Total:</span>
                <span className="text-lg font-bold">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
            <p className="text-gray-700">{invoice.notes}</p>
          </div>
        )}

        {invoice.payment && (
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Payment Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Method:</span>
                <span className="font-medium">
                  {invoice.payment.method.charAt(0).toUpperCase() +
                    invoice.payment.method.slice(1).replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Status:</span>
                <span className="font-medium">
                  {invoice.payment.status.charAt(0).toUpperCase() +
                    invoice.payment.status.slice(1)}
                </span>
              </div>
              {invoice.payment.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="font-medium">
                    {invoice.payment.transactionId}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Date:</span>
                <span className="font-medium">
                  {formatDate(invoice.payment.createdAt)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetail;
