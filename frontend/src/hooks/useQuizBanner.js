import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useUpdateQuizBannerPreferenceMutation } from '../slices/usersApiSlice';

const useQuizBanner = (quizData) => {
    const { userInfo } = useSelector((state) => state.auth);
    const [updateQuizBannerPreference] = useUpdateQuizBannerPreferenceMutation();

    // Check if the user has completed the quiz
    const hasCompletedQuiz = useMemo(() => {
        if (!userInfo) return true; // Hide banner if no user info
        
        // Check database state first
        const hasAnswersInState = userInfo.quizAnswers && userInfo.quizAnswers.length > 0;
        
        // Then check localStorage as a permanent record
        const hasCompletedInStorage = localStorage.getItem(`quiz_completed_${userInfo._id}`) === 'true';
        
        // If completed in either place, store in localStorage for future reference
        if (hasAnswersInState && !hasCompletedInStorage) {
            localStorage.setItem(`quiz_completed_${userInfo._id}`, 'true');
            // Update the preference in the backend
            updateQuizBannerPreference({ dismissed: true }).unwrap().catch(() => {
                // Silently fail if the update fails
            });
        }
        
        return hasAnswersInState || hasCompletedInStorage;
    }, [userInfo, updateQuizBannerPreference]);

    const isQuizActive = useMemo(() => {
        if (!quizData) return false;
        return Boolean(quizData.isActive && quizData.pages?.length > 0);
    }, [quizData]);

    const shouldShowBanner = useMemo(() => {
        return Boolean(
            userInfo &&
            isQuizActive &&
            !hasCompletedQuiz
        );
    }, [userInfo, isQuizActive, hasCompletedQuiz]);

    return {
        shouldShowBanner,
        hasCompletedQuiz,
        isQuizActive
    };
};

export default useQuizBanner; 