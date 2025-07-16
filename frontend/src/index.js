import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/styles/bootstrap.custom.css';
import './assets/styles/index.css';
import './assets/styles/auth.css';
import './assets/styles/animations.css'; // New animations stylesheet
import './assets/styles/toast.css'; // Custom toast styling
// import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import LandingLayout from './components/LandingLayout';
import AuthWrapper from './components/AuthWrapper';
import PublicRoute from './components/PublicRoute';
import RouteError from './components/RouteError';
import reportWebVitals from './reportWebVitals';
import serviceWorkerManager from './utils/serviceWorkerManager';
import { TenantProvider } from './contexts/TenantContext';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Outlet,
} from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import HomeScreen from './screens/HomeScreen';
import LandingScreen from './screens/LandingScreen';
import ProductScreen from './screens/ProductScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import MyOrdersScreen from './screens/MyOrdersScreen';
import MyCollectionsScreen from './screens/MyCollectionsScreen';
import WorkoutDashboardScreen from './screens/WorkoutDashboardScreen';
import WorkoutDetailScreen from './screens/WorkoutDetailScreen';
import DietDashboardScreen from './screens/DietDashboardScreen';
import AddDietEntryScreen from './screens/AddDietEntryScreen';
import SleepTrackerScreen from './screens/SleepTrackerScreen';
import WeightTrackerScreen from './screens/WeightTrackerScreen';
import OrderListScreen from './screens/admin/OrderListScreen';
import ProductListScreen from './screens/admin/ProductListScreen';
import ProductEditScreen from './screens/admin/ProductEditScreen';
import UserListScreen from './screens/admin/UserListScreen';
import UserEditScreen from './screens/admin/UserEditScreen';
import UserCreateScreen from './screens/admin/UserCreateScreen';
import CollectionScreen from './screens/CollectionScreen';
import CollectionListScreen from './screens/admin/CollectionListScreen';
import CollectionEditScreen from './screens/admin/CollectionEditScreen';
import OneTimeCodesScreen from './screens/admin/OneTimeCodesScreen';
import UserWorkoutScreen from './screens/admin/UserWorkoutScreen';
import WorkoutTrackingScreen from './screens/admin/WorkoutTrackingScreen';
import AdminWorkoutDetailScreen from './screens/admin/WorkoutDetailScreen';
import AdminCarouselScreen from './screens/admin/AdminCarouselScreen';
import SystemSettingsScreen from './screens/admin/SystemSettingsScreen';
import AdminUserWorkoutDashboard from './screens/admin/AdminUserWorkoutDashboard';
import AdminUserDietDashboard from './screens/admin/AdminUserDietDashboard';
import AdminUserSleepDashboard from './screens/admin/AdminUserSleepDashboard';
import TimeFrameManagementScreen from './screens/admin/TimeFrameManagementScreen';
import AdminQuizSettingsScreen from './screens/admin/AdminQuizSettingsScreen';
import AdminQuizListScreen from './screens/admin/AdminQuizListScreen';
import AdminQuizEditScreen from './screens/admin/AdminQuizEditScreen';
import QuizScreen from './screens/QuizScreen';
import AiAnalysisScreen from './screens/AiAnalysisScreen';
import AdminAiAnalysisScreen from './screens/AdminAiAnalysisScreen';
import store from './store';
import { Provider } from 'react-redux';
import AdminUserWeightDashboard from './screens/admin/AdminUserWeightDashboard';
import SuperAdminRoute from './components/SuperAdminRoute';
import SuperAdminDashboard from './screens/super-admin/SuperAdminDashboard';
import TenantListScreen from './screens/super-admin/TenantListScreen';
import CreateTenantScreen from './screens/super-admin/CreateTenantScreen';
import TenantViewScreen from './screens/super-admin/TenantViewScreen';
import TenantEditScreen from './screens/super-admin/TenantEditScreen';
import TenantUsersScreen from './screens/super-admin/TenantUsersScreen';
import TenantStatisticsScreen from './screens/super-admin/TenantStatisticsScreen';

// Log environment variables - helps with debugging environments
console.log('Environment:', process.env.NODE_ENV);
console.log('Show Hero Section:', process.env.REACT_APP_SHOW_HERO);

// Load theme from localStorage
const savedTheme = localStorage.getItem('theme') || 'dark'; // Changed default from 'light' to 'dark'
document.documentElement.setAttribute('data-theme', savedTheme);

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {' '}
      {/* Landing page without header and footer - only for non-authenticated users */}
      <Route path='/' element={<LandingLayout />} errorElement={<RouteError />}>
        <Route element={<PublicRoute />}>
          <Route index={true} element={<LandingScreen />} />
          <Route path='/login' element={<LoginScreen />} />
          <Route path='/register' element={<RegisterScreen />} />
        </Route>
      </Route>
      {/* Main app with header and footer - requires authentication */}
      <Route element={<App />} errorElement={<RouteError />}>
        <Route element={<AuthWrapper />}>
          <Route path='/home' element={<HomeScreen />} />
          <Route path='/search/:keyword' element={<HomeScreen />} />
          <Route path='/page/:pageNumber' element={<HomeScreen />} />
          <Route
            path='/search/:keyword/page/:pageNumber'
            element={<HomeScreen />}
          />
          <Route
            path='/product/:id'
            element={<ProductScreen />}
            errorElement={<RouteError />}
          />
          <Route path='/collections/:id' element={<CollectionScreen />} />

          {/* Already protected routes for registered users */}
          <Route path='' element={<PrivateRoute />}>
            <Route path='/profile' element={<ProfileScreen />} />
            <Route path='/my-orders' element={<MyOrdersScreen />} />
            <Route path='/my-collections' element={<MyCollectionsScreen />} />
            <Route
              path='/workout-dashboard'
              element={<WorkoutDashboardScreen />}
            />
            <Route path='/workout/:id' element={<WorkoutDetailScreen />} />
            <Route path='/diet-dashboard' element={<DietDashboardScreen />} />
            <Route path='/add-diet-entry' element={<AddDietEntryScreen />} />
            <Route path='/sleep-tracker' element={<SleepTrackerScreen />} />
            <Route path='/weight-tracker' element={<WeightTrackerScreen />} />
            <Route path='/ai-analysis' element={<AiAnalysisScreen />} />
            <Route path='/quiz' element={<QuizScreen />} />
          </Route>

          {/* Admin users */}
          <Route path='' element={<AdminRoute />}>
            <Route path='/admin/orderlist' element={<OrderListScreen />} />
            <Route path='/admin/productlist' element={<ProductListScreen />} />
            <Route
              path='/admin/productlist/:pageNumber'
              element={<ProductListScreen />}
            />
            <Route path='/admin/userlist' element={<UserListScreen />} />
            <Route
              path='/admin/userlist/:pageNumber'
              element={<UserListScreen />}
            />
            <Route
              path='/admin/product/:id/edit'
              element={<ProductEditScreen />}
            />
            <Route path='/admin/user/:id/edit' element={<UserEditScreen />} />
            <Route path='/admin/user/create' element={<UserCreateScreen />} />
            <Route
              path='/admin/collectionlist'
              element={<CollectionListScreen />}
            />
            <Route
              path='/admin/collection/:id/edit'
              element={<CollectionEditScreen />}
            />
            <Route
              path='/admin/access-codes'
              element={<OneTimeCodesScreen />}
            />{' '}
            <Route
              path='/admin/access-codes/:collectionId'
              element={<OneTimeCodesScreen />}
            />
            <Route
              path='/admin/collectionlist/:pageNumber'
              element={<CollectionListScreen />}
            />
            <Route
              path='/admin/user/:id/workouts'
              element={<UserWorkoutScreen />}
            />
            <Route path='/admin/workouts' element={<WorkoutTrackingScreen />} />
            <Route
              path='/admin/workout/:id'
              element={<AdminWorkoutDetailScreen />}
            />
            <Route
              path='/admin/workouts/page/:pageNumber'
              element={<WorkoutTrackingScreen />}
            />
            <Route
              path='/admin/system-settings'
              element={<SystemSettingsScreen />}
            />
            <Route
              path='/admin/carousel'
              element={
                <PrivateRoute>
                  <AdminRoute>
                    <AdminCarouselScreen />
                  </AdminRoute>
                </PrivateRoute>
              }
            />
            <Route
              path='/admin/user-workout-dashboard'
              element={<AdminUserWorkoutDashboard />}
            />
            <Route
              path='/admin/user-workout-dashboard/:id'
              element={<AdminUserWorkoutDashboard />}
            />
            <Route
              path='/admin/user-diet-dashboard'
              element={<AdminUserDietDashboard />}
            />
            <Route
              path='/admin/user-diet-dashboard/:id'
              element={<AdminUserDietDashboard />}
            />
            <Route
              path='/admin/user-sleep-dashboard/:id'
              element={<AdminUserSleepDashboard />}
            />
            <Route
              path='/admin/user-weight-dashboard/:id'
              element={<AdminUserWeightDashboard />}
            />
            <Route
              path='/admin/timeframe-management'
              element={<TimeFrameManagementScreen />}
            />
            <Route
              path='/admin/quiz-settings'
              element={<AdminQuizSettingsScreen />}
            />
            <Route path='/admin/quizlist' element={<AdminQuizListScreen />} />
            <Route
              path='/admin/quiz/:id/edit'
              element={<AdminQuizEditScreen />}
            />
            <Route
              path='/admin/ai-analysis'
              element={<AdminAiAnalysisScreen />}
            />
          </Route>

          {/* Super Admin Routes */}
          <Route path='' element={<SuperAdminRoute />}>
            <Route path='/super-admin' element={<SuperAdminDashboard />} />
            <Route path='/super-admin/tenants' element={<TenantListScreen />} />
            <Route path='/super-admin/tenants/create' element={<CreateTenantScreen />} />
            <Route path='/super-admin/tenants/:id' element={<TenantViewScreen />} />
            <Route path='/super-admin/tenants/:id/edit' element={<TenantEditScreen />} />
            <Route path='/super-admin/tenants/:id/users' element={<TenantUsersScreen />} />
            <Route path='/super-admin/tenants/:id/statistics' element={<TenantStatisticsScreen />} />
          </Route>
        </Route>
      </Route>
    </>
  ),
  {
    // Disable browser's default scroll restoration
    scrollRestoration: 'manual',
  }
);

// Create a wrapper component since TenantProvider needs router context
const AppWithTenant = () => {
  return (
    <TenantProvider>
      <Outlet />
    </TenantProvider>
  );
};

// Update router to include tenant wrapper
const routerWithTenant = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AppWithTenant />}>
      {/* Landing page without header and footer - only for non-authenticated users */}
      <Route path='/' element={<LandingLayout />} errorElement={<RouteError />}>
        <Route element={<PublicRoute />}>
          <Route index={true} element={<LandingScreen />} />
          <Route path='/login' element={<LoginScreen />} />
          <Route path='/register' element={<RegisterScreen />} />
        </Route>
      </Route>
      {/* Main app with header and footer - requires authentication */}
      <Route element={<App />} errorElement={<RouteError />}>
        <Route element={<AuthWrapper />}>
          <Route path='/home' element={<HomeScreen />} />
          <Route path='/search/:keyword' element={<HomeScreen />} />
          <Route path='/page/:pageNumber' element={<HomeScreen />} />
          <Route
            path='/search/:keyword/page/:pageNumber'
            element={<HomeScreen />}
          />
          <Route
            path='/product/:id'
            element={<ProductScreen />}
            errorElement={<RouteError />}
          />
          <Route path='/collections/:id' element={<CollectionScreen />} />

          {/* Already protected routes for registered users */}
          <Route path='' element={<PrivateRoute />}>
            <Route path='/profile' element={<ProfileScreen />} />
            <Route path='/my-orders' element={<MyOrdersScreen />} />
            <Route path='/my-collections' element={<MyCollectionsScreen />} />
            <Route
              path='/workout-dashboard'
              element={<WorkoutDashboardScreen />}
            />
            <Route path='/workout/:id' element={<WorkoutDetailScreen />} />
            <Route path='/diet-dashboard' element={<DietDashboardScreen />} />
            <Route path='/add-diet-entry' element={<AddDietEntryScreen />} />
            <Route path='/sleep-tracker' element={<SleepTrackerScreen />} />
            <Route path='/weight-tracker' element={<WeightTrackerScreen />} />
            <Route path='/ai-analysis' element={<AiAnalysisScreen />} />
            <Route path='/quiz' element={<QuizScreen />} />
          </Route>

          {/* Admin users */}
          <Route path='' element={<AdminRoute />}>
            <Route path='/admin/orderlist' element={<OrderListScreen />} />
            <Route path='/admin/productlist' element={<ProductListScreen />} />
            <Route
              path='/admin/productlist/:pageNumber'
              element={<ProductListScreen />}
            />
            <Route path='/admin/userlist' element={<UserListScreen />} />
            <Route
              path='/admin/userlist/:pageNumber'
              element={<UserListScreen />}
            />
            <Route
              path='/admin/product/:id/edit'
              element={<ProductEditScreen />}
            />
            <Route path='/admin/user/:id/edit' element={<UserEditScreen />} />
            <Route path='/admin/user/create' element={<UserCreateScreen />} />
            <Route
              path='/admin/collectionlist'
              element={<CollectionListScreen />}
            />
            <Route
              path='/admin/collection/:id/edit'
              element={<CollectionEditScreen />}
            />
            <Route
              path='/admin/access-codes'
              element={<OneTimeCodesScreen />}
            />{' '}
            <Route
              path='/admin/access-codes/:collectionId'
              element={<OneTimeCodesScreen />}
            />
            <Route
              path='/admin/collectionlist/:pageNumber'
              element={<CollectionListScreen />}
            />
            <Route
              path='/admin/user/:id/workouts'
              element={<UserWorkoutScreen />}
            />
            <Route path='/admin/workouts' element={<WorkoutTrackingScreen />} />
            <Route
              path='/admin/workout/:id'
              element={<AdminWorkoutDetailScreen />}
            />
            <Route
              path='/admin/workouts/page/:pageNumber'
              element={<WorkoutTrackingScreen />}
            />
            <Route
              path='/admin/system-settings'
              element={<SystemSettingsScreen />}
            />
            <Route
              path='/admin/carousel'
              element={
                <PrivateRoute>
                  <AdminRoute>
                    <AdminCarouselScreen />
                  </AdminRoute>
                </PrivateRoute>
              }
            />
            <Route
              path='/admin/user-workout-dashboard'
              element={<AdminUserWorkoutDashboard />}
            />
            <Route
              path='/admin/user-workout-dashboard/:id'
              element={<AdminUserWorkoutDashboard />}
            />
            <Route
              path='/admin/user-diet-dashboard'
              element={<AdminUserDietDashboard />}
            />
            <Route
              path='/admin/user-diet-dashboard/:id'
              element={<AdminUserDietDashboard />}
            />
            <Route
              path='/admin/user-sleep-dashboard/:id'
              element={<AdminUserSleepDashboard />}
            />
            <Route
              path='/admin/user-weight-dashboard/:id'
              element={<AdminUserWeightDashboard />}
            />
            <Route
              path='/admin/timeframe-management'
              element={<TimeFrameManagementScreen />}
            />
            <Route
              path='/admin/quiz-settings'
              element={<AdminQuizSettingsScreen />}
            />
            <Route path='/admin/quizlist' element={<AdminQuizListScreen />} />
            <Route
              path='/admin/quiz/:id/edit'
              element={<AdminQuizEditScreen />}
            />
            <Route
              path='/admin/ai-analysis'
              element={<AdminAiAnalysisScreen />}
            />
          </Route>

          {/* Super Admin Routes */}
          <Route path='' element={<SuperAdminRoute />}>
            <Route path='/super-admin' element={<SuperAdminDashboard />} />
            <Route path='/super-admin/tenants' element={<TenantListScreen />} />
            <Route path='/super-admin/tenants/create' element={<CreateTenantScreen />} />
            <Route path='/super-admin/tenants/:id' element={<TenantViewScreen />} />
            <Route path='/super-admin/tenants/:id/edit' element={<TenantEditScreen />} />
            <Route path='/super-admin/tenants/:id/users' element={<TenantUsersScreen />} />
            <Route path='/super-admin/tenants/:id/statistics' element={<TenantStatisticsScreen />} />
          </Route>
        </Route>
      </Route>
    </Route>
  ),
  {
    // Disable browser's default scroll restoration
    scrollRestoration: 'manual',
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <RouterProvider router={routerWithTenant} />
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
);

reportWebVitals();

// Streamlined Service Worker registration for super-fast loading
if ('serviceWorker' in navigator) {
  // Don't wait for 'load' event - register immediately for faster startup
  (async () => {
    // Quick check to prevent multiple registrations
    if (window.swRegistrationInProgress) return;
    window.swRegistrationInProgress = true;
    
    try {
      // Simple reload loop protection
      const reloadCount = parseInt(sessionStorage.getItem('sw-reload-count') || '0');
      if (reloadCount > 2) { // Reduced threshold for faster recovery
        sessionStorage.removeItem('sw-reload-count');
        return;
      }
      
      sessionStorage.setItem('sw-reload-count', (reloadCount + 1).toString());
      
      // Clear counter quickly
      setTimeout(() => sessionStorage.removeItem('sw-reload-count'), 2000);
      
      // Check existing registration
      const existingRegistration = await navigator.serviceWorker.getRegistration();
      if (existingRegistration && existingRegistration.active) {
        serviceWorkerManager.registration = existingRegistration;
        // Quick non-blocking preload
        serviceWorkerManager.preloadHeroImages().catch(() => {});
        return;
      }
      
      // Quick registration attempt
      const success = await serviceWorkerManager.init();
      if (success) {
        console.log('SW: Fast registration successful');
        // Non-blocking background preload
        setTimeout(() => {
          serviceWorkerManager.preloadHeroImages().catch(() => {});
        }, 100);
      }
    } catch (error) {
      console.warn('SW: Fast registration failed:', error);
      sessionStorage.removeItem('sw-reload-count');
      // Quick cleanup attempt
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) reg.unregister().catch(() => {});
      });
    } finally {
      window.swRegistrationInProgress = false;
    }
  })();
}
