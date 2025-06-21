import { useState, useEffect } from"react";
import { Link, useNavigate } from"react-router-dom";
import {
 DocumentTextIcon,
 PlusIcon,
 EyeIcon,
 ArrowDownTrayIcon,
 DocumentDuplicateIcon,
 XCircleIcon,
 CheckCircleIcon,
 ClockIcon,
 ArrowPathIcon,
 MagnifyingGlassIcon,
} from"@heroicons/react/24/outline";
import { invoiceAPI } from"../../services/invoiceAPI";
import { formatCurrency, formatDate } from"../../utils/formatters";
import { useToast } from"../../components/common/ToastProvider";
import { useTranslation } from"react-i18next";
import { Button, Input, Select } from"../../components/ui";

// Define types directly in this file
export enum InvoiceStatus {
 DRAFT ="draft",
 ISSUED ="issued",
 PAID ="paid",
 CANCELLED ="cancelled",
}

export enum InvoiceType {
 STANDARD ="standard",
 PROFORMA ="proforma",
 CREDIT ="credit",
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
 const { t } = useTranslation();

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
   setError(err.message ||"Failed to load invoices");
  } finally {
   setLoading(false);
  }
 };

 const handleDownloadInvoice = async (id: string) => {
  try {
   await invoiceAPI.downloadInvoice(id);
  } catch (err: any) {
   showToast("error", err.message ||"Failed to download invoice");
  }
 };

 const handleRegenerateInvoice = async (id: string) => {
  try {
   await invoiceAPI.regenerateInvoice(id);
   showToast("success","Invoice regenerated successfully");
  } catch (err: any) {
   showToast("error", err.message ||"Failed to regenerate invoice");
  }
 };

 const handleDeleteInvoice = async (id: string) => {
  if (!window.confirm("Are you sure you want to delete this invoice?")) {
   return;
  }

  try {
   await invoiceAPI.deleteInvoice(id);
   showToast("success","Invoice deleted successfully");
   fetchInvoices();
  } catch (err: any) {
   showToast("error", err.message ||"Failed to delete invoice");
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
    return"bg-gray-100 text-gray-800";
   case InvoiceStatus.ISSUED:
    return"bg-blue-100 text-blue-800";
   case InvoiceStatus.PAID:
    return"bg-green-100 text-green-800";
   case InvoiceStatus.CANCELLED:
    return"bg-red-100 text-red-800";
   default:
    return"bg-gray-100 text-gray-800";
  }
 };

 const filteredInvoices = invoices.filter((invoice) => {
  // Filter by status
  if (statusFilter !=="all" && invoice.status !== statusFilter) {
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
   <div className="p-6">
    <div className="flex justify-center items-center h-64">
     <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
     <span className="ml-3 text-neutral-600">
      {t("invoice.loading","Loading invoices...")}
     </span>
    </div>
   </div>
  );
 }

 if (error) {
  return (
   <div className="p-6">
    <div className="bg-red-50/20 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
     <h3 className="font-semibold mb-2">{t("common.error","Error")}</h3>
     <p className="mb-4">{error}</p>
     <Button
      variant="outline"
      onClick={fetchInvoices}
      leftIcon={<ArrowPathIcon className="h-4 w-4" />}
     >
      {t("common.retry","Retry")}
     </Button>
    </div>
   </div>
  );
 }

 return (
  <div className="p-6">
   {/* Header */}
   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
    <div>
     <h1 className="text-3xl font-bold text-primary-900">
      {t("invoice.title","Invoice Management")}
     </h1>
     <p className="text-neutral-600 mt-1">
      {t("invoice.subtitle","Create, manage and track all invoices")}
     </p>
    </div>
    <Button
     as={Link}
     to="/app/invoices/new"
     variant="primary"
     leftIcon={<PlusIcon className="h-4 w-4" />}
    >
     {t("invoice.newInvoice","New Invoice")}
    </Button>
   </div>

   {/* Filters */}
   <div className="bg-white rounded-2xl shadow-soft p-6 mb-8">
    <div className="flex flex-col lg:flex-row gap-6">
     <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
       <Select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        options={[
         {
          value:"all",
          label: t("invoice.allStatuses","All Statuses"),
         },
         {
          value: InvoiceStatus.DRAFT,
          label: t("invoice.draft","Draft"),
         },
         {
          value: InvoiceStatus.ISSUED,
          label: t("invoice.issued","Issued"),
         },
         {
          value: InvoiceStatus.PAID,
          label: t("invoice.paid","Paid"),
         },
         {
          value: InvoiceStatus.CANCELLED,
          label: t("invoice.cancelled","Cancelled"),
         },
        ]}
        fullWidth
       />
      </div>
      <div>
       <Input
        placeholder={t(
        "invoice.searchPlaceholder",
        "Search invoices, orders, customers..."
        )}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
        fullWidth
       />
      </div>
     </div>
     <div className="flex items-end">
      <Button
       variant="outline"
       onClick={fetchInvoices}
       leftIcon={<ArrowPathIcon className="h-4 w-4" />}
      >
       {t("common.refresh","Refresh")}
      </Button>
     </div>
    </div>
   </div>

   {/* Invoices Table */}
   <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
    {filteredInvoices.length > 0 ? (
     <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200">
       <thead className="bg-neutral-50">
        <tr>
         <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
          {t("invoice.invoiceNumber","Invoice #")}
         </th>
         <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
          {t("invoice.orderNumber","Order #")}
         </th>
         <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
          {t("invoice.customer","Customer")}
         </th>
         <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
          {t("invoice.amount","Amount")}
         </th>
         <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
          {t("invoice.status","Status")}
         </th>
         <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
          {t("invoice.date","Date")}
         </th>
         <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
          {t("common.actions","Actions")}
         </th>
        </tr>
       </thead>
       <tbody className="bg-white divide-y divide-neutral-200">
        {filteredInvoices.map((invoice) => (
         <tr
          key={invoice.id}
          className="hover:bg-neutral-50 transition-colors"
         >
          <td className="px-6 py-4 whitespace-nowrap">
           <div className="flex items-center gap-3">
            {getStatusIcon(invoice.status)}
            <div className="text-sm font-semibold text-primary-900">
             {invoice.invoiceNumber}
            </div>
           </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
           <div className="text-sm text-neutral-600">
            {invoice.order.orderNumber}
           </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
           <div className="text-sm text-neutral-600">
            {invoice.customerName ||
             t("common.notAvailable","N/A")}
           </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
           <div className="text-sm font-semibold text-primary-900">
            {formatCurrency(invoice.totalAmount)}
           </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
           <span
            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
             invoice.status
            )}`}
           >
            {t(
             `invoice.statuses.${invoice.status}`,
             invoice.status.charAt(0).toUpperCase() +
              invoice.status.slice(1)
            )}
           </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
           <div className="text-sm text-neutral-600">
            {formatDate(invoice.issueDate)}
           </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
           <div className="flex gap-2">
            <Button
             variant="ghost"
             size="sm"
             onClick={() =>
              navigate(`/app/invoices/${invoice.id}`)
             }
             leftIcon={<EyeIcon className="h-4 w-4" />}
            >
             {t("common.view","View")}
            </Button>
            <Button
             variant="ghost"
             size="sm"
             onClick={() => handleDownloadInvoice(invoice.id)}
             leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
            >
             {t("invoice.download","Download")}
            </Button>
            <Button
             variant="ghost"
             size="sm"
             onClick={() => handleRegenerateInvoice(invoice.id)}
             leftIcon={
              <DocumentDuplicateIcon className="h-4 w-4" />
             }
            >
             {t("invoice.regenerate","Regenerate")}
            </Button>
            {invoice.status === InvoiceStatus.DRAFT && (
             <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteInvoice(invoice.id)}
              leftIcon={<XCircleIcon className="h-4 w-4" />}
              className="text-red-600 hover:text-red-700"
             >
              {t("common.delete","Delete")}
             </Button>
            )}
           </div>
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    ) : (
     <div className="p-12 text-center">
      <div className="mb-4">
       <DocumentTextIcon className="mx-auto h-12 w-12 text-neutral-400" />
      </div>
      <h3 className="text-lg font-medium text-neutral-900 mb-2">
       {t("invoice.noInvoicesTitle","No invoices found")}
      </h3>
      <p className="text-neutral-600 mb-6">
       {t(
       "invoice.noInvoicesDescription",
       "Start by creating your first invoice or adjust your filters."
       )}
      </p>
      <Button
       as={Link}
       to="/app/invoices/new"
       variant="primary"
       leftIcon={<PlusIcon className="h-4 w-4" />}
      >
       {t("invoice.createFirstInvoice","Create First Invoice")}
      </Button>
     </div>
    )}
   </div>
  </div>
 );
};

export default Invoices;
