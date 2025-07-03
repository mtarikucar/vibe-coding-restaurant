import { Outlet, useLocation } from"react-router-dom";
import { useTranslation } from"react-i18next";
import {
 BuildingStorefrontIcon,
 SparklesIcon,
 ClockIcon,
 UserGroupIcon,
 ChartBarIcon,
 CreditCardIcon
} from"@heroicons/react/24/outline";

const AuthLayout = () => {
 const { t } = useTranslation();
 const location = useLocation();
 const isTenantRegisterPage = location.pathname ==="/register-restaurant";

 const features = [
  {
   icon: BuildingStorefrontIcon,
   title: t("auth.features.management"),
   description: t("auth.features.managementDesc"),
  },
  {
   icon: ClockIcon,
   title: t("auth.features.realtime"),
   description: t("auth.features.realtimeDesc"),
  },
  {
   icon: UserGroupIcon,
   title: t("auth.features.staff"),
   description: t("auth.features.staffDesc"),
  },
  {
   icon: ChartBarIcon,
   title: t("auth.features.analytics"),
   description: t("auth.features.analyticsDesc"),
  },
  {
   icon: CreditCardIcon,
   title: t("auth.features.payments"),
   description: t("auth.features.paymentsDesc"),
  },
  {
   icon: SparklesIcon,
   title: t("auth.features.modern"),
   description: t("auth.features.modernDesc"),
  },
 ];

 return (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
   {/* Background Pattern */}
   <div
    className="absolute inset-0 opacity-40"
    style={{
     backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
    }}
   ></div>

   <div className="relative flex min-h-screen">
    {/* Left Side - Features */}
    <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 p-12 text-white">
     <div className="flex flex-col justify-center max-w-lg mx-auto">
      <div className="mb-8">
       <div className="flex items-center mb-4">
        <BuildingStorefrontIcon className="h-12 w-12 text-white mr-3" />
        <h1 className="text-4xl font-bold">
         {t("common.appName")}
        </h1>
       </div>
       <p className="text-xl text-orange-100 leading-relaxed">
        {t("auth.heroDescription")}
       </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
       {features.map((feature, index) => (
        <div key={index} className="flex items-start space-x-4">
         <div className="flex-shrink-0">
          <feature.icon className="h-6 w-6 text-orange-200" />
         </div>
         <div>
          <h3 className="font-semibold text-white mb-1">
           {feature.title}
          </h3>
          <p className="text-orange-100 text-sm">
           {feature.description}
          </p>
         </div>
        </div>
       ))}
      </div>

      <div className="mt-8 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
       <p className="text-orange-100 text-sm text-center">
        {t("auth.trustedBy")} <span className="font-semibold text-white">500+</span> {t("auth.restaurants")}
       </p>
      </div>
     </div>
    </div>

    {/* Right Side - Auth Form */}
    <div className="flex-1 flex items-center justify-center p-8">
     <div className="w-full max-w-md">
      {/* Mobile Header */}
      <div className="lg:hidden text-center mb-8">
       <div className="flex items-center justify-center mb-4">
        <BuildingStorefrontIcon className="h-10 w-10 text-orange-600 mr-2" />
        <h1 className="text-3xl font-bold text-gray-800">
         {t("common.appName")}
        </h1>
       </div>
       <p className="text-gray-600">
        {t("auth.heroDescription")}
       </p>
      </div>

      {/* Auth Card */}
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
       <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
         {isTenantRegisterPage
          ? t("auth.registerRestaurant")
          : t("auth.welcomeBack")}
        </h2>
        <p className="text-gray-600">
         {isTenantRegisterPage
          ? t("auth.registerRestaurantSubtitle")
          : t("auth.accessAccount")}
        </p>
       </div>
       <Outlet />
      </div>

      {/* Footer */}
      <div className="text-center mt-6 text-sm text-gray-500">
       <p>
        {t("auth.byUsing")} {t("common.appName")}, {t("auth.agreeToTerms")}
       </p>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
};

export default AuthLayout;
