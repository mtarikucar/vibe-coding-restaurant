import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { menuAPI } from "../../services/api";
import { type MenuItem, type Category } from "../../types/menu";
import { useToast } from "../../components/common/ToastProvider";
import usePerformanceMonitoring from "../../hooks/usePerformanceMonitoring";
import { Input, Select } from "../../components/ui";
import MenuItemForm from "../../components/menu/MenuItemForm";
import CategoryManager from "../../components/menu/CategoryManager";
import BulkMenuUpload from "../../components/menu/BulkMenuUpload";
import MenuVisualization from "../../components/menu/MenuVisualization";

const Menu = () => {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState({
    categories: false,
    menuItems: false,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showVisualizationModal, setShowVisualizationModal] = useState(false);
  const [currentMenuItem, setCurrentMenuItem] = useState<MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize performance monitoring
  const { trackAsyncOperation } = usePerformanceMonitoring("Menu", {
    trackMount: true,
    trackRender: true,
    metadata: { component: "Menu" },
  });

  const fetchData = async () => {
    try {
      // Fetch categories
      setLoading((prev) => ({ ...prev, categories: true }));
      const categoriesData = await trackAsyncOperation("fetchCategories", () =>
        menuAPI.getCategories()
      );
      setCategories(categoriesData);
      setLoading((prev) => ({ ...prev, categories: false }));

      // Fetch menu items
      setLoading((prev) => ({ ...prev, menuItems: true }));
      const menuItemsData = await trackAsyncOperation("fetchMenuItems", () =>
        menuAPI.getMenuItems()
      );
      setMenuItems(menuItemsData);
      setLoading((prev) => ({ ...prev, menuItems: false }));
    } catch (err) {
      console.error("Error fetching menu data:", err);
      error(t("menu.fetchError", "Failed to load menu data"));
      setLoading({
        categories: false,
        menuItems: false,
      });
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      // In a real app, you would upload the image to a server
      // For now, we'll simulate an upload delay and return a placeholder URL
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create a data URL for the image (this is just for demo purposes)
      // In a real app, you would get a URL from your server after uploading
      return URL.createObjectURL(file);
    } catch (err) {
      console.error("Error uploading image:", err);
      throw new Error("Failed to upload image");
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.categoryId === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAddItem = () => {
    setShowAddModal(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setCurrentMenuItem(item);
    setShowEditModal(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (
      window.confirm(
        t("menu.deleteConfirm", "Are you sure you want to delete this item?")
      )
    ) {
      try {
        await trackAsyncOperation("deleteMenuItem", () =>
          menuAPI.deleteMenuItem(id)
        );
        success(t("menu.deleteSuccess", "Menu item deleted successfully"));
        fetchData(); // Refresh the data
      } catch (err) {
        console.error("Error deleting menu item:", err);
        error(t("menu.deleteError", "Failed to delete menu item"));
      }
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleManageCategories = () => {
    setShowCategoryModal(true);
  };

  const handleBulkUpload = () => {
    setShowBulkUploadModal(true);
  };

  const handleVisualization = () => {
    setShowVisualizationModal(true);
  };

  const handleBulkSave = async (menuItems: MenuItem[]) => {
    try {
      setIsSubmitting(true);

      for (const menuItem of menuItems) {
        // Handle image upload if present
        if (menuItem.imageFile) {
          try {
            const imageUrl = await uploadImage(menuItem.imageFile);
            menuItem.imageUrl = imageUrl;
          } catch (err) {
            console.error(
              "Error uploading image for item:",
              menuItem.name,
              err
            );
            // Continue with other items even if one image fails
          }
        }

        // Create the menu item without the imageFile property
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { imageFile, ...menuItemToSave } = menuItem;
        await trackAsyncOperation("createMenuItem", () =>
          menuAPI.createMenuItem(menuItemToSave)
        );
      }

      success(
        t(
          "menu.bulkCreateSuccess",
          `Successfully created ${menuItems.length} menu items`
        )
      );
      setShowBulkUploadModal(false);
      fetchData(); // Refresh the data
    } catch (err) {
      console.error("Error creating menu items:", err);
      error(t("menu.bulkCreateError", "Failed to create menu items"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveMenuItem = async (menuItem: MenuItem) => {
    setIsSubmitting(true);
    try {
      let imageUrl = menuItem.imageUrl;

      // If there's a new image file, upload it
      if (menuItem.imageFile) {
        imageUrl = await uploadImage(menuItem.imageFile);
      }

      // Create a copy without the imageFile property
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { imageFile, ...menuItemToSave } = menuItem;

      // Add the imageUrl from the upload
      const itemWithImage = {
        ...menuItemToSave,
        imageUrl,
      };

      if (menuItem.id && !menuItem.id.startsWith("temp-")) {
        // Update existing item
        await trackAsyncOperation("updateMenuItem", () =>
          menuAPI.updateMenuItem(menuItem.id, itemWithImage)
        );
        success(t("menu.updateSuccess", "Menu item updated successfully"));
      } else {
        // Create new item
        await trackAsyncOperation("createMenuItem", () =>
          menuAPI.createMenuItem(itemWithImage)
        );
        success(t("menu.createSuccess", "Menu item created successfully"));
      }

      // Close the modal and refresh data
      setShowAddModal(false);
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      console.error("Error saving menu item:", err);
      error(t("menu.saveError", "Failed to save menu item"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCategories = async (updatedCategories: Category[]) => {
    setIsSubmitting(true);
    try {
      // In a real app, you would make API calls to create/update/delete categories
      // For now, we'll simulate a delay and update the local state
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update the categories in the API
      await trackAsyncOperation("updateCategories", () =>
        menuAPI.updateCategories(updatedCategories)
      );

      success(t("menu.categoriesUpdated", "Categories updated successfully"));
      setShowCategoryModal(false);
      fetchData();
    } catch (err) {
      console.error("Error updating categories:", err);
      error(t("menu.categoriesError", "Failed to update categories"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-primary-900 dark:text-neutral-100">
          {t("menu.title", "Menu Management")}
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRefresh}
            className="bg-neutral-200 dark:bg-darkGray-700 hover:bg-neutral-300 dark:hover:bg-darkGray-600 text-primary-700 dark:text-neutral-300 px-3 py-2 rounded-xl flex items-center transition-colors"
            title={t("common.refresh", "Refresh")}
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>

          <button
            onClick={handleVisualization}
            className="bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-xl flex items-center transition-colors"
          >
            <EyeIcon className="h-5 w-5 mr-2" />
            {t("menu.visualize", "Visualize")}
          </button>

          <button
            onClick={handleBulkUpload}
            className="bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-xl flex items-center transition-colors"
          >
            <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
            {t("menu.bulkUpload", "Bulk Upload")}
          </button>

          <button
            onClick={handleManageCategories}
            className="bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-xl flex items-center transition-colors"
          >
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            {t("menu.manageCategories", "Manage Categories")}
          </button>

          <button
            onClick={handleAddItem}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl flex items-center transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {t("menu.addItem", "Add Item")}
          </button>
        </div>
      </div>

      <div className="bg-neutral-100 dark:bg-darkGray-800 rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-6">
          <div className="flex-1">
            <Select
              label={t("menu.category", "Category")}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                {
                  value: "all",
                  label: t("menu.allCategories", "All Categories"),
                },
                ...categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
            />
          </div>
          <div className="flex-1">
            <Input
              label={t("common.search", "Search")}
              type="text"
              placeholder={t("menu.searchPlaceholder", "Search menu items...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
            />
          </div>
        </div>
      </div>

      {loading.menuItems ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="bg-neutral-100 dark:bg-darkGray-800 rounded-xl shadow-sm overflow-hidden">
          {filteredItems.length > 0 ? (
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-darkGray-700">
              <thead className="bg-neutral-200 dark:bg-darkGray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 dark:text-neutral-300 uppercase tracking-wider">
                    {t("menu.item", "Item")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 dark:text-neutral-300 uppercase tracking-wider">
                    {t("menu.description", "Description")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 dark:text-neutral-300 uppercase tracking-wider">
                    {t("menu.price", "Price")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 dark:text-neutral-300 uppercase tracking-wider">
                    {t("menu.category", "Category")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 dark:text-neutral-300 uppercase tracking-wider">
                    {t("menu.status", "Status")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 dark:text-neutral-300 uppercase tracking-wider">
                    {t("common.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-neutral-100 dark:bg-darkGray-800 divide-y divide-neutral-200 dark:divide-darkGray-700">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-neutral-200 dark:hover:bg-darkGray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.imageUrl && (
                          <div className="flex-shrink-0 h-12 w-12 mr-4">
                            <img
                              className="h-12 w-12 rounded-xl object-cover shadow-sm"
                              src={item.imageUrl}
                              alt={item.name}
                            />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-primary-900 dark:text-neutral-100">
                            {item.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xs truncate">
                        {item.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-primary-900 dark:text-neutral-100">
                        $
                        {typeof item.price === "number"
                          ? item.price.toFixed(2)
                          : "0.00"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        {categories.find((c) => c.id === item.categoryId)
                          ?.name || "Unknown"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.isAvailable
                            ? "bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300"
                            : "bg-danger-100 dark:bg-danger-900/30 text-danger-800 dark:text-danger-300"
                        }`}
                      >
                        {item.isAvailable
                          ? t("menu.available", "Available")
                          : t("menu.unavailable", "Unavailable")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                          title={t("common.edit", "Edit")}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-danger-600 hover:text-danger-800 dark:text-danger-400 dark:hover:text-danger-300 transition-colors"
                          title={t("common.delete", "Delete")}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-neutral-600 dark:text-neutral-400">
              <div className="max-w-sm mx-auto">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-16 w-16 text-neutral-400 dark:text-neutral-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-primary-900 dark:text-neutral-100 mb-2">
                  {t("menu.noItemsTitle", "No menu items")}
                </h3>
                <p className="text-sm mb-6">
                  {t(
                    "menu.noItemsDescription",
                    "Get started by adding your first menu item or importing items in bulk."
                  )}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleAddItem}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {t("menu.addFirstItem", "Add First Item")}
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    className="bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                    {t("menu.bulkImport", "Bulk Import")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Menu Item Form Modals */}
      <MenuItemForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveMenuItem}
        categories={categories}
        isLoading={isSubmitting}
      />

      <MenuItemForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveMenuItem}
        menuItem={currentMenuItem}
        categories={categories}
        isLoading={isSubmitting}
      />

      {/* Category Manager Modal */}
      <CategoryManager
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSave={handleSaveCategories}
        categories={categories}
        isLoading={isSubmitting}
      />

      {/* Bulk Upload Modal */}
      <BulkMenuUpload
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSave={handleBulkSave}
        categories={categories}
        isLoading={isSubmitting}
      />

      {/* Menu Visualization Modal */}
      <MenuVisualization
        isOpen={showVisualizationModal}
        onClose={() => setShowVisualizationModal(false)}
        menuItems={menuItems}
        categories={categories}
      />
    </div>
  );
};

export default Menu;
