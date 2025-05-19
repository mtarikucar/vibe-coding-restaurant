import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Button, Card } from '../../components/ui';
import { type  MenuItem, type Category } from '../../types/menu';
import { useToast } from '../../components/common/ToastProvider';

interface MenuItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (menuItem: MenuItem) => void;
  menuItem?: MenuItem | null;
  categories: Category[];
  isLoading: boolean;
}

const initialMenuItem: MenuItem = {
  id: '',
  name: '',
  description: '',
  price: 0,
  categoryId: '',
  isAvailable: true,
  imageUrl: '',
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        [name]: checkbox.checked,
      }));
    } else if (type === 'number') {
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      error(t('menu.invalidImageType', 'Please upload a valid image file (JPEG, PNG, GIF, WEBP)'));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      error(t('menu.imageTooLarge', 'Image size should be less than 2MB'));
      return;
    }

    setImageFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('menu.nameRequired', 'Name is required');
    }
    
    if (formData.price <= 0) {
      newErrors.price = t('menu.pricePositive', 'Price must be greater than 0');
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = t('menu.categoryRequired', 'Category is required');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">
            {menuItem ? t('menu.editItem', 'Edit Menu Item') : t('menu.addItem', 'Add Menu Item')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4 md:col-span-1">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('menu.name', 'Name')} *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.name ? 'border-danger-500' : 'border-gray-300'
                  } rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                  placeholder={t('menu.namePlaceholder', 'Enter item name')}
                />
                {errors.name && <p className="text-danger-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('menu.price', 'Price')} *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`w-full border ${
                    errors.price ? 'border-danger-500' : 'border-gray-300'
                  } rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                  placeholder={t('menu.pricePlaceholder', 'Enter price')}
                />
                {errors.price && <p className="text-danger-500 text-xs mt-1">{errors.price}</p>}
              </div>

              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('menu.category', 'Category')} *
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.categoryId ? 'border-danger-500' : 'border-gray-300'
                  } rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                >
                  <option value="">{t('menu.selectCategory', 'Select a category')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-danger-500 text-xs mt-1">{errors.categoryId}</p>
                )}
              </div>

              <div>
                <label htmlFor="isAvailable" className="flex items-center text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={(e) => 
                      setFormData((prev) => ({ ...prev, isAvailable: e.target.checked }))
                    }
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                  />
                  {t('menu.available', 'Available')}
                </label>
              </div>
            </div>

            <div className="space-y-4 md:col-span-1">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('menu.description', 'Description')}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder={t('menu.descriptionPlaceholder', 'Enter item description')}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('menu.image', 'Image')}
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  {imagePreview ? (
                    <div className="space-y-2 text-center">
                      <img
                        src={imagePreview}
                        alt={formData.name}
                        className="mx-auto h-32 w-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                        }}
                        className="text-sm text-danger-600 hover:text-danger-900"
                      >
                        {t('common.remove', 'Remove')}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 text-center">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="image-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>{t('menu.uploadImage', 'Upload an image')}</span>
                          <input
                            id="image-upload"
                            name="image-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">
                        {t('menu.imageFormats', 'PNG, JPG, GIF up to 2MB')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              isLoading={isLoading}
            >
              {menuItem
                ? t('common.update', 'Update')
                : t('common.create', 'Create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuItemForm;
