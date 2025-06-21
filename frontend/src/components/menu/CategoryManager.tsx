import React, { useState, useEffect } from"react";
import { useTranslation } from"react-i18next";
import {
 XMarkIcon,
 PencilIcon,
 TrashIcon,
 PlusIcon,
} from"@heroicons/react/24/outline";
import { Button, Input } from"../../components/ui";
import { type Category } from"../../types/menu";

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
    newCategory: t("menu.categoryExists","Category already exists"),
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
    editCategory: t("menu.categoryExists","Category already exists"),
   });
   return;
  }

  setCategories(
   categories.map((cat) =>
    cat.id === editingCategory.id
     ? {
       ...cat,
       name: editingCategory.name.trim(),
       isActive: editingCategory.isActive,
      }
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
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
   <div className="bg-neutral-100 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-soft">
    <div className="flex justify-between items-center p-6 border-b border-neutral-300">
     <h2 className="text-xl font-bold text-primary-900">
      {t("menu.manageCategories","Manage Categories")}
     </h2>
     <button
      onClick={onClose}
      className="text-neutral-500 hover:text-neutral-700 transition-colors"
      aria-label="Close"
     >
      <XMarkIcon className="h-6 w-6" />
     </button>
    </div>

    <div className="p-6">
     <div className="mb-8">
      <h3 className="text-lg font-semibold text-primary-900 mb-4">
       {t("menu.addNewCategory","Add New Category")}
      </h3>
      <div className="flex gap-3">
       <div className="flex-1">
        <Input
         value={newCategory}
         onChange={(e) => setNewCategory(e.target.value)}
         placeholder={t(
         "menu.categoryNamePlaceholder",
         "Enter category name"
         )}
         error={errors.newCategory}
         fullWidth
        />
       </div>
       <Button
        type="button"
        variant="primary"
        onClick={handleAddCategory}
        className="px-4"
       >
        <PlusIcon className="h-5 w-5" />
       </Button>
      </div>

      <div className="flex items-center mt-4">
       <input
        type="checkbox"
        id="newCategoryActive"
        checked={newCategoryActive}
        onChange={(e) => setNewCategoryActive(e.target.checked)}
        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded transition-colors"
       />
       <label
        htmlFor="newCategoryActive"
        className="ml-2 text-sm font-medium text-primary-700 cursor-pointer"
       >
        {t("menu.active","Active")}
       </label>
      </div>
     </div>

     <div className="mb-8">
      <h3 className="text-lg font-semibold text-primary-900 mb-4">
       {t("menu.existingCategories","Existing Categories")}
      </h3>
      {categories.length === 0 ? (
       <div className="text-center py-8">
        <div className="mb-4">
         <svg
          className="mx-auto h-12 w-12 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
         >
          <path
           strokeLinecap="round"
           strokeLinejoin="round"
           strokeWidth={1}
           d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
         </svg>
        </div>
        <p className="text-neutral-600 text-sm">
         {t(
         "menu.noCategories",
         "No categories found. Add a category to get started."
         )}
        </p>
       </div>
      ) : (
       <div className="space-y-3">
        {categories.map((category) => (
         <div
          key={category.id}
          className="bg-white rounded-xl p-4 border border-neutral-200"
         >
          {editingCategory && editingCategory.id === category.id ? (
           <div className="space-y-3">
            <div className="flex gap-3">
             <div className="flex-1">
              <Input
               value={editingCategory.name}
               onChange={(e) =>
                setEditingCategory({
                 ...editingCategory,
                 name: e.target.value,
                })
               }
               error={errors.editCategory}
               fullWidth
              />
             </div>
             <Button
              type="button"
              variant="primary"
              onClick={handleUpdateCategory}
              className="px-4"
             >
              {t("common.save","Save")}
             </Button>
             <Button
              type="button"
              variant="outline"
              onClick={() => setEditingCategory(null)}
              className="px-4"
             >
              {t("common.cancel","Cancel")}
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
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded transition-colors"
             />
             <label
              htmlFor={`isActive-${editingCategory.id}`}
              className="ml-2 text-sm font-medium text-primary-700 cursor-pointer"
             >
              {t("menu.active","Active")}
             </label>
            </div>
           </div>
          ) : (
           <div className="flex justify-between items-center">
            <div className="flex items-center">
             <span
              className={`text-primary-900 font-medium ${
               !category.isActive ?"opacity-50" : ""
              }`}
             >
              {category.name}
             </span>
             {category.isActive === false && (
              <span className="ml-3 text-xs bg-neutral-200 text-neutral-600 px-2 py-1 rounded-full">
               {t("menu.inactive","Inactive")}
              </span>
             )}
            </div>
            <div className="flex space-x-2">
             <button
              onClick={() => handleEditCategory(category)}
              className="text-primary-600 hover:text-primary-800 transition-colors p-1"
              title={t("common.edit","Edit")}
             >
              <PencilIcon className="h-5 w-5" />
             </button>
             <button
              onClick={() => handleDeleteCategory(category.id)}
              className="text-danger-600 hover:text-danger-800 transition-colors p-1"
              title={t("common.delete","Delete")}
             >
              <TrashIcon className="h-5 w-5" />
             </button>
            </div>
           </div>
          )}
         </div>
        ))}
       </div>
      )}
     </div>

     <div className="mt-8 flex justify-end space-x-4 pt-6 border-t border-neutral-300">
      <Button
       type="button"
       variant="outline"
       onClick={onClose}
       disabled={isLoading}
       className="px-6"
      >
       {t("common.cancel","Cancel")}
      </Button>
      <Button
       type="button"
       variant="primary"
       onClick={handleSaveCategories}
       disabled={isLoading}
       isLoading={isLoading}
       className="px-6"
      >
       {t("common.saveChanges","Save Changes")}
      </Button>
     </div>
    </div>
   </div>
  </div>
 );
};

export default CategoryManager;
