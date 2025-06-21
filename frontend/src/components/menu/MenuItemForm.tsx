import React, { useState, useEffect, useCallback } from"react";
import { useTranslation } from"react-i18next";
import { XMarkIcon, PhotoIcon } from"@heroicons/react/24/outline";
import { Button, Input, Select, Textarea } from"../../components/ui";
import { type MenuItem, type Category } from"../../types/menu";
import { useToast } from"../../components/common/ToastProvider";

interface MenuItemFormProps {
 isOpen: boolean;
 onClose: () => void;
 onSave: (menuItem: MenuItem) => void;
 menuItem?: MenuItem | null;
 categories: Category[];
 isLoading: boolean;
}

const initialMenuItem: MenuItem = {
 id:"",
 name:"",
 description:"",
 price: 0,
 categoryId:"",
 isAvailable: true,
 imageUrl:"",
};

const MenuItemForm: React.FC<MenuItemFormProps> = ({
 isOpen,
 onClose,
 onSave,
 menuItem,
 categories,
 isLoading,
}) => {
 const { t } = useTranslation();
 const { error } = useToast();
 const [formData, setFormData] = useState<MenuItem>(initialMenuItem);
 const [imagePreview, setImagePreview] = useState<string | null>(null);
 const [imageFile, setImageFile] = useState<File | null>(null);
 const [errors, setErrors] = useState<Record<string, string>>({});
 const [dragActive, setDragActive] = useState(false);

 useEffect(() => {
  if (menuItem) {
   setFormData(menuItem);
   if (menuItem.imageUrl) {
    setImagePreview(menuItem.imageUrl);
   }
  } else {
   setFormData(initialMenuItem);
   setImagePreview(null);
  }
  setImageFile(null);
  setErrors({});
 }, [menuItem, isOpen]);

 const handleChange = (
  e: React.ChangeEvent<
   HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >
 ) => {
  const { name, value, type } = e.target;

  if (type ==="checkbox") {
   const checkbox = e.target as HTMLInputElement;
   setFormData((prev) => ({
    ...prev,
    [name]: checkbox.checked,
   }));
  } else if (type ==="number") {
   setFormData((prev) => ({
    ...prev,
    [name]: parseFloat(value) || 0,
   }));
  } else {
   setFormData((prev) => ({
    ...prev,
    [name]: value,
   }));
  }
 };

 const processImageFile = useCallback(
  (file: File) => {
   // Validate file type
   const validTypes = ["image/jpeg","image/png", "image/gif", "image/webp"];
   if (!validTypes.includes(file.type)) {
    error(
     t(
     "menu.invalidImageType",
     "Please upload a valid image file (JPEG, PNG, GIF, WEBP)"
     )
    );
    return;
   }

   // Validate file size (max 2MB)
   if (file.size > 2 * 1024 * 1024) {
    error(t("menu.imageTooLarge","Image size should be less than 2MB"));
    return;
   }

   setImageFile(file);

   // Create a preview
   const reader = new FileReader();
   reader.onloadend = () => {
    setImagePreview(reader.result as string);
   };
   reader.readAsDataURL(file);
  },
  [error, t]
 );

 const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  processImageFile(file);
 };

 const handleDroppedFiles = useCallback(
  (files: File[]) => {
   const imageFiles = files.filter((file) => file.type.startsWith("image/"));
   if (imageFiles.length > 0) {
    processImageFile(imageFiles[0]); // Take the first image file
   }
  },
  [processImageFile]
 );

 const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!formData.name.trim()) {
   newErrors.name = t("menu.nameRequired","Name is required");
  }

  if (formData.price <= 0) {
   newErrors.price = t("menu.pricePositive","Price must be greater than 0");
  }

  if (!formData.categoryId) {
   newErrors.categoryId = t("menu.categoryRequired","Category is required");
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
 };

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
   return;
  }

  // Create a copy of the form data to send to the parent component
  const menuItemToSave = { ...formData };

  // If there's a new image file, we'll need to handle it differently
  // In a real implementation, you would upload the image to a server
  // and get back a URL to store in the menuItem
  if (imageFile) {
   // For now, we'll just use the preview as a placeholder
   // In a real app, you would upload the image and get a URL
   menuItemToSave.imageFile = imageFile;
  }

  onSave(menuItemToSave);
 };

 if (!isOpen) return null;

 return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
   <div className="bg-neutral-100 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-soft">
    <div className="flex justify-between items-center p-6 border-b border-neutral-300">
     <h2 className="text-xl font-bold text-primary-900">
      {menuItem
       ? t("menu.editItem","Edit Menu Item")
       : t("menu.addItem","Add Menu Item")}
     </h2>
     <button
      onClick={onClose}
      className="text-neutral-500 hover:text-neutral-700 transition-colors"
      aria-label="Close"
     >
      <XMarkIcon className="h-6 w-6" />
     </button>
    </div>

    <form onSubmit={handleSubmit} className="p-6">
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
       <Input
        label={t("menu.name","Name")}
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder={t("menu.namePlaceholder","Enter item name")}
        error={errors.name}
        required
        fullWidth
       />

       <Input
        type="number"
        label={t("menu.price","Price")}
        name="price"
        value={formData.price}
        onChange={handleChange}
        placeholder={t("menu.pricePlaceholder","Enter price")}
        error={errors.price}
        required
        fullWidth
        min="0"
        step="0.01"
       />

       <Select
        label={t("menu.category","Category")}
        name="categoryId"
        value={formData.categoryId}
        onChange={handleChange}
        placeholder={t("menu.selectCategory","Select a category")}
        error={errors.categoryId}
        required
        fullWidth
        options={[
         {
          value:"",
          label: t("menu.selectCategory","Select a category"),
          disabled: true,
         },
         ...categories.map((category) => ({
          value: category.id,
          label: category.name,
         })),
        ]}
       />

       <div className="flex items-center space-x-3">
        <input
         type="checkbox"
         id="isAvailable"
         name="isAvailable"
         checked={formData.isAvailable}
         onChange={(e) =>
          setFormData((prev) => ({
           ...prev,
           isAvailable: e.target.checked,
          }))
         }
         className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded transition-colors"
        />
        <label
         htmlFor="isAvailable"
         className="text-sm font-medium text-primary-700 cursor-pointer"
        >
         {t("menu.available","Available")}
        </label>
       </div>
      </div>

      <div className="space-y-6">
       <Textarea
        label={t("menu.description","Description")}
        name="description"
        value={formData.description ||""}
        onChange={handleChange}
        rows={4}
        placeholder={t(
        "menu.descriptionPlaceholder",
        "Enter item description"
        )}
        fullWidth
       />

       <div>
        <label className="block text-sm font-medium text-primary-700 mb-2">
         {t("menu.image","Image")}
        </label>
        <div
         className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
          dragActive
           ?"border-primary-500 bg-primary-50/20"
           :"border-neutral-300 hover:border-primary-400"
         }`}
         onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
         }}
         onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
         }}
         onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
         }}
         onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);

          const files = Array.from(e.dataTransfer.files);
          handleDroppedFiles(files);
         }}
        >
         {imagePreview ? (
          <div className="p-4">
           <div className="relative inline-block">
            <img
             src={imagePreview}
             alt={formData.name}
             className="h-40 w-40 object-cover rounded-lg shadow-sm"
            />
            <button
             type="button"
             onClick={() => {
              setImagePreview(null);
              setImageFile(null);
             }}
             className="absolute -top-2 -right-2 bg-danger-500 hover:bg-danger-600 text-white rounded-full p-1 shadow-sm transition-colors"
            >
             <XMarkIcon className="h-4 w-4" />
            </button>
           </div>
           <div className="mt-3 text-center">
            <label
             htmlFor="image-upload"
             className="text-sm text-primary-600 hover:text-primary-500 cursor-pointer font-medium"
            >
             {t("menu.changeImage","Change image")}
            </label>
           </div>
          </div>
         ) : (
          <div className="p-8 text-center">
           <PhotoIcon className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
           <div className="space-y-2">
            <label
             htmlFor="image-upload"
             className="cursor-pointer"
            >
             <span className="text-primary-600 hover:text-primary-500 font-medium">
              {t("menu.uploadImage","Upload an image")}
             </span>
             <span className="text-neutral-600 ml-1">
              {t("menu.orDragDrop","or drag and drop")}
             </span>
            </label>
            <p className="text-xs text-neutral-500">
             {t("menu.imageFormats","PNG, JPG, GIF up to 2MB")}
            </p>
           </div>
          </div>
         )}
         <input
          id="image-upload"
          name="image-upload"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleImageChange}
         />
        </div>
       </div>
      </div>
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
       type="submit"
       variant="primary"
       disabled={isLoading}
       isLoading={isLoading}
       className="px-6"
      >
       {menuItem
        ? t("common.update","Update")
        : t("common.create","Create")}
      </Button>
     </div>
    </form>
   </div>
  </div>
 );
};

export default MenuItemForm;
