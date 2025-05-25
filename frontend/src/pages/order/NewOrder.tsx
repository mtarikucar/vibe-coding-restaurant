import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { menuAPI, tableAPI, orderAPI } from "../../services/api";
import { type Category, type MenuItem } from "../../types/menu";
import { type Table, TableStatus } from "../../types/table";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/formatters";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  ArrowLeftIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "../../store/authStore";
import { useToast } from "../../components/common/ToastProvider";
import { Button, Input, Textarea } from "../../components/ui";

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

const NewOrder: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tableIdFromUrl = queryParams.get("tableId");

  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>(
    tableIdFromUrl || ""
  );
  const [table, setTable] = useState<Table | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { success, error } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all tables
        const tablesData = await tableAPI.getTables();
        setTables(tablesData);

        // Fetch table details if tableId is provided
        if (selectedTableId) {
          const tableData = await tableAPI.getTable(selectedTableId);
          setTable(tableData);
        }

        // Fetch menu categories
        const categoriesData = await menuAPI.getCategories();
        setCategories(categoriesData);

        // Fetch all menu items
        const menuItemsData = await menuAPI.getMenuItems();
        setMenuItems(menuItemsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        error(t("common.error"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTableId, t, error]);

  const handleTableSelect = async (tableId: string) => {
    setSelectedTableId(tableId);
    try {
      const tableData = await tableAPI.getTable(tableId);
      setTable(tableData);
    } catch (err) {
      console.error("Error fetching table:", err);
      error(t("tables.fetchError", "Failed to fetch table details"));
    }
  };

  const filteredMenuItems = menuItems.filter((item) => {
    // Filter by category
    const categoryMatch =
      selectedCategory === "all" || item.categoryId === selectedCategory;

    // Filter by search query
    const searchMatch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Only show available items
    return categoryMatch && searchMatch && item.isAvailable;
  });

  const handleAddItem = (item: MenuItem) => {
    const existingItem = orderItems.find((i) => i.menuItemId === item.id);

    if (existingItem) {
      // Update quantity if item already exists
      setOrderItems(
        orderItems.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      // Add new item
      setOrderItems([
        ...orderItems,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ]);
    }
  };

  const handleRemoveItem = (menuItemId: string) => {
    const existingItem = orderItems.find((i) => i.menuItemId === menuItemId);

    if (existingItem && existingItem.quantity > 1) {
      // Decrease quantity if more than 1
      setOrderItems(
        orderItems.map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i
        )
      );
    } else {
      // Remove item if quantity is 1
      setOrderItems(orderItems.filter((i) => i.menuItemId !== menuItemId));
    }
  };

  const handleDeleteItem = (menuItemId: string) => {
    setOrderItems(orderItems.filter((i) => i.menuItemId !== menuItemId));
  };

  const handleUpdateNotes = (menuItemId: string, notes: string) => {
    setOrderItems(
      orderItems.map((i) => (i.menuItemId === menuItemId ? { ...i, notes } : i))
    );
  };

  const calculateTotal = () => {
    return orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      error(t("orders.emptyOrderError"));
      return;
    }

    if (!selectedTableId) {
      error(t("orders.selectTableError", "Please select a table"));
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        tableId: selectedTableId,
        waiterId: user?.id,
        items: orderItems.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes || "",
        })),
        notes: notes,
      };

      const response = await orderAPI.createOrder(orderData);
      success(t("orders.createSuccess"));
      navigate(`/app/orders/${response.id}`);
    } catch (err) {
      console.error("Error creating order:", err);
      error(t("orders.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            {t("common.back", "Back")}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary-900 dark:text-neutral-100">
              {t("orders.newOrder")}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              {t(
                "orders.newOrderSubtitle",
                "Create a new order for your table"
              )}
            </p>
          </div>
        </div>
        {table && (
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span className="font-semibold text-primary-900 dark:text-primary-100">
                {t("tables.tableNumber", { number: table.number })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Table Selection */}
      {!selectedTableId && (
        <div className="bg-white dark:bg-darkGray-800 rounded-2xl shadow-soft p-6 mb-8">
          <h2 className="text-xl font-semibold text-primary-900 dark:text-neutral-100 mb-4">
            {t("orders.selectTable", "Select a Table")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables
              .filter(
                (t) => t.status === "available" || t.status === "occupied"
              )
              .map((tableItem) => (
                <button
                  key={tableItem.id}
                  onClick={() => handleTableSelect(tableItem.id)}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    tableItem.status === "available"
                      ? "border-green-200 bg-green-50 dark:bg-green-900/20 hover:border-green-300"
                      : "border-orange-200 bg-orange-50 dark:bg-orange-900/20 hover:border-orange-300"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary-900 dark:text-neutral-100">
                      {tableItem.number}
                    </div>
                    <div
                      className={`text-xs font-medium mt-1 ${
                        tableItem.status === "available"
                          ? "text-green-600 dark:text-green-400"
                          : "text-orange-600 dark:text-orange-400"
                      }`}
                    >
                      {t(`tables.status.${tableItem.status}`, tableItem.status)}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu Section */}
        <div className="lg:col-span-2 bg-white dark:bg-darkGray-800 rounded-2xl shadow-soft p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-primary-900 dark:text-neutral-100 mb-4">
              {t("menu.title", "Menu")}
            </h2>
            <div className="mb-6">
              <Input
                placeholder={t(
                  "menu.searchPlaceholder",
                  "Search menu items..."
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
                fullWidth
              />
            </div>

            <div className="flex overflow-x-auto pb-2 mb-6 gap-3">
              <button
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "all"
                    ? "bg-primary-500 text-white shadow-md"
                    : "bg-neutral-100 dark:bg-darkGray-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-darkGray-600"
                }`}
                onClick={() => setSelectedCategory("all")}
              >
                {t("menu.allCategories")}
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? "bg-primary-500 text-white shadow-md"
                      : "bg-neutral-100 dark:bg-darkGray-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-darkGray-600"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
              <span className="ml-3 text-neutral-600 dark:text-neutral-400">
                {t("common.loading", "Loading...")}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMenuItems.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <div className="mb-4">
                    <ShoppingCartIcon className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    {t("menu.noItemsTitle", "No menu items found")}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {t(
                      "menu.noItemsDescription",
                      "Try adjusting your search or category filter."
                    )}
                  </p>
                </div>
              ) : (
                filteredMenuItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-neutral-50 dark:bg-darkGray-700 border border-neutral-200 dark:border-darkGray-600 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 mr-4">
                          <h3 className="font-semibold text-primary-900 dark:text-neutral-100 text-lg">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <p className="text-primary-600 dark:text-primary-400 font-bold text-lg mt-3">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAddItem(item)}
                          className="rounded-full p-3"
                        >
                          <PlusIcon className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Order Summary Section */}
        <div className="bg-white dark:bg-darkGray-800 rounded-2xl shadow-soft p-6 sticky top-6">
          <div className="flex items-center gap-2 mb-6">
            <ShoppingCartIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h3 className="text-xl font-semibold text-primary-900 dark:text-neutral-100">
              {t("orders.summary")}
            </h3>
          </div>

          {orderItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <ShoppingCartIcon className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500" />
              </div>
              <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                {t("orders.emptyCart", "Your cart is empty")}
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                {t(
                  "orders.addItemsToCart",
                  "Add items from the menu to get started"
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {orderItems.map((item) => (
                <div
                  key={item.menuItemId}
                  className="bg-neutral-50 dark:bg-darkGray-700 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-primary-900 dark:text-neutral-100">
                        {item.name}
                      </h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {formatCurrency(item.price)} x {item.quantity} ={" "}
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                    <button
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                      onClick={() => handleDeleteItem(item.menuItemId)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {t("orders.quantity", "Quantity")}
                    </span>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveItem(item.menuItemId)}
                        className="w-8 h-8 p-0 rounded-full"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </Button>
                      <span className="font-semibold text-primary-900 dark:text-neutral-100 w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAddItem({
                            id: item.menuItemId,
                            name: item.name,
                            price: item.price,
                            isAvailable: true,
                            categoryId: "",
                          } as MenuItem)
                        }
                        className="w-8 h-8 p-0 rounded-full"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Input
                      placeholder={t(
                        "orders.itemNotes",
                        "Add notes for this item..."
                      )}
                      value={item.notes || ""}
                      onChange={(e) =>
                        handleUpdateNotes(item.menuItemId, e.target.value)
                      }
                      size="sm"
                      fullWidth
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t("orders.generalNotes", "General Notes")}
            </label>
            <Textarea
              placeholder={t(
                "orders.notesPlaceholder",
                "Add any special instructions..."
              )}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              fullWidth
            />
          </div>

          <div className="border-t border-neutral-200 dark:border-darkGray-600 pt-6 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-primary-900 dark:text-neutral-100">
                {t("common.total")}
              </span>
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmitOrder}
              disabled={
                orderItems.length === 0 || submitting || !selectedTableId
              }
              loading={submitting}
              fullWidth
            >
              {submitting ? t("common.processing") : t("orders.placeOrder")}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleCancel}
              fullWidth
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrder;
