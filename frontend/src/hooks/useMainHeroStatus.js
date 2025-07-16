import { useGetMainHeroSettingsQuery } from '../slices/systemApiSlice';

export const useMainHeroStatus = () => {
    const { 
        data: heroSettings, 
        isLoading, 
        error 
    } = useGetMainHeroSettingsQuery();

    // Return the status of the main hero section
    return {
        isMainHeroEnabled: !isLoading && !error && heroSettings?.enabled === true,
        isLoading,
        error
    };
}; 