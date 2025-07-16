import { apiSlice } from './apiSlice';

export const systemApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCarouselSlides: builder.query({
            query: () => ({
                url: `/api/system-settings/carousel`,
            }),
            keepUnusedDataFor: 5, // Keep data for 5 seconds
            providesTags: ['SystemCarousel'],
        }),
        updateCarouselSlides: builder.mutation({
            query: (carouselSlides) => ({
                url: `/api/system-settings/carousel`,
                method: 'PUT',
                body: { carouselSlides },
            }),
            invalidatesTags: ['SystemCarousel'],
        }),
        getCarouselSettings: builder.query({
            query: () => ({
                url: `/api/system-settings/carousel-settings`,
            }),
            keepUnusedDataFor: 5,
            providesTags: ['CarouselSettings'],
        }),
        updateCarouselSettings: builder.mutation({
            query: (settings) => ({
                url: `/api/system-settings/carousel-settings`,
                method: 'PUT',
                body: settings,
            }),
            invalidatesTags: ['CarouselSettings'],
        }),
        getMainHeroSettings: builder.query({
            query: () => ({
                url: `/api/system-settings/main-hero`,
            }),
            keepUnusedDataFor: 300, // Restore normal 5-minute cache
            providesTags: ['MainHero'],
        }),
        updateMainHeroSettings: builder.mutation({
            query: (heroSettings) => ({
                url: `/api/system-settings/main-hero`,
                method: 'PUT',
                body: heroSettings,
            }),
            invalidatesTags: ['MainHero', 'HeroTemplate'],
        }),
        getHeroTemplate: builder.query({
            query: (templateCode) => ({
                url: `/api/system-settings/main-hero/template/${templateCode}`,
            }),
            keepUnusedDataFor: 5, // Reduced for real-time template editing
            providesTags: (result, error, templateCode) => [
                { type: 'HeroTemplate', id: templateCode }
            ],
        }),
        updateHeroTemplate: builder.mutation({
            query: ({ templateCode, ...templateData }) => ({
                url: `/api/system-settings/main-hero/template/${templateCode}`,
                method: 'PUT',
                body: templateData,
            }),
            invalidatesTags: (result, error, { templateCode }) => [
                { type: 'HeroTemplate', id: templateCode },
                'MainHero'
            ],
        }),
        getGeneralSettings: builder.query({
            query: () => ({
                url: `/api/system-settings/general`,
            }),
            keepUnusedDataFor: 300, // Keep data for 5 minutes since these change less frequently
            providesTags: ['SystemGeneral'],
        }),
        updateGeneralSettings: builder.mutation({
            query: (settings) => ({
                url: `/api/system-settings/general`,
                method: 'PUT',
                body: settings,
            }),
            invalidatesTags: ['SystemGeneral'],
        }),
    }),
});

export const {
    useGetCarouselSlidesQuery,
    useUpdateCarouselSlidesMutation,
    useGetCarouselSettingsQuery,
    useUpdateCarouselSettingsMutation,
    useGetMainHeroSettingsQuery,
    useUpdateMainHeroSettingsMutation,
    useGetHeroTemplateQuery,
    useUpdateHeroTemplateMutation,
    useGetGeneralSettingsQuery,
    useUpdateGeneralSettingsMutation,
} = systemApiSlice; 