import { apiSlice } from './apiSlice';

const TEMPLATES_URL = '/api/message-templates';

export const messageTemplateApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Get all message templates
        getMessageTemplates: builder.query({
            query: () => ({
                url: TEMPLATES_URL,
            }),
            providesTags: ['MessageTemplate'],
        }),

        // Create new message template
        createMessageTemplate: builder.mutation({
            query: (templateData) => ({
                url: TEMPLATES_URL,
                method: 'POST',
                body: templateData,
            }),
            invalidatesTags: ['MessageTemplate'],
        }),

        // Update message template
        updateMessageTemplate: builder.mutation({
            query: ({ id, ...templateData }) => ({
                url: `${TEMPLATES_URL}/${id}`,
                method: 'PUT',
                body: templateData,
            }),
            invalidatesTags: ['MessageTemplate'],
        }),

        // Delete message template
        deleteMessageTemplate: builder.mutation({
            query: (id) => ({
                url: `${TEMPLATES_URL}/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['MessageTemplate'],
        }),

        // Initialize default templates
        initializeDefaultTemplates: builder.mutation({
            query: () => ({
                url: `${TEMPLATES_URL}/initialize-defaults`,
                method: 'POST',
            }),
            invalidatesTags: ['MessageTemplate'],
        }),

        // Increment template usage
        incrementTemplateUsage: builder.mutation({
            query: (id) => ({
                url: `${TEMPLATES_URL}/${id}/use`,
                method: 'POST',
            }),
            invalidatesTags: ['MessageTemplate'],
        }),
    }),
});

export const {
    useGetMessageTemplatesQuery,
    useCreateMessageTemplateMutation,
    useUpdateMessageTemplateMutation,
    useDeleteMessageTemplateMutation,
    useInitializeDefaultTemplatesMutation,
    useIncrementTemplateUsageMutation,
} = messageTemplateApiSlice; 