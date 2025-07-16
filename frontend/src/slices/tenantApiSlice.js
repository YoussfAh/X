import { apiSlice } from './apiSlice';
import { useTenant } from '../contexts/TenantContext';

const TENANTS_URL = '/api/super-admin/tenants';

export const tenantApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all tenants (super admin only)
    getTenants: builder.query({
      query: ({ page = 1, search = '', status = '', plan = '' }) => ({
        url: TENANTS_URL,
        params: { page, search, status, plan }
      }),
      keepUnusedDataFor: 5,
      providesTags: ['Tenant']
    }),

    // Get tenant details (super admin only)
    getTenantDetails: builder.query({
      query: (tenantId) => ({
        url: `${TENANTS_URL}/${tenantId}`
      }),
      keepUnusedDataFor: 5,
      providesTags: (result, error, tenantId) => [{ type: 'Tenant', id: tenantId }]
    }),

    // Create new tenant (super admin only)
    createTenant: builder.mutation({
      query: (data) => ({
        url: TENANTS_URL,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Tenant']
    }),

    // Update tenant (super admin only)
    updateTenant: builder.mutation({
      query: ({ tenantId, ...data }) => ({
        url: `${TENANTS_URL}/${tenantId}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { tenantId }) => [
        { type: 'Tenant', id: tenantId },
        'Tenant'
      ]
    }),

    // Delete/Suspend tenant (super admin only)
    deleteTenant: builder.mutation({
      query: (tenantId) => ({
        url: `${TENANTS_URL}/${tenantId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Tenant']
    }),

    // Get tenant statistics (super admin only)
    getTenantStatistics: builder.query({
      query: (tenantId) => ({
        url: `${TENANTS_URL}/${tenantId}/statistics`
      }),
      keepUnusedDataFor: 5,
      providesTags: (result, error, tenantId) => [{ type: 'TenantStats', id: tenantId }]
    }),

    // Update tenant branding (super admin only)
    updateTenantBranding: builder.mutation({
      query: ({ tenantId, ...branding }) => ({
        url: `${TENANTS_URL}/${tenantId}/branding`,
        method: 'PUT',
        body: branding
      }),
      invalidatesTags: (result, error, { tenantId }) => [
        { type: 'Tenant', id: tenantId }
      ]
    }),

    // Update tenant limits (super admin only)
    updateTenantLimits: builder.mutation({
      query: ({ tenantId, ...limits }) => ({
        url: `${TENANTS_URL}/${tenantId}/limits`,
        method: 'PUT',
        body: limits
      }),
      invalidatesTags: (result, error, { tenantId }) => [
        { type: 'Tenant', id: tenantId }
      ]
    }),

    // Toggle tenant status (super admin only)
    toggleTenantStatus: builder.mutation({
      query: ({ tenantId, status }) => ({
        url: `${TENANTS_URL}/${tenantId}/status`,
        method: 'PUT',
        body: { status }
      }),
      invalidatesTags: (result, error, { tenantId }) => [
        { type: 'Tenant', id: tenantId },
        'Tenant'
      ]
    }),

    // Get tenant users (super admin only)
    getTenantUsers: builder.query({
      query: ({ tenantId, page = 1 }) => ({
        url: `${TENANTS_URL}/${tenantId}/users`,
        params: { page }
      }),
      keepUnusedDataFor: 5,
      providesTags: (result, error, { tenantId }) => [
        { type: 'TenantUsers', id: tenantId }
      ]
    }),

    // Generate tenant access URL (super admin only)
    getTenantAccessUrl: builder.query({
      query: (tenantId) => ({
        url: `${TENANTS_URL}/${tenantId}/access-url`
      }),
      keepUnusedDataFor: 5
    }),

    // Reset tenant data (super admin only)
    resetTenantData: builder.mutation({
      query: ({ tenantId, keepUsers = false, keepSettings = false }) => ({
        url: `${TENANTS_URL}/${tenantId}/reset`,
        method: 'POST',
        body: { keepUsers, keepSettings }
      }),
      invalidatesTags: (result, error, { tenantId }) => [
        { type: 'Tenant', id: tenantId },
        { type: 'TenantStats', id: tenantId },
        { type: 'TenantUsers', id: tenantId }
      ]
    }),

    // Export tenant data (super admin only)
    exportTenantData: builder.query({
      query: (tenantId) => ({
        url: `${TENANTS_URL}/${tenantId}/export`
      })
    }),

    // Switch to tenant (super admin only)
    switchToTenant: builder.mutation({
      query: (tenantId) => ({
        url: `${TENANTS_URL}/${tenantId}/switch`,
        method: 'POST'
      })
    }),

    // Get current tenant info (for all users)
    getCurrentTenant: builder.query({
      query: () => ({
        url: '/api/tenant/current',
        // Add tenant headers if available
        prepareHeaders: (headers, { getState }) => {
          // This would be populated by the TenantContext
          const tenantSlug = localStorage.getItem('tenantSlug');
          if (tenantSlug) {
            headers.set('X-Tenant-Slug', tenantSlug);
          }
          return headers;
        }
      }),
      keepUnusedDataFor: 60, // Cache for 1 minute
      providesTags: ['CurrentTenant']
    })
  })
});

export const {
  useGetTenantsQuery,
  useGetTenantDetailsQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
  useGetTenantStatisticsQuery,
  useUpdateTenantBrandingMutation,
  useUpdateTenantLimitsMutation,
  useToggleTenantStatusMutation,
  useGetTenantUsersQuery,
  useGetTenantAccessUrlQuery,
  useResetTenantDataMutation,
  useExportTenantDataQuery,
  useSwitchToTenantMutation,
  useGetCurrentTenantQuery
} = tenantApiSlice; 