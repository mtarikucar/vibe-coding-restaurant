import { useState, useEffect } from"react";
import { Link, useNavigate } from"react-router-dom";
import {
 CreditCardIcon,
 BanknotesIcon,
 ReceiptRefundIcon,
 CurrencyDollarIcon,
} from"@heroicons/react/24/outline";
import { paymentAPI } from"../../services/api";
import { formatCurrency } from"../../utils/formatters";
import { Payment, PaymentMethod, PaymentStatus } from"../../types/payment";

interface PaymentListItem {
 id: string;
 orderNumber?: string;
 tableNumber?: number | string;
 amount: number | string;
 method: PaymentMethod;
 status: PaymentStatus;
 createdAt?: string;
 cashier?: string;
}

const Payments = () => {
 const navigate = useNavigate();
 const [payments, setPayments] = useState<PaymentListItem[]>([]);
 const [statusFilter, setStatusFilter] = useState<string>("all");
 const [methodFilter, setMethodFilter] = useState<string>("all");
 const [searchQuery, setSearchQuery] = useState<string>("");
 const [loading, setLoading] = useState(false);

 useEffect(() => {
  const fetchPayments = async () => {
   setLoading(true);
   try {
    const data = await paymentAPI.getPayments();
    setPayments(data);
   } catch (error) {
    console.error("Error fetching payments:", error);
    // Fallback to mock data if API fails
    const mockPayments: PaymentListItem[] = [
     {
      id: "1",
      orderNumber:"ORD-001",
      tableNumber: 5,
      amount: 34.97,
      method: PaymentMethod.CREDIT_CARD,
      status: PaymentStatus.COMPLETED,
      createdAt:"2023-05-17T15:30:00Z",
      cashier:"Jane Smith",
     },
     {
      id: "2",
      orderNumber:"ORD-002",
      tableNumber: 3,
      amount: 20.97,
      method: PaymentMethod.CASH,
      status: PaymentStatus.COMPLETED,
      createdAt:"2023-05-17T15:45:00Z",
      cashier:"Jane Smith",
     },
     {
      id: "3",
      orderNumber:"ORD-003",
      tableNumber: 8,
      amount: 20.96,
      method: PaymentMethod.DEBIT_CARD,
      status: PaymentStatus.COMPLETED,
      createdAt:"2023-05-17T14:15:00Z",
      cashier:"Jane Smith",
     },
     {
      id: "4",
      orderNumber:"ORD-004",
      tableNumber: 2,
      amount: 45.5,
      method: PaymentMethod.CREDIT_CARD,
      status: PaymentStatus.PENDING,
      createdAt:"2023-05-17T16:00:00Z",
      cashier:"Jane Smith",
     },
    ];
    setPayments(mockPayments);
   } finally {
    setLoading(false);
   }
  };

  fetchPayments();
 }, []);

 const filteredPayments = payments.filter((payment) => {
  const matchesStatus =
   statusFilter ==="all" || payment.status === statusFilter;
  const matchesMethod =
   methodFilter ==="all" || payment.method === methodFilter;
  const matchesSearch = searchQuery === "" || 
   (payment.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase())) ||
   (payment.tableNumber && String(payment.tableNumber).includes(searchQuery));
  return matchesStatus && matchesMethod && matchesSearch;
 });

 const getStatusColor = (status: PaymentStatus) => {
  switch (status) {
   case PaymentStatus.PENDING:
    return"bg-yellow-100 text-yellow-800";
   case PaymentStatus.COMPLETED:
    return"bg-green-100 text-green-800";
   case PaymentStatus.REFUNDED:
    return"bg-red-100 text-red-800";
   default:
    return"bg-gray-100 text-gray-800";
  }
 };

 const getMethodIcon = (method: PaymentMethod) => {
  switch (method) {
   case PaymentMethod.CASH:
    return <BanknotesIcon className="h-5 w-5 text-green-500" />;
   case PaymentMethod.CREDIT_CARD:
   case PaymentMethod.DEBIT_CARD:
    return <CreditCardIcon className="h-5 w-5 text-blue-500" />;
   case PaymentMethod.STRIPE:
   case PaymentMethod.PAYPAL:
   case PaymentMethod.IYZICO:
    return <CurrencyDollarIcon className="h-5 w-5 text-purple-500" />;
   default:
    return null;
  }
 };

 const handleProcessPayment = (orderId: string) => {
  navigate(`/app/payments/process/${orderId}`);
 };

 const formatAmount = (amount: number | string): string => {
  const numAmount = Number(amount || 0);
  return isNaN(numAmount) ? "0.00" : numAmount.toFixed(2);
 };

 return (
  <div>
   <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold text-gray-800">Payment Management</h2>
   </div>

   <div className="bg-white rounded-lg shadow p-6 mb-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
     <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
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
        <option value={PaymentStatus.PENDING}>Pending</option>
        <option value={PaymentStatus.COMPLETED}>Completed</option>
        <option value={PaymentStatus.REFUNDED}>Refunded</option>
       </select>
      </div>
      <div>
       <label
        htmlFor="method"
        className="block text-sm font-medium text-gray-700 mb-1"
       >
        Payment Method
       </label>
       <select
        id="method"
        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        value={methodFilter}
        onChange={(e) => setMethodFilter(e.target.value)}
       >
        <option value="all">All Methods</option>
        <option value={PaymentMethod.CASH}>Cash</option>
        <option value={PaymentMethod.CREDIT_CARD}>Credit Card</option>
        <option value={PaymentMethod.DEBIT_CARD}>Debit Card</option>
        <option value={PaymentMethod.STRIPE}>Stripe</option>
        <option value={PaymentMethod.PAYPAL}>PayPal</option>
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
        placeholder="Search by order # or table..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
       />
      </div>
     </div>
    </div>
   </div>

   <div className="bg-white rounded-lg shadow overflow-hidden">
    {loading ? (
     <div className="flex justify-center items-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
     </div>
    ) : (
     <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
       <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Order #
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Table
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Amount
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Method
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Status
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Date & Time
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Actions
        </th>
       </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
       {filteredPayments.length === 0 ? (
        <tr>
         <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
          No payments found
         </td>
        </tr>
       ) : (
        filteredPayments.map((payment) => (
       <tr key={payment.id}>
        <td className="px-6 py-4 whitespace-nowrap">
         <div className="text-sm font-medium text-gray-900">
          {payment.orderNumber || 'N/A'}
         </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
         <div className="text-sm text-gray-500">
          Table {payment.tableNumber ? String(payment.tableNumber) : 'N/A'}
         </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
         <div className="text-sm text-gray-900">
          ${formatAmount(payment.amount)}
         </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
         <div className="flex items-center text-sm text-gray-500">
          {getMethodIcon(payment.method)}
          <span className="ml-1">
           {payment.method === PaymentMethod.CREDIT_CARD
            ?"Credit Card"
            : payment.method === PaymentMethod.DEBIT_CARD
            ?"Debit Card"
            : payment.method === PaymentMethod.STRIPE
            ?"Stripe"
            : payment.method === PaymentMethod.PAYPAL
            ?"PayPal"
            : payment.method === PaymentMethod.IYZICO
            ?"Iyzico"
            :"Cash"}
          </span>
         </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
         <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
           payment.status
          )}`}
         >
          {payment.status.charAt(0).toUpperCase() +
           payment.status.slice(1)}
         </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
         <div className="text-sm text-gray-500">
          {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A'}
         </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
         {payment.status === PaymentStatus.COMPLETED && (
          <button className="text-red-600 hover:text-red-900 flex items-center">
           <ReceiptRefundIcon className="h-4 w-4 mr-1" />
           Refund
          </button>
         )}
         {payment.status === PaymentStatus.PENDING && (
          <button
           onClick={() => handleProcessPayment(payment.id)}
           className="text-green-600 hover:text-green-900 flex items-center"
          >
           <CurrencyDollarIcon className="h-4 w-4 mr-1" />
           Process
          </button>
         )}
        </td>
        </tr>
        ))
       )}
      </tbody>
     </table>
    )}
   </div>
  </div>
 );
};

export default Payments;
