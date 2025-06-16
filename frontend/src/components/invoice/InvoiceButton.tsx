import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../ui";
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
      <Button
        disabled
        variant="secondary"
        size="md"
        isLoading={true}
      >
        Loading...
      </Button>
    );
  }

  if (error) {
    return (
      <Button
        disabled
        variant="danger"
        size="md"
      >
        Error checking invoice
      </Button>
    );
  }

  if (invoice) {
    return (
      <div className="flex space-x-2">
        <Button
          onClick={handleViewInvoice}
          variant="primary"
          size="md"
          leftIcon={<DocumentTextIcon className="h-5 w-5" />}
        >
          View Invoice
        </Button>
        <Button
          onClick={handleDownloadInvoice}
          variant="success"
          size="md"
          leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
        >
          Download
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleCreateInvoice}
      variant="warning"
      size="md"
      leftIcon={<DocumentTextIcon className="h-5 w-5" />}
    >
      Generate Invoice
    </Button>
  );
};

export default InvoiceButton;
