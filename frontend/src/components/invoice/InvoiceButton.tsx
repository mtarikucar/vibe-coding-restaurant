import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { invoiceAPI } from "../../services/invoiceAPI";
import { useToast } from "../common/ToastProvider";
// Define Invoice interface directly here
interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
}

interface InvoiceButtonProps {
  orderId: string;
}

const InvoiceButton: React.FC<InvoiceButtonProps> = ({ orderId }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const data = await invoiceAPI.getInvoiceByOrder(orderId);
        setInvoice(data);
      } catch (err: any) {
        // If the invoice doesn't exist, that's fine
        if (err.response && err.response.status === 404) {
          setInvoice(null);
        } else {
          console.error("Error fetching invoice:", err);
          setError(err.message || "Failed to check invoice status");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [orderId]);

  const handleCreateInvoice = () => {
    navigate(`/app/invoices/new/${orderId}`);
  };

  const handleViewInvoice = () => {
    if (invoice) {
      navigate(`/app/invoices/${invoice.id}`);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoice) return;

    try {
      await invoiceAPI.downloadInvoice(invoice.id);
    } catch (err: any) {
      showToast("error", err.message || "Failed to download invoice");
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md flex items-center"
      >
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-600 mr-2"></div>
        Loading...
      </button>
    );
  }

  if (error) {
    return (
      <button disabled className="bg-red-100 text-red-700 px-4 py-2 rounded-md">
        Error checking invoice
      </button>
    );
  }

  if (invoice) {
    return (
      <div className="flex space-x-2">
        <button
          onClick={handleViewInvoice}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          View Invoice
        </button>
        <button
          onClick={handleDownloadInvoice}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
          Download
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleCreateInvoice}
      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md flex items-center"
    >
      <DocumentTextIcon className="h-5 w-5 mr-2" />
      Generate Invoice
    </button>
  );
};

export default InvoiceButton;
