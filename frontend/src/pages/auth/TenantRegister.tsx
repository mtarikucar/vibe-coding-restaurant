import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ExclamationCircleIcon,
  BuildingStorefrontIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  LockClosedIcon,
  IdentificationIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Button, Input, Select } from "../../components/ui";
import { tenantAPI } from "../../services/api";
import type { ApiError } from "../../types/api";

// Country options
const countryOptions = [
  { value: "TR", label: "Turkey" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "IT", label: "Italy" },
  { value: "ES", label: "Spain" },
  { value: "NL", label: "Netherlands" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
];



const TenantRegister = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // Keep 3 steps but step 2 will be auto-filled

  // Form states
  const [name, setName] = useState("");
  const [schema, setSchema] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [country, setCountry] = useState("TR");

  // Auto-generation states
  const [isSubdomainTaken, setIsSubdomainTaken] = useState(false);
  const [showSubdomainInput, setShowSubdomainInput] = useState(false);

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

  // Helper function to generate UUID
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Helper function to clean restaurant name for schema/subdomain
  const cleanRestaurantName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscore
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  };

  // Auto-generate schema and subdomain when restaurant name changes
  const handleNameChange = async (newName: string) => {
    setName(newName);

    if (newName.trim()) {
      const cleanName = cleanRestaurantName(newName);
      const uuid = generateUUID().split('-')[0]; // Use first part of UUID

      // Generate schema with UUID
      const generatedSchema = `${cleanName}_${uuid}`;
      setSchema(generatedSchema);

      // Generate subdomain (without UUID initially)
      const generatedSubdomain = cleanName.replace(/_/g, '-'); // Use hyphens for subdomain

      // Check if subdomain is available (mock check for now)
      // In real implementation, you would call an API to check availability
      const isAvailable = await checkSubdomainAvailability(generatedSubdomain);

      if (isAvailable) {
        setSubdomain(generatedSubdomain);
        setShowSubdomainInput(false);
        setIsSubdomainTaken(false);
      } else {
        setIsSubdomainTaken(true);
        setShowSubdomainInput(true);
        setSubdomain(''); // Clear subdomain so user can enter manually
      }
    } else {
      setSchema('');
      setSubdomain('');
      setShowSubdomainInput(false);
      setIsSubdomainTaken(false);
    }
  };

  // Mock function to check subdomain availability
  const checkSubdomainAvailability = async (subdomain: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock some taken subdomains for demonstration
    const takenSubdomains = ['test', 'demo', 'admin', 'api', 'www', 'app'];
    return !takenSubdomains.includes(subdomain);
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    setError("");

    switch (step) {
      case 1:
        if (!name || !displayName || !contactEmail) {
          setError("Please fill in all required restaurant information fields");
          return false;
        }
        if (!contactEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          setError("Please enter a valid email address");
          return false;
        }
        return true;

      case 2:
        // Technical configuration is auto-generated, so always valid if we have schema and subdomain
        if (!schema || !subdomain) {
          setError("Technical configuration is being generated. Please wait...");
          return false;
        }
        if (showSubdomainInput && !subdomain) {
          setError("Please enter a subdomain for your restaurant");
          return false;
        }
        return true;

      case 3:
        if (!adminUsername || !adminPassword || !adminConfirmPassword || !adminFullName || !adminEmail) {
          setError("Please fill in all admin user fields");
          return false;
        }
        if (!adminEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          setError("Please enter a valid admin email address");
          return false;
        }
        if (adminPassword !== adminConfirmPassword) {
          setError("Passwords do not match");
          return false;
        }
        if (adminPassword.length < 6) {
          setError("Password must be at least 6 characters long");
          return false;
        }
        return true;

      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If not on final step, go to next step
    if (currentStep < totalSteps) {
      nextStep();
      return;
    }

    // Final validation before submission
    if (!validateStep(3)) {
      return;
    }

    setLoading(true);

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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BuildingStorefrontIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Information</h2>
              <p className="text-gray-600">Tell us about your restaurant</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Restaurant Name *"
                id="name"
                type="text"
                placeholder="My Restaurant"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                fullWidth
                leftIcon={<BuildingStorefrontIcon className="h-5 w-5 text-gray-400" />}
                variant="default"
                size="md"
              />

              <Input
                label="Display Name *"
                id="displayName"
                type="text"
                placeholder="My Restaurant Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                fullWidth
                leftIcon={<BuildingStorefrontIcon className="h-5 w-5 text-gray-400" />}
                variant="default"
                size="md"
              />

              <Input
                label="Contact Email *"
                id="contactEmail"
                type="email"
                placeholder="contact@restaurant.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
                fullWidth
                leftIcon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
                variant="default"
                size="md"
              />

              <Input
                label="Contact Phone"
                id="contactPhone"
                type="tel"
                placeholder="+90 555 123 4567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                fullWidth
                leftIcon={<PhoneIcon className="h-5 w-5 text-gray-400" />}
                variant="default"
                size="md"
              />

              <div className="md:col-span-2">
                <Select
                  label="Country"
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  options={countryOptions}
                  fullWidth
                  variant="default"
                  size="md"
                  placeholder="Select Country"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <GlobeAltIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Web Address</h2>
              <p className="text-gray-600">Configure your restaurant's online presence</p>
            </div>

            <div className="space-y-6">
              {/* Subdomain Section */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Restaurant Subdomain
                </label>

                {!showSubdomainInput ? (
                  <div className="bg-white rounded-md p-3 border border-gray-300">
                    <div className="flex items-center justify-between">
                      <code className="text-sm text-gray-800 font-mono">
                        {subdomain || 'Will be generated from restaurant name'}.restaurant-system.com
                      </code>
                      {subdomain && (
                        <span className="text-green-600 text-sm font-medium">✓ Available</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-red-50 rounded-md p-3 border border-red-200">
                      <p className="text-sm text-red-700">
                        The subdomain "{cleanRestaurantName(name).replace(/_/g, '-')}" is already taken. Please choose a different one:
                      </p>
                    </div>
                    <Input
                      id="subdomain"
                      type="text"
                      placeholder="my-restaurant-name"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value)}
                      required
                      fullWidth
                      variant="default"
                      size="md"
                      helperText="Your restaurant's unique subdomain (lowercase, numbers, hyphens only)"
                    />
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  This will be your restaurant's web address: https://[subdomain].restaurant-system.com
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Administrator Account</h2>
              <p className="text-gray-600">Create your restaurant administrator account</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Username *"
                id="adminUsername"
                type="text"
                placeholder="admin"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
                fullWidth
                leftIcon={<UserIcon className="h-5 w-5 text-gray-400" />}
                variant="default"
                size="md"
              />

              <Input
                label="Full Name *"
                id="adminFullName"
                type="text"
                placeholder="Admin User"
                value={adminFullName}
                onChange={(e) => setAdminFullName(e.target.value)}
                required
                fullWidth
                leftIcon={<IdentificationIcon className="h-5 w-5 text-gray-400" />}
                variant="default"
                size="md"
              />

              <Input
                label="Email *"
                id="adminEmail"
                type="email"
                placeholder="admin@restaurant.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                fullWidth
                leftIcon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
                variant="default"
                size="md"
              />

              <div></div>

              <Input
                label="Password *"
                id="adminPassword"
                type="password"
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                fullWidth
                leftIcon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                variant="default"
                size="md"
              />

              <Input
                label="Confirm Password *"
                id="adminConfirmPassword"
                type="password"
                placeholder="••••••••"
                value={adminConfirmPassword}
                onChange={(e) => setAdminConfirmPassword(e.target.value)}
                required
                fullWidth
                leftIcon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                variant="default"
                size="md"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-3 rounded-full">
              <BuildingStorefrontIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Restaurant
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Join thousands of restaurants using our platform
          </p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                  ${currentStep >= step
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                  }
                `}>
                  {currentStep > step ? (
                    <CheckCircleIcon className="h-6 w-6" />
                  ) : (
                    <span className="font-semibold">{step}</span>
                  )}
                </div>
                {step < 3 && (
                  <div className={`
                    w-full h-1 mx-4 transition-all duration-300
                    ${currentStep > step ? 'bg-orange-500' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={currentStep >= 1 ? 'text-orange-600 font-medium' : 'text-gray-400'}>
              Restaurant Info
            </span>
            <span className={currentStep >= 2 ? 'text-orange-600 font-medium' : 'text-gray-400'}>
              Web Address
            </span>
            <span className={currentStep >= 3 ? 'text-orange-600 font-medium' : 'text-gray-400'}>
              Administrator
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success ? (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-8 rounded-xl">
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Registration Successful!</h3>
              <p className="text-green-600 mb-4">Redirecting to login...</p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
              {renderStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`${currentStep === 1 ? 'invisible' : ''}`}
                >
                  <ArrowRightIcon className="h-4 w-4 mr-2 rotate-180" />
                  Previous
                </Button>

                <div className="text-sm text-gray-500">
                  Step {currentStep} of {totalSteps}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  disabled={loading}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                >
                  {currentStep === totalSteps ? (
                    loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Create Restaurant
                      </>
                    )
                  ) : (
                    <>
                      Next
                      <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Login Link */}
        <div className="max-w-2xl mx-auto mt-8 text-center">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/"
                className="font-semibold text-orange-600 hover:text-orange-700 transition-colors underline decoration-2 underline-offset-2"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantRegister;