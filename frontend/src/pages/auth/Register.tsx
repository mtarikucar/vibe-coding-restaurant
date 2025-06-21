import { useState, useEffect } from"react";
import { Link, useNavigate } from"react-router-dom";
import { useTranslation } from"react-i18next";
import { authAPI } from"../../services/api";
import type { UserRole } from"../../store/authStore";
import {
 UserIcon,
 LockClosedIcon,
 EnvelopeIcon,
 IdentificationIcon,
 BuildingStorefrontIcon,
 ExclamationCircleIcon,
 CheckCircleIcon
} from"@heroicons/react/24/outline";
import { Button, Input } from"../../components/ui";

// Define error type for API errors
interface ApiError {
 response?: {
  data?: {
   message?: string;
  };
 };
 message: string;
}

// Define tenant type
interface Tenant {
 id: string;
 name: string;
 displayName: string;
 subdomain: string;
 logo?: string;
}

const Register = () => {
 const { t } = useTranslation();
 const navigate = useNavigate();

 // Form states
 const [username, setUsername] = useState("");
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [fullName, setFullName] = useState("");
 const [email, setEmail] = useState("");
 const [role, setRole] = useState<UserRole>("waiter");
 const [selectedTenant, setSelectedTenant] = useState("");

 // UI states
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);
 const [success, setSuccess] = useState(false);
 const [tenantsLoading, setTenantsLoading] = useState(true);

 // Data states
 const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);

 // Load available tenants on component mount
 useEffect(() => {
  const loadTenants = async () => {
   try {
    setTenantsLoading(true);
    const tenants = await authAPI.getAvailableTenants();
    setAvailableTenants(tenants || []);
   } catch (error) {
    console.error("Failed to load tenants:", error);
    setError("Failed to load available restaurants. Please refresh the page.");
   } finally {
    setTenantsLoading(false);
   }
  };

  loadTenants();
 }, []);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  // Validate form
  if (!username || !password || !confirmPassword || !fullName || !email) {
   setError(t("auth.allFieldsRequired"));
   setLoading(false);
   return;
  }

  if (!selectedTenant) {
   setError(t("auth.selectRestaurant"));
   setLoading(false);
   return;
  }

  // Email validation
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
   setError(t("auth.invalidEmail"));
   setLoading(false);
   return;
  }

  if (password !== confirmPassword) {
   setError(t("auth.passwordsDoNotMatch"));
   setLoading(false);
   return;
  }

  if (password.length < 6) {
   setError(t("auth.passwordTooShort"));
   setLoading(false);
   return;
  }

  try {
   // Validate tenant before registration
   await authAPI.validateTenant(selectedTenant);

   // Register user with tenant
   await authAPI.register(
    username,
    password,
    fullName,
    role,
    email,
    undefined, // preferredLanguage
    selectedTenant
   );

   setSuccess(true);

   // Redirect to login after 2 seconds
   setTimeout(() => {
    navigate("/", { replace: true });
   }, 2000);
  } catch (error: unknown) {
   const err = error as ApiError;
   if (err.response?.data?.message) {
    setError(err.response.data.message);
   } else {
    setError(t("auth.registrationFailed"));
   }
   console.error(err);
  } finally {
   setLoading(false);
  }
 };

 if (tenantsLoading) {
  return (
   <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
    <span className="ml-2 text-gray-600">{t("auth.loadingRestaurants")}</span>
   </div>
  );
 }

 return (
  <div className="animate-fadeIn">
   {error && (
    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
     <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
     {error}
    </div>
   )}

   {success && (
    <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
     <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
     {t("auth.registrationSuccess")}
    </div>
   )}

   <form onSubmit={handleSubmit} className="space-y-6">
    {/* Restaurant Selection */}
    <div>
     <label htmlFor="restaurant" className="block text-sm font-medium text-gray-700 mb-2">
      {t("auth.selectRestaurant")} <span className="text-red-500">*</span>
     </label>
     {availableTenants.length === 0 ? (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
       <p className="text-yellow-800 text-sm">
        {t("auth.noRestaurantsAvailable")}
       </p>
       <Link
        to="/register-restaurant"
        className="text-yellow-600 hover:text-yellow-700 font-medium text-sm"
       >
        {t("auth.registerRestaurantFirst")}
       </Link>
      </div>
     ) : (
      <select
       id="restaurant"
       value={selectedTenant}
       onChange={(e) => setSelectedTenant(e.target.value)}
       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
       disabled={loading || success}
       required
      >
       <option value="">{t("auth.chooseRestaurant")}</option>
       {availableTenants.map((tenant) => (
        <option key={tenant.id} value={tenant.id}>
         {tenant.displayName || tenant.name}
        </option>
       ))}
      </select>
     )}
    </div>

    {/* Personal Information */}
    <div className="space-y-4">
     <Input
      label={`${t("auth.fullName")} *`}
      id="fullName"
      type="text"
      placeholder={t("auth.fullNamePlaceholder") ||"Enter your full name"}
      value={fullName}
      onChange={(e) => setFullName(e.target.value)}
      required
      fullWidth
      leftIcon={<IdentificationIcon className="h-5 w-5 text-gray-400" />}
      variant="default"
      size="md"
      disabled={loading || success}
      className="transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
     />

     <Input
      label={`${t("auth.username")} *`}
      id="username"
      type="text"
      placeholder={t("auth.usernamePlaceholder") ||"Enter your username"}
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      required
      fullWidth
      leftIcon={<UserIcon className="h-5 w-5 text-gray-400" />}
      variant="default"
      size="md"
      disabled={loading || success}
      className="transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
     />

     <Input
      label={`${t("auth.email")} *`}
      id="email"
      type="email"
      placeholder={t("auth.emailPlaceholder") ||"Enter your email address"}
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
      fullWidth
      leftIcon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
      variant="default"
      size="md"
      disabled={loading || success}
      className="transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
     />

     <div>
      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
       {t("auth.role")} <span className="text-red-500">*</span>
      </label>
      <select
       id="role"
       value={role}
       onChange={(e) => setRole(e.target.value as UserRole)}
       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
       disabled={loading || success}
       required
      >
       <option value="waiter">{t("auth.roles.waiter")}</option>
       <option value="kitchen">{t("auth.roles.kitchen")}</option>
       <option value="cashier">{t("auth.roles.cashier")}</option>
       <option value="manager">{t("auth.roles.manager")}</option>
      </select>
     </div>

     <Input
      label={`${t("auth.password")} *`}
      id="password"
      type="password"
      placeholder={t("auth.passwordPlaceholder") ||"Enter your password"}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
      fullWidth
      leftIcon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
      variant="default"
      size="md"
      disabled={loading || success}
      className="transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      helperText={t("auth.passwordMinLength")}
     />

     <Input
      label={`${t("auth.confirmPassword")} *`}
      id="confirmPassword"
      type="password"
      placeholder={t("auth.confirmPasswordPlaceholder") ||"Confirm your password"}
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      required
      fullWidth
      leftIcon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
      variant="default"
      size="md"
      disabled={loading || success}
      className="transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
     />
    </div>

    <Button
     type="submit"
     variant="primary"
     fullWidth
     isLoading={loading}
     disabled={loading || success || availableTenants.length === 0}
     size="lg"
     className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
    >
     {loading ? (
      <div className="flex items-center">
       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
       {t("auth.registering")}
      </div>
     ) : (
      t("auth.createAccount")
     )}
    </Button>
   </form>

   <div className="mt-8 text-center space-y-3">
    <p className="text-sm text-gray-600">
     {t("auth.alreadyHaveAccount")}{""}
     <Link
      to="/"
      className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
     >
      {t("auth.signIn")}
     </Link>
    </p>
    <div className="relative">
     <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200"></div>
     </div>
     <div className="relative flex justify-center text-xs">
      <span className="px-2 bg-white text-gray-400">
       {t("auth.forRestaurants")}
      </span>
     </div>
    </div>
    <p className="text-sm text-gray-600">
     {t("auth.areYouRestaurant")}{""}
     <Link
      to="/register-restaurant"
      className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
     >
      {t("auth.registerRestaurantNow")}
     </Link>
    </p>
   </div>
  </div>
 );
};

export default Register;
