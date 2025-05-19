import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { tenantAPI } from "../../services/api";
import type { ApiError } from "../../types/api";

const TenantRegister = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState("");
  const [schema, setSchema] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("UTC");

  // Admin user states
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [adminFullName, setAdminFullName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  // UI states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate form
    if (!name || !schema || !subdomain || !displayName || !contactEmail) {
      setError("All tenant fields marked with * are required");
      setLoading(false);
      return;
    }

    // Validate admin user
    if (!adminUsername || !adminPassword || !adminConfirmPassword || !adminFullName || !adminEmail) {
      setError("All admin user fields are required");
      setLoading(false);
      return;
    }

    // Email validation
    if (!contactEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid contact email address");
      setLoading(false);
      return;
    }

    if (!adminEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid admin email address");
      setLoading(false);
      return;
    }

    // Password validation
    if (adminPassword !== adminConfirmPassword) {
      setError("Admin passwords do not match");
      setLoading(false);
      return;
    }

    // Schema and subdomain validation
    if (!schema.match(/^[a-z0-9_]+$/)) {
      setError("Schema can only contain lowercase letters, numbers, and underscores");
      setLoading(false);
      return;
    }

    if (!subdomain.match(/^[a-z0-9-]+$/)) {
      setError("Subdomain can only contain lowercase letters, numbers, and hyphens");
      setLoading(false);
      return;
    }

    try {
      // Create tenant
      const tenantData = {
        name,
        schema,
        subdomain,
        displayName,
        contactEmail,
        contactPhone,
        country,
        currency,
        timezone,
      };

      const adminData = {
        username: adminUsername,
        password: adminPassword,
        fullName: adminFullName,
        email: adminEmail,
        role: "admin",
      };

      await tenantAPI.registerTenant(tenantData, adminData);
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
        setError("Registration failed. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <Card variant="default" className="mb-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {t("auth.registerRestaurant")}
          </h1>
          <p className="text-gray-600">
            {t("auth.registerRestaurantSubtitle")}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 text-danger-500 mr-2" />
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center">
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {t("auth.registrationSuccess")}
            </div>
            <p className="mt-4">
              {t("auth.redirectingToLogin")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                {t("auth.restaurantInformation")}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={`${t("auth.restaurantName")} *`}
                  id="name"
                  type="text"
                  placeholder={t("auth.restaurantNamePlaceholder") || "Restaurant Name"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fullWidth
                  variant="default"
                  size="md"
                />

                <Input
                  label={`${t("auth.displayName")} *`}
                  id="displayName"
                  type="text"
                  placeholder={t("auth.displayNamePlaceholder") || "Display Name"}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  fullWidth
                  variant="default"
                  size="md"
                />

                <Input
                  label={`${t("auth.schema")} *`}
                  id="schema"
                  type="text"
                  placeholder={t("auth.schemaPlaceholder") || "restaurant_schema"}
                  value={schema}
                  onChange={(e) => setSchema(e.target.value)}
                  required
                  fullWidth
                  variant="default"
                  size="md"
                  helperText={t("auth.schemaHelp")}
                />

                <Input
                  label={`${t("auth.subdomain")} *`}
                  id="subdomain"
                  type="text"
                  placeholder={t("auth.subdomainPlaceholder") || "restaurant-name"}
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  required
                  fullWidth
                  variant="default"
                  size="md"
                  helperText={t("auth.subdomainHelp")}
                />

                <Input
                  label={`${t("auth.contactEmail")} *`}
                  id="contactEmail"
                  type="email"
                  placeholder={t("auth.contactEmailPlaceholder") || "contact@restaurant.com"}
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  fullWidth
                  variant="default"
                  size="md"
                />

                <Input
                  label={t("auth.contactPhone")}
                  id="contactPhone"
                  type="text"
                  placeholder={t("auth.contactPhonePlaceholder") || "+1 123 456 7890"}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  fullWidth
                  variant="default"
                  size="md"
                />

                <Input
                  label={t("auth.country")}
                  id="country"
                  type="text"
                  placeholder={t("auth.countryPlaceholder") || "US"}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  fullWidth
                  variant="default"
                  size="md"
                />

                <Input
                  label={t("auth.currency")}
                  id="currency"
                  type="text"
                  placeholder={t("auth.currencyPlaceholder") || "USD"}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  fullWidth
                  variant="default"
                  size="md"
                />
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                {t("auth.adminUserInformation")}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={`${t("auth.username")} *`}
                  id="adminUsername"
                  type="text"
                  placeholder={t("auth.usernamePlaceholder") || "admin"}
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  required
                  fullWidth
                  variant="default"
                  size="md"
                />

                <Input
                  label={`${t("auth.fullName")} *`}
                  id="adminFullName"
                  type="text"
                  placeholder={t("auth.fullNamePlaceholder") || "Admin User"}
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  required
                  fullWidth
                  variant="default"
                  size="md"
                />

                <Input
                  label={`${t("auth.email")} *`}
                  id="adminEmail"
                  type="email"
                  placeholder={t("auth.emailPlaceholder") || "admin@restaurant.com"}
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  fullWidth
                  variant="default"
                  size="md"
                />

                <div className="col-span-2">
                  <Input
                    label={`${t("auth.password")} *`}
                    id="adminPassword"
                    type="password"
                    placeholder={t("auth.passwordPlaceholder") || "••••••••"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    fullWidth
                    variant="default"
                    size="md"
                  />
                </div>

                <div className="col-span-2">
                  <Input
                    label={`${t("auth.confirmPassword")} *`}
                    id="adminConfirmPassword"
                    type="password"
                    placeholder={t("auth.confirmPasswordPlaceholder") || "••••••••"}
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    required
                    fullWidth
                    variant="default"
                    size="md"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className={`btn w-full ${
                  loading || success
                    ? "bg-blue-300 cursor-not-allowed"
                    : "btn-primary"
                }`}
                disabled={loading || success}
              >
                {loading ? t("auth.registering") : t("auth.registerRestaurant")}
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link
              to="/"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TenantRegister;
