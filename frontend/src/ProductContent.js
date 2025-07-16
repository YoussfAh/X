import { showSuccessToast } from './utils/toastConfig';

const handleWorkoutSuccess = () => {
    setEntryToEdit(null);
    setRefreshKey(prevKey => prevKey + 1);
    showSuccessToast('✓');
    setWorkoutSectionExpanded(false);
};