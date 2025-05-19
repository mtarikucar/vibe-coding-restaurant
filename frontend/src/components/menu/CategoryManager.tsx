import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Button, Card } from "../../components/ui";
import { type Category } from "../../types/menu";
import { useToast } from "../../components/common/ToastProvider";

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categories: Category[]) => void;
  categories: Category[];
  isLoading: boolean;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  isOpen,
  onClose,
  onSave,
  categories: initialCategories,
  isLoading,
}) => {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setCategories(initialCategories);
      setNewCategory("");
      setEditingCategory(null);
      setErrors({});
    }
  }, [initialCategories, isOpen]);

  const [newCategoryActive, setNewCategoryActive] = useState(true);

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      setErrors({
        newCategory: t(
          "menu.categoryNameRequired",
          "Category name is required"
        ),
      });
      return;
    }

    // Check for duplicate category names
    if (
      categories.some(
        (cat) => cat.name.toLowerCase() === newCategory.trim().toLowerCase()
      )
    ) {
      setErrors({
        newCategory: t("menu.categoryExists", "Category already exists"),
      });
      return;
    }

    // In a real app, you would generate a unique ID on the server
    // For now, we'll create a temporary ID
    const tempId = `temp-${Date.now()}`;

    // Create a new category with required fields
    const newCategoryObj: Category = {
      id: tempId,
      name: newCategory.trim(),
      isActive: newCategoryActive,
    };

    setCategories([...categories, newCategoryObj]);
    setNewCategory("");
    setNewCategoryActive(true);
    setErrors({});
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      setErrors({
        editCategory: t(
          "menu.categoryNameRequired",
          "Category name is required"
        ),
      });
      return;
    }

    // Check for duplicate category names (excluding the current category)
    if (
      categories.some(
        (cat) =>
          cat.id !== editingCategory.id &&
          cat.name.toLowerCase() === editingCategory.name.trim().toLowerCase()
      )
    ) {
      setErrors({
        editCategory: t("menu.categoryExists", "Category already exists"),
      });
      return;
    }

    setCategories(
      categories.map((cat) =>
        cat.id === editingCategory.id
          ? { ...cat, name: editingCategory.name.trim() }
          : cat
      )
    );
    setEditingCategory(null);
    setErrors({});
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (
      window.confirm(
        t(
          "menu.confirmDeleteCategory",
          "Are you sure you want to delete this category?"
        )
      )
    ) {
      setCategories(categories.filter((cat) => cat.id !== categoryId));
    }
  };

  const handleSaveCategories = () => {
    onSave(categories);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">
            {t("menu.manageCategories", "Manage Categories")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <label
              htmlFor="newCategory"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("menu.addNewCategory", "Add New Category")}
            </label>
            <div className="flex">
              <input
                type="text"
                id="newCategory"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className={`flex-1 border ${
                  errors.newCategory ? "border-danger-500" : "border-gray-300"
                } rounded-l-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                placeholder={t(
                  "menu.categoryNamePlaceholder",
                  "Enter category name"
                )}
              />
              <Button
                type="button"
                variant="primary"
                className="rounded-l-none"
                onClick={handleAddCategory}
              >
                <PlusIcon className="h-5 w-5" />
              </Button>
            </div>
            {errors.newCategory && (
              <p className="text-danger-500 text-xs mt-1">
                {errors.newCategory}
              </p>
            )}

            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="newCategoryActive"
                checked={newCategoryActive}
                onChange={(e) => setNewCategoryActive(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
              />
              <label
                htmlFor="newCategoryActive"
                className="text-sm text-gray-700"
              >
                {t("menu.active", "Active")}
              </label>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-700 mb-2">
              {t("menu.existingCategories", "Existing Categories")}
            </h3>
            {categories.length === 0 ? (
              <p className="text-gray-500 text-sm">
                {t(
                  "menu.noCategories",
                  "No categories found. Add a category to get started."
                )}
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {categories.map((category) => (
                  <li key={category.id} className="py-3">
                    {editingCategory && editingCategory.id === category.id ? (
                      <div className="space-y-2">
                        <div className="flex">
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                name: e.target.value,
                              })
                            }
                            className={`flex-1 border ${
                              errors.editCategory
                                ? "border-danger-500"
                                : "border-gray-300"
                            } rounded-l-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                          />
                          <Button
                            type="button"
                            variant="primary"
                            className="rounded-l-none"
                            onClick={handleUpdateCategory}
                          >
                            {t("common.save", "Save")}
                          </Button>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`isActive-${editingCategory.id}`}
                            checked={editingCategory.isActive !== false}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                isActive: e.target.checked,
                              })
                            }
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                          />
                          <label
                            htmlFor={`isActive-${editingCategory.id}`}
                            className="text-sm text-gray-700"
                          >
                            {t("menu.active", "Active")}
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span
                            className={`text-gray-800 ${
                              !category.isActive ? "opacity-50" : ""
                            }`}
                          >
                            {category.name}
                          </span>
                          {category.isActive === false && (
                            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                              {t("menu.inactive", "Inactive")}
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="text-primary-600 hover:text-primary-900"
                            title={t("common.edit", "Edit")}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-danger-600 hover:text-danger-900"
                            title={t("common.delete", "Delete")}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}
                    {errors.editCategory &&
                      editingCategory &&
                      editingCategory.id === category.id && (
                        <p className="text-danger-500 text-xs mt-1">
                          {errors.editCategory}
                        </p>
                      )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveCategories}
              disabled={isLoading}
              isLoading={isLoading}
            >
              {t("common.saveChanges", "Save Changes")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
