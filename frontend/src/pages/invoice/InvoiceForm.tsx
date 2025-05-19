import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { invoiceAPI } from "../../services/invoiceAPI";
import { orderAPI } from "../../services/api";
// Import types from Invoices component
import { InvoiceStatus, InvoiceType } from "./Invoices";
import { formatCurrency } from "../../utils/formatters";
import { useToast } from "../../components/common/ToastProvider";

// Define Order interface directly
interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  items: Array<{
    id: string;
    menuItem: {
      id: string;
      name: string;
      price: number;
    };
    quantity: number;
    price: number;
  }>;
  table: {
    id: string;
    number: number;
  };
  waiter: {
    id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  orderId: string;
  type: InvoiceType;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  customerName?: string;
  customerAddress?: string;
  customerTaxId?: string;
  customerEmail?: string;
  customerPhone?: string;
}

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId?: string }>();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    orderId: orderId || "",
    type: InvoiceType.STANDARD,
    issueDate: new Date().toISOString().split("T")[0],
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId);
    }
  }, [orderId]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderAPI.getOrders();
      // Filter out orders that are not completed or served
      const eligibleOrders = data.filter(
        (order: Order) =>
          order.status === "completed" || order.status === "served"
      );
      setOrders(eligibleOrders);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (id: string) => {
    try {
      const order = await orderAPI.getOrder(id);
      setSelectedOrder(order);
      setFormData((prev) => ({
        ...prev,
        orderId: order.id,
      }));
    } catch (err: any) {
      console.error("Error fetching order details:", err);
      showToast("error", err.message || "Failed to load order details");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "orderId" && value) {
      fetchOrderDetails(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.orderId) {
      showToast("error", "Please select an order");
      return;
    }

    setSubmitting(true);
    try {
      const response = await invoiceAPI.createInvoice({
        ...formData,
        issueDate: new Date(formData.issueDate),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      });

      showToast("success", "Invoice created successfully");
      navigate(`/app/invoices/${response.id}`);
    } catch (err: any) {
      console.error("Error creating invoice:", err);
      showToast("error", err.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
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
        <h2 className="text-2xl font-bold text-gray-800">Create New Invoice</h2>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Order Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="orderId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Order *
                </label>
                <select
                  id="orderId"
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!!orderId}
                >
                  <option value="">Select an order</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber} - Table {order.table.number} -{" "}
                      {formatCurrency(order.totalAmount)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Invoice Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={InvoiceType.STANDARD}>Standard</option>
                  <option value={InvoiceType.PROFORMA}>Proforma</option>
                  <option value={InvoiceType.CREDIT}>Credit</option>
                </select>
              </div>
            </div>

            {selectedOrder && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h4 className="text-md font-medium text-gray-800 mb-2">
                  Order Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order Number</p>
                    <p className="font-medium">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Table</p>
                    <p className="font-medium">{selectedOrder.table.number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Items</p>
                  <ul className="mt-1 space-y-1">
                    {selectedOrder.items.map((item) => (
                      <li key={item.id} className="text-sm">
                        {item.quantity}x {item.menuItem.name} -{" "}
                        {formatCurrency(item.price * item.quantity)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Invoice Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="issueDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Issue Date *
                </label>
                <input
                  type="date"
                  id="issueDate"
                  name="issueDate"
                  value={formData.issueDate}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="dueDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate || ""}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="customerName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Customer Name
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName || ""}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="customerEmail"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Customer Email
                </label>
                <input
                  type="email"
                  id="customerEmail"
                  name="customerEmail"
                  value={formData.customerEmail || ""}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="customerPhone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Customer Phone
                </label>
                <input
                  type="tel"
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone || ""}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="customerTaxId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tax ID / VAT Number
                </label>
                <input
                  type="text"
                  id="customerTaxId"
                  name="customerTaxId"
                  value={formData.customerTaxId || ""}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="customerAddress"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Customer Address
                </label>
                <textarea
                  id="customerAddress"
                  name="customerAddress"
                  value={formData.customerAddress || ""}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Additional Information
            </h3>
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes || ""}
                onChange={handleInputChange}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any additional notes or information for this invoice"
              />
            </div>
          </div>

          <div className="p-6 flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/app/invoices")}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-md font-medium mr-4"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium flex items-center"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Create Invoice
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
