import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Form,
  Button,
  Card,
  Table,
  Badge,
  Modal,
  Row,
  Col,
  InputGroup,
  ListGroup,
} from 'react-bootstrap';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
// import FormContainer from '../../components/FormContainer';
import ContactForm from '../../components/ContactForm';
import ContactHistory from '../../components/ContactHistory';
import { showSuccessToast, showErrorToast } from '../../utils/toastConfig';
import { updateUserData } from '../../slices/authSlice';
import {
  FaLock,
  FaUnlock,
  FaPlus,
  FaTrash,
  FaKey,
  FaClock,
  FaUserShield,
  FaEye,
  FaInfoCircle,
  FaUserCheck,
  FaTags,
  FaEdit,
  FaArchive,
  FaDumbbell,
  FaSearch,
  FaFilter,
  FaLayerGroup,
  FaCalendarAlt,
  FaClipboardCheck,
  FaShieldAlt,
  FaPhoneAlt,
  FaHistory,
  FaHeadset,
  FaQuestionCircle,
  FaCheck,
  FaBrain,
} from 'react-icons/fa';
import {
  useGetUserDetailsQuery,
  useUpdateUserMutation,
  useAdminAddLockedCollectionMutation,
  useRemoveLockedCollectionMutation,
  useUpdateUserPasswordMutation,
  useGetUserAssignedCollectionsQuery,
  useAssignCollectionToUserMutation,
  useRemoveAssignedCollectionMutation,
  useUpdateAssignedCollectionMutation,
  useBatchAssignCollectionsMutation,
  useTrackCollectionAccessMutation,
  useTrackUserContactMutation,
  useGetUserContactHistoryQuery,
  useSaveTimeFrameSettingsMutation,
  useGetTimeFrameHistoryQuery,
  useAddAdminNoteMutation,
  useDeleteAdminNoteMutation,
  useRemoveAllAssignedCollectionsMutation,
} from '../../slices/usersApiSlice';
import {
  useGetQuizzesQuery,
  useAssignQuizToUserMutation,
  useUnassignQuizFromUserMutation,
  useGetUserQuizResultsQuery,
} from '../../slices/quizApiSlice';
import { useGetQuizAnswersQuery } from '../../slices/quizApiSlice';
import { useGetAdminCollectionsQuery } from '../../slices/collectionsApiSlice';
import { apiSlice } from '../../slices/apiSlice';
import { format } from 'date-fns';
import AdminUserWorkoutDashboard from './AdminUserWorkoutDashboard';
import { components } from 'react-select';
import QuizReport from '../../components/admin/QuizReport';
import UserQuizManagement from '../../components/admin/UserQuizManagement';
import ProgressImageSection from '../../components/ProgressImageSection';

const UserEditScreen = () => {
  const { id: userId } = useParams();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get current user info to check if editing own profile
  const { userInfo: currentUser } = useSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [injuries, setInjuries] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [whatsAppPhoneNumber, setWhatsAppPhoneNumber] = useState('');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [facebookProfile, setFacebookProfile] = useState('');
  const [twitterUsername, setTwitterUsername] = useState('');
  const [contactNotes, setContactNotes] = useState('');
  const [contactHistoryRefreshTrigger, setContactHistoryRefreshTrigger] =
    useState(0);
  const [adminNote, setAdminNote] = useState('');

  // Feature Flags
  const [uploadMealImageEnabled, setUploadMealImageEnabled] = useState(false);
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(false);

  // Time Frame Management - Added for admin control
  const [timeFrameStartDate, setTimeFrameStartDate] = useState('');
  const [timeFrameDuration, setTimeFrameDuration] = useState('');
  const [timeFrameDurationType, setTimeFrameDurationType] = useState('days');
  const [timeFrameEndDate, setTimeFrameEndDate] = useState('');
  const [isWithinTimeFrame, setIsWithinTimeFrame] = useState(false);
  const [timeFrameNotes, setTimeFrameNotes] = useState('');
  const [showTimeFrameHistory, setShowTimeFrameHistory] = useState(false);

  // Collection assignment states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [editingCollection, setEditingCollection] = useState(null);
  const [collectionNotes, setCollectionNotes] = useState('');
  const [collectionTags, setCollectionTags] = useState('');
  const [collectionStatus, setCollectionStatus] = useState('active');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [collectionToAssign, setCollectionToAssign] = useState('');

  // States for locked collections management
  const [showModal, setShowModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [collectionPrice, setCollectionPrice] = useState('0');

  // State for collection search in modals
  const [collectionSearchTerm, setCollectionSearchTerm] = useState('');
  const [batchCollectionSearchTerm, setBatchCollectionSearchTerm] =
    useState('');

  // Quiz-related states (now handled by UserQuizManagement component)

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useGetUserDetailsQuery(userId);

  const { data: quizAnswers, isLoading: loadingQuizAnswers } =
    useGetQuizAnswersQuery(userId, {
      skip: !userId,
    });

  // Quiz-related queries and mutations
  const { data: quizzes, isLoading: loadingQuizzes } = useGetQuizzesQuery();
  const { data: userQuizResults, isLoading: loadingUserQuizResults } =
    useGetUserQuizResultsQuery(userId);
  const [assignQuizToUser, { isLoading: isAssigningQuiz }] =
    useAssignQuizToUserMutation();
  const [unassignQuizFromUser, { isLoading: isUnassigningQuiz }] =
    useUnassignQuizFromUserMutation();

  // Get collections for the add collection modal
  const { data: collectionsData, isLoading: collectionsLoading } =
    useGetAdminCollectionsQuery({
      pageNumber: 1,
      keyword: '',
      visibility: 'all',
      skipPagination: true,
    });

  // Extract the collections array from the response, handling different response structures
  const collections = useMemo(() => {
    if (!collectionsData) return [];
    // Handle both structures: collections array directly or nested in "collections" property
    return Array.isArray(collectionsData)
      ? collectionsData
      : Array.isArray(collectionsData.collections)
      ? collectionsData.collections
      : [];
  }, [collectionsData]);

  // Mutations for locked collections management
  const [adminAddLockedCollection, { isLoading: addingCollection }] =
    useAdminAddLockedCollectionMutation();
  const [removeLockedCollection, { isLoading: removingCollection }] =
    useRemoveLockedCollectionMutation();

  const [updateUser, { isLoading: loadingUpdate }] = useUpdateUserMutation();
  const [updateUserPassword, { isLoading: updatingPassword }] =
    useUpdateUserPasswordMutation();

  // Hooks for assigned collections management
  const { data: assignedCollections, isLoading: loadingAssignedCollections } =
    useGetUserAssignedCollectionsQuery(userId);
  const [assignCollection] = useAssignCollectionToUserMutation();
  const [removeAssigned] = useRemoveAssignedCollectionMutation();
  const [updateAssignedCollection] = useUpdateAssignedCollectionMutation();
  const [batchAssignCollections] = useBatchAssignCollectionsMutation();
  const [trackAccess] = useTrackCollectionAccessMutation();
  // Add tracks for user Model
  const [trackUserContact] = useTrackUserContactMutation();
  const [addAdminNote, { isLoading: isAddingAdminNote }] =
    useAddAdminNoteMutation();
  const [deleteAdminNote, { isLoading: isDeletingAdminNote }] =
    useDeleteAdminNoteMutation();

  // Time frame management hooks
  const [saveTimeFrameSettings, { isLoading: savingTimeFrame }] =
    useSaveTimeFrameSettingsMutation();
  const { data: timeFrameHistory, refetch: refetchHistory } =
    useGetTimeFrameHistoryQuery(userId);

  // Filter and sort assigned collections
  const filteredCollections = useMemo(() => {
    if (!assignedCollections) return [];

    // Convert Map to array of values
    let filtered = Array.isArray(assignedCollections)
      ? assignedCollections
      : Object.values(assignedCollections);

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((c) => c.status === filterStatus);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.notes?.toLowerCase().includes(term) ||
          c.tags?.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    // Sort by most recently accessed
    // Create a shallow copy using the spread operator [...] before sorting
    return [...filtered].sort((a, b) => {
      // Prioritize items with a lastAccessedAt date
      if (a.lastAccessedAt && !b.lastAccessedAt) return -1;
      if (!a.lastAccessedAt && b.lastAccessedAt) return 1;
      // If both have dates, sort by most recent
      if (a.lastAccessedAt && b.lastAccessedAt) {
        return new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt);
      }
      // If neither have dates, sort by when they were assigned
      if (a.assignedAt && b.assignedAt) {
        return new Date(b.assignedAt) - new Date(a.assignedAt);
      }
      return 0; // Fallback for items with no date info
    });
  }, [assignedCollections, filterStatus, searchTerm]);

  // Add this new function to properly check if a collection is already assigned
  const isCollectionAssignedToUser = (collectionId) => {
    if (!assignedCollections) return false;

    // Handle different possible data structures of assignedCollections
    if (Array.isArray(assignedCollections)) {
      return assignedCollections.some((ac) => ac.collectionId === collectionId);
    } else if (typeof assignedCollections === 'object') {
      // Check both as an object with keys and as an object with collectionId properties
      return (
        Object.values(assignedCollections).some(
          (ac) => ac.collectionId === collectionId
        ) || Object.keys(assignedCollections).includes(collectionId)
      );
    }
    return false;
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      console.log('🔄 Submitting user update with feature flags:', {
        uploadMealImage: uploadMealImageEnabled,
        aiAnalysis: aiAnalysisEnabled,
      });

      const updateData = {
        _id: userId,
        name,
        email,
        isAdmin,
        age: age ? Number(age) : null,
        fitnessGoal,
        injuries,
        additionalInfo,
        whatsAppPhoneNumber,
        instagramUsername,
        facebookProfile,
        twitterUsername,
        // Include feature flags data
        featureFlags: {
          uploadMealImage: uploadMealImageEnabled,
          aiAnalysis: aiAnalysisEnabled,
        },
        // Include time frame data
        timeFrameStartDate: timeFrameStartDate || null,
        timeFrameDuration: timeFrameDuration
          ? parseInt(timeFrameDuration)
          : null,
        timeFrameDurationType: timeFrameDurationType || 'days',
      };

      console.log('📤 Sending update data:', updateData);
      
      const result = await updateUser(updateData).unwrap();
      console.log('✅ Update result received:', result);
      
      // If editing current user, update their auth state with new feature flags
      if (currentUser && currentUser._id === userId) {
        console.log('👤 Updating current user auth state with new feature flags:', result.featureFlags);
        dispatch(updateUserData({ 
          featureFlags: result.featureFlags 
        }));
      }
      
      showSuccessToast('User updated successfully');
      
      // Show specific success message for feature flags
      if (updateData.featureFlags) {
        const enabledFeatures = [];
        if (updateData.featureFlags.uploadMealImage) enabledFeatures.push('Meal Upload');
        if (updateData.featureFlags.aiAnalysis) enabledFeatures.push('AI Analysis');
        
        if (enabledFeatures.length > 0) {
          showSuccessToast(`✅ Feature flags updated: ${enabledFeatures.join(', ')} enabled for user`);
        } else {
          showSuccessToast('⚠️ All feature flags disabled for user');
        }
      }
      
      // Force refetch to get latest data
      await refetch();
      console.log('🔄 Data refetched');
      
    } catch (err) {
      console.error('❌ Error updating user:', err);
      showErrorToast(err?.data?.message || err.error);
    }
  };

  const handleAddAdminNote = async () => {
    if (!adminNote.trim()) {
      showErrorToast('Please enter a note');
      return;
    }

    try {
      await addAdminNote({
        userId,
        note: adminNote.trim(),
      }).unwrap();
      setAdminNote('');
      showSuccessToast('Admin note added successfully');
      // Refetch user data to update admin notes display
      refetch();
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to add admin note');
    }
  };

  const handleDeleteAdminNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteAdminNote({ userId, noteId }).unwrap();
        showSuccessToast('Note deleted successfully');
      } catch (err) {
        showErrorToast(err?.data?.message || err.error);
      }
    }
  };

  // Handle adding a new locked collection to the user
  const handleAddCollection = async () => {
    if (!selectedCollection) {
      showErrorToast('Please select a collection');
      return;
    }

    try {
      await adminAddLockedCollection({
        userId,
        collectionId: selectedCollection,
        price: parseFloat(collectionPrice) || 0,
      }).unwrap();

      showSuccessToast('Collection access granted to user');
      setShowModal(false);
      setSelectedCollection('');
      setCollectionPrice('0');
      refetch();
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
    }
  };

  // Handle removing collection access from the user
  // Quiz assignment handlers
  const handleAssignQuiz = async (quizId) => {
    if (!quizId) {
      showErrorToast('Please select a quiz to assign.');
      return;
    }
    try {
      await assignQuizToUser({ userId, quizId }).unwrap();
      showSuccessToast('Quiz assigned successfully!');
      refetch(); // Refetch user data to show the new pending quiz
    } catch (err) {
      showErrorToast(err?.data?.message || 'Failed to assign quiz.');
    }
  };

  const handleUnassignQuiz = async () => {
    if (
      window.confirm(
        'Are you sure you want to remove all quiz assignments for this user?'
      )
    ) {
      try {
        await unassignQuizFromUser({ userId }).unwrap();
        showSuccessToast('Quiz assignments removed successfully!');
        refetch(); // Refetch user data to remove the pending quiz
      } catch (err) {
        showErrorToast(
          err?.data?.message || 'Failed to remove quiz assignments.'
        );
      }
    }
  };

  const handleUnassignSpecificQuiz = async (quizId) => {
    if (
      window.confirm(
        'Are you sure you want to remove this specific quiz assignment?'
      )
    ) {
      try {
        await unassignQuizFromUser({ userId, quizId }).unwrap();
        showSuccessToast('Quiz assignment removed successfully!');
        refetch();
      } catch (err) {
        showErrorToast(
          err?.data?.message || 'Failed to remove quiz assignment.'
        );
      }
    }
  };

  const handleRemoveCollection = async (collectionId) => {
    if (
      window.confirm('Are you sure you want to remove this collection access?')
    ) {
      try {
        await removeLockedCollection({
          userId,
          collectionId,
        }).unwrap();

        showSuccessToast('Collection access removed');
        refetch();
      } catch (err) {
        showErrorToast(err?.data?.message || err.error);
      }
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (!password || password.length < 6) {
      showErrorToast('Password must be at least 6 characters');
      return;
    }

    try {
      await updateUserPassword({
        userId,
        password,
      }).unwrap();

      showSuccessToast("User's password updated successfully");
      setPassword('');
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
    }
  };

  // Handle assigning a collection to the user
  const handleAssignCollection = async () => {
    if (!collectionToAssign) {
      showErrorToast('Please select a collection');
      return;
    }

    try {
      // Find the collection name - handle collections data which might be in collections.collections
      const collectionsArray = collections?.collections || collections || [];
      const collection = collectionsArray.find(
        (c) => c._id === collectionToAssign
      );

      if (!collection) {
        showErrorToast('Collection not found');
        return;
      }

      await assignCollection({
        userId,
        collectionId: collectionToAssign,
        name: collection.name,
      }).unwrap();

      showSuccessToast('Collection assigned to user');
      setShowAssignModal(false);
      setCollectionToAssign('');
      setCollectionSearchTerm('');
      // Refetch both user details and assigned collections
      refetch();

      // Force invalidate the Collections cache to ensure HomeScreen updates
      // when the user logs in
      dispatch(apiSlice.util.invalidateTags(['Collections']));
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
    }
  };

  // Handle removing assigned collection from the user
  const handleRemoveAssignedCollection = async (collectionId) => {
    if (
      window.confirm(
        'Are you sure you want to remove this assigned collection?'
      )
    ) {
      try {
        await removeAssigned({
          userId,
          collectionId,
        }).unwrap();

        showSuccessToast('Assigned collection removed');
        // Refetch the assigned collections data after removal
        refetch();

        // Force invalidate the Collections cache to ensure HomeScreen updates
        // when the user logs in
        dispatch(apiSlice.util.invalidateTags(['Collections']));
      } catch (err) {
        showErrorToast(err?.data?.message || err.error);
      }
    }
  };

  // Handle batch assignment
  const handleBatchAssign = async () => {
    if (selectedCollections.length === 0) {
      showErrorToast('Please select at least one collection');
      return;
    }

    try {
      // Handle collections data which might be nested in collections.collections
      const collectionsArray = collections?.collections || collections || [];

      const collectionsData = selectedCollections
        .map((id) => {
          const collection = collectionsArray.find((c) => c._id === id);
          if (!collection) {
            showErrorToast(`Collection with ID ${id} not found`);
            return null;
          }
          return {
            collectionId: id,
            name: collection.name,
          };
        })
        .filter(Boolean); // Remove any null entries

      if (collectionsData.length === 0) {
        showErrorToast('No valid collections found to assign');
        return;
      }

      await batchAssignCollections({
        userId,
        collections: collectionsData,
      }).unwrap();

      showSuccessToast('Collections assigned successfully');
      setShowBatchModal(false);
      setSelectedCollections([]);
      setBatchCollectionSearchTerm('');
      refetch();
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
    }
  };

  // Handle collection edit
  const handleEditCollection = async () => {
    if (!editingCollection) return;

    try {
      await updateAssignedCollection({
        userId,
        collectionId: editingCollection.collectionId,
        notes: collectionNotes,
        tags: collectionTags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        status: collectionStatus,
      }).unwrap();

      showSuccessToast('Collection updated successfully');
      setShowEditModal(false);
      setEditingCollection(null);
      setCollectionNotes('');
      setCollectionTags('');
      setCollectionStatus('active');
      refetch();
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
    }
  };

  // Track collection access
  const handleTrackAccess = async (collectionId) => {
    try {
      await trackAccess({
        userId,
        collectionId,
      }).unwrap();
    } catch (err) {
      console.error('Error tracking access:', err);
    }
  };

  // Function to format the time elapsed since last contact
  const formatTimeSince = (date) => {
    if (!date) return 'Never contacted';

    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    let interval = Math.floor(seconds / 31536000); // years
    if (interval >= 1) {
      return interval === 1 ? '1 year ago' : `${interval} years ago`;
    }

    interval = Math.floor(seconds / 2592000); // months
    if (interval >= 1) {
      return interval === 1 ? '1 month ago' : `${interval} months ago`;
    }

    interval = Math.floor(seconds / 86400); // days
    if (interval >= 1) {
      return interval === 1 ? '1 day ago' : `${interval} days ago`;
    }

    interval = Math.floor(seconds / 3600); // hours
    if (interval >= 1) {
      return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
    }

    interval = Math.floor(seconds / 60); // minutes
    if (interval >= 1) {
      return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
    }

    return seconds <= 10 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
  };

  // Handle recording a new contact with the user (legacy - kept for compatibility)
  const handleRecordContact = async () => {
    try {
      await trackUserContact({
        userId,
        contactNotes,
      }).unwrap();
      showSuccessToast('Contact with user recorded successfully');
      refetch(); // Refresh the user details to update the lastContactedAt field
    } catch (err) {
      showErrorToast(err?.data?.message || 'Failed to record contact');
      console.error('Error recording contact:', err);
    }
  };

  // Handle when a new contact is added via the ContactForm
  const handleContactAdded = () => {
    setContactHistoryRefreshTrigger((prev) => prev + 1); // Trigger refresh
  };

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setIsAdmin(user.isAdmin);
      setAge(user.age || '');
      setFitnessGoal(user.fitnessGoal || '');
      setInjuries(user.injuries || '');
      setAdditionalInfo(user.additionalInfo || '');
      setWhatsAppPhoneNumber(user.whatsAppPhoneNumber || '');
      setInstagramUsername(user.instagramUsername || '');
      setFacebookProfile(user.facebookProfile || '');
      setTwitterUsername(user.twitterUsername || '');
      setContactNotes(user.contactNotes || '');

      // Set feature flags if available
      console.log('👤 Loading user data:', {
        userId: user._id,
        featureFlags: user.featureFlags,
      });
      
      if (user.featureFlags) {
        console.log('🚩 Setting feature flags from user data:', user.featureFlags);
        setUploadMealImageEnabled(user.featureFlags.uploadMealImage || false);
        setAiAnalysisEnabled(user.featureFlags.aiAnalysis || false);
      } else {
        console.log('⚠️ No feature flags found in user data, setting defaults');
        setUploadMealImageEnabled(false);
        setAiAnalysisEnabled(false);
      }

      // Set time frame data if available
      if (user.timeFrame) {
        setTimeFrameStartDate(
          user.timeFrame.startDate
            ? new Date(user.timeFrame.startDate).toISOString().split('T')[0]
            : ''
        );
        setTimeFrameDuration(user.timeFrame.duration || '');
        setTimeFrameDurationType(user.timeFrame.durationType || 'days');
        setTimeFrameEndDate(
          user.timeFrame.endDate
            ? new Date(user.timeFrame.endDate).toISOString().split('T')[0]
            : ''
        );
        setIsWithinTimeFrame(user.timeFrame.isWithinTimeFrame || false);
      }
    }
  }, [user]);

  // Function to calculate end date based on start date, duration, and duration type
  const calculateEndDate = (startDate, duration, durationType) => {
    if (startDate && duration && duration > 0) {
      const start = new Date(startDate);
      const end = new Date(start);

      if (durationType === 'months') {
        end.setMonth(end.getMonth() + parseInt(duration));
      } else {
        // Default to days
        end.setDate(end.getDate() + parseInt(duration));
      }

      return end.toISOString().split('T')[0];
    }
    return '';
  };

  // Function to set start date to today
  const setStartDateToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setTimeFrameStartDate(today);
  };

  // Handle saving time frame settings with option to add or override
  const handleSaveTimeFrame = async (override = false) => {
    if (!timeFrameStartDate || !timeFrameDuration || timeFrameDuration <= 0) {
      showErrorToast('Please provide valid start date and duration');
      return;
    }

    try {
      await saveTimeFrameSettings({
        userId,
        startDate: timeFrameStartDate,
        duration: parseInt(timeFrameDuration),
        durationType: timeFrameDurationType,
        override,
        notes: timeFrameNotes,
      }).unwrap();

      showSuccessToast(
        override
          ? 'Time frame overridden successfully'
          : 'Time frame added successfully'
      );
      refetch();
      refetchHistory();

      // Clear the form
      setTimeFrameNotes('');
    } catch (err) {
      showErrorToast(
        err?.data?.message || err.error || 'Failed to save time frame'
      );
    }
  };

  // Function to format date for display (dd/mm/yyyy)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Update end date when start date or duration changes
  useEffect(() => {
    const endDate = calculateEndDate(
      timeFrameStartDate,
      timeFrameDuration,
      timeFrameDurationType
    );
    setTimeFrameEndDate(endDate);

    // Update within time frame status
    if (timeFrameStartDate && endDate) {
      const now = new Date();
      const start = new Date(timeFrameStartDate);
      const end = new Date(endDate);
      setIsWithinTimeFrame(now >= start && now <= end);
    } else {
      setIsWithinTimeFrame(false);
    }
  }, [timeFrameStartDate, timeFrameDuration, timeFrameDurationType]);

  // Add state variable for responsive design
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detect theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setIsDarkMode(
            document.documentElement.getAttribute('data-theme') === 'dark'
          );
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Define theme-aware colors
  const colors = {
    background: isDarkMode ? '#000000' : '#f8fafc',
    cardBg: isDarkMode ? '#0a0a0a' : '#ffffff',
    cardHeaderBg: isDarkMode ? '#121212' : '#f8fafc',
    text: isDarkMode ? '#e2e8f0' : '#1e293b',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    shadow: isDarkMode
      ? '0 4px 15px rgba(0, 0, 0, 0.8)'
      : '0 2px 10px rgba(0, 0, 0, 0.1)',
    accent: '#8B5CF6',
    hoverBg: isDarkMode ? '#121212' : '#f1f5f9',
    inputBg: isDarkMode ? '#121212' : '#ffffff',
    tableBg: isDarkMode ? '#0a0a0a' : '#ffffff',
    tableHeaderBg: isDarkMode ? '#121212' : '#f8fafc',
    tableHoverBg: isDarkMode ? '#181818' : '#f1f5f9',
    buttonPrimary: '#8B5CF6',
  };

  // Render a collection card for mobile view
  const renderCollectionCard = (collection) => (
    <Card
      key={collection.collectionId}
      className='mb-3'
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: colors.shadow,
        border: `1px solid ${colors.border}`,
        transition: 'all 0.2s ease',
      }}
    >
      <Card.Body>
        <div className='d-flex justify-content-between align-items-start mb-2'>
          <div>
            <h5
              style={{
                fontWeight: '600',
                color: colors.text,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FaLayerGroup style={{ color: colors.accent }} />
              {collection.name}
              {/* Collection Visibility Badge */}
              {collection.requiresCode ? (
                <Badge
                  bg='warning'
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    marginLeft: '8px',
                  }}
                >
                  Code Required
                </Badge>
              ) : collection.isPublic ? (
                <Badge
                  bg='success'
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    marginLeft: '8px',
                  }}
                >
                  Public
                </Badge>
              ) : (
                <Badge
                  bg='secondary'
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    marginLeft: '8px',
                  }}
                >
                  Private
                </Badge>
              )}
            </h5>
            {collection.notes && (
              <p
                className='text-muted mb-2'
                style={{
                  fontSize: '0.85rem',
                  marginBottom: '8px',
                }}
              >
                {collection.notes}
              </p>
            )}
          </div>
          <Badge
            bg={collection.status === 'active' ? 'success' : 'secondary'}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
            }}
          >
            {collection.status}
          </Badge>
        </div>

        <div
          style={{
            borderTop: `1px solid ${colors.border}`,
            borderBottom: `1px solid ${colors.border}`,
            padding: '8px 0',
            margin: '8px 0',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div
            className='d-flex align-items-center'
            style={{ fontSize: '0.85rem' }}
          >
            <FaCalendarAlt style={{ marginRight: '4px', color: '#4299e1' }} />
            <span style={{ color: isDarkMode ? '#e2e8f0' : '#334155' }}>
              {new Date(collection.assignedAt).toLocaleDateString()}
            </span>
          </div>
          <div
            className='d-flex align-items-center'
            style={{ fontSize: '0.85rem' }}
          >
            <FaClipboardCheck
              style={{ marginRight: '4px', color: '#38a169' }}
            />
            <span style={{ color: isDarkMode ? '#e2e8f0' : '#334155' }}>
              {collection.accessCount || 0} views
            </span>
          </div>
        </div>

        <div className='mb-3'>
          {collection.tags && collection.tags.length > 0 ? (
            collection.tags.map((tag) => (
              <Badge
                key={tag}
                bg='info'
                className='me-1 mb-1'
                style={{
                  backgroundColor: isDarkMode ? '#4c6896' : '#90cdf4',
                  color: isDarkMode ? 'white' : '#2c5282',
                  padding: '5px 8px',
                  borderRadius: '4px',
                }}
              >
                {tag}
              </Badge>
            ))
          ) : (
            <span className='text-muted' style={{ fontSize: '0.85rem' }}>
              No tags
            </span>
          )}
        </div>

        <div className='d-flex justify-content-between'>
          <Button
            variant='primary'
            size='sm'
            as={Link}
            to={`/admin/collection/${collection.collectionId}/edit`}
            style={{
              backgroundColor: colors.accent,
              borderColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '6px',
            }}
            onClick={() => handleTrackAccess(collection.collectionId)}
          >
            <FaEye size={14} /> View
          </Button>
          <div>
            <Button
              variant='light'
              size='sm'
              style={{
                backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
                border: 'none',
                marginRight: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '6px',
              }}
              onClick={() => {
                setEditingCollection(collection);
                setCollectionNotes(collection.notes || '');
                setCollectionTags(collection.tags?.join(', ') || '');
                setCollectionStatus(collection.status);
                setShowEditModal(true);
              }}
            >
              <FaEdit size={14} />
            </Button>
            <Button
              variant='danger'
              size='sm'
              style={{
                backgroundColor: isDarkMode ? '#742a28' : '#f56565',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '6px',
              }}
              onClick={() =>
                handleRemoveAssignedCollection(collection.collectionId)
              }
            >
              <FaArchive size={14} />
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  const downloadQuizReport = () => {
    if (!quizAnswers) return;

    let reportContent = `Quiz Report for ${user.name} (${user.email})\n\n`;
    quizAnswers.forEach((qa, index) => {
      reportContent += `Q${index + 1}: ${qa.question}\n`;
      reportContent += `Answer: ${qa.answer}\n\n`;
    });

    const blob = new Blob([reportContent], {
      type: 'text/plain;charset=utf-8',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quiz-report-${user.name.replace(
      /\s+/g,
      '_'
    )}-${userId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [removeAllAssignedCollections] = useRemoveAllAssignedCollectionsMutation();
  const [showRemoveAllModal, setShowRemoveAllModal] = useState(false);

  // Add handler for removing all collections
  const handleRemoveAllCollections = async () => {
    try {
      await removeAllAssignedCollections(userId).unwrap();
      showSuccessToast('All collections removed successfully');
      setShowRemoveAllModal(false);
      refetch();
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
    }
  };

  return (
    <>
      <Link to='/admin/userlist' className='btn btn-light my-3'>
        Go Back
      </Link>
      {/* <FormContainer> */}
        <h1
          style={{
            color: colors.text,
            marginBottom: '24px',
            fontSize: isMobile ? '1.8rem' : '2.2rem',
            fontWeight: '600',
          }}
        >
          Edit User
        </h1>
        {loadingUpdate && <Loader />}
        {isLoading ? (
          <Loader />
        ) : error ? (
          <Message variant='danger'>
            {error?.data?.message || error.error}
          </Message>
        ) : (
          <>
            <Form onSubmit={submitHandler}>
              <Row className='g-4'>
                {/* Left Column */}
                <Col lg={6} md={12}>
                  <Card
                    className='mb-4'
                    style={{
                      backgroundColor: colors.cardBg,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: colors.shadow,
                      border: `1px solid ${colors.border}`,
                      height: 'fit-content',
                    }}
                  >
                    <Card.Body style={{ padding: '20px' }}>
                      <Card.Title
                        style={{
                          color: colors.text,
                          fontWeight: '600',
                          marginBottom: '20px',
                          borderBottom: `1px solid ${colors.border}`,
                          paddingBottom: '12px',
                        }}
                      >
                        Account Information
                      </Card.Title>
                      <Form.Group className='my-3' controlId='name'>
                        <Form.Label
                          style={{ fontWeight: '500', color: colors.text }}
                        >
                          Name
                        </Form.Label>
                        <Form.Control
                          type='name'
                          placeholder='Enter name'
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          style={{
                            backgroundColor: isDarkMode ? '#0a0a0a' : '#fff',
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            padding: '10px 12px',
                          }}
                        />
                      </Form.Group>

                      <Form.Group className='my-3' controlId='email'>
                        <Form.Label
                          style={{ fontWeight: '500', color: colors.text }}
                        >
                          Email Address
                        </Form.Label>
                        <Form.Control
                          type='email'
                          placeholder='Enter email'
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          style={{
                            backgroundColor: isDarkMode ? '#0a0a0a' : '#fff',
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            padding: '10px 12px',
                          }}
                        />
                      </Form.Group>

                      <Form.Group className='my-3' controlId='isadmin'>
                        <Form.Check
                          type='checkbox'
                          label='Is Admin'
                          checked={isAdmin}
                          onChange={(e) => setIsAdmin(e.target.checked)}
                          style={{
                            color: colors.text,
                          }}
                        />
                      </Form.Group>
                    </Card.Body>
                  </Card>

                  <Card
                    className='mb-4'
                    style={{
                      backgroundColor: colors.cardBg,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: colors.shadow,
                      border: `1px solid ${colors.border}`,
                      height: 'fit-content',
                    }}
                  >
                    <Card.Body style={{ padding: '20px' }}>
                      <Card.Title
                        style={{
                          color: colors.text,
                          fontWeight: '600',
                          marginBottom: '20px',
                          borderBottom: `1px solid ${colors.border}`,
                          paddingBottom: '12px',
                        }}
                      >
                        Fitness Profile
                      </Card.Title>

                      <Row>
                        <Col md={6}>
                          <Form.Group className='my-3' controlId='age'>
                            <Form.Label
                              style={{ fontWeight: '500', color: colors.text }}
                            >
                              Age
                            </Form.Label>
                            <Form.Control
                              type='number'
                              placeholder='Enter age'
                              value={age}
                              onChange={(e) => setAge(e.target.value)}
                              style={{
                                backgroundColor: isDarkMode
                                  ? '#0a0a0a'
                                  : '#fff',
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '6px',
                                padding: '10px 12px',
                              }}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className='my-3' controlId='fitnessGoal'>
                            <Form.Label
                              style={{ fontWeight: '500', color: colors.text }}
                            >
                              Fitness Goal
                            </Form.Label>
                            <Form.Select
                              value={fitnessGoal}
                              onChange={(e) => setFitnessGoal(e.target.value)}
                              style={{
                                backgroundColor: isDarkMode
                                  ? '#0a0a0a'
                                  : '#fff',
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '6px',
                                padding: '10px 12px',
                              }}
                            >
                              <option value=''>Select a goal</option>
                              <option value='gain weight'>Gain Weight</option>
                              <option value='lose weight'>Lose Weight</option>
                              <option value='build muscle'>Build Muscle</option>
                              <option value='get lean'>Get Lean</option>
                              <option value='maintain'>Maintain</option>
                              <option value='other'>Other</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group
                        className='my-3'
                        controlId='whatsAppPhoneNumber'
                      >
                        <Form.Label
                          style={{ fontWeight: '500', color: colors.text }}
                        >
                          WhatsApp Phone Number
                        </Form.Label>
                        <InputGroup>
                          <PhoneInput
                            international
                            defaultCountry='EG'
                            value={whatsAppPhoneNumber}
                            onChange={setWhatsAppPhoneNumber}
                            className='form-control'
                            style={{
                              backgroundColor: isDarkMode ? '#0a0a0a' : '#fff',
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '6px 0 0 6px',
                            }}
                          />
                          {whatsAppPhoneNumber && (
                            <Button
                              variant='success'
                              href={`https://wa.me/${whatsAppPhoneNumber}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              style={{
                                backgroundColor: '#25D366',
                                borderColor: '#25D366',
                                borderRadius: '0 6px 6px 0',
                              }}
                            >
                              <i className='fas fa-comment'></i> WhatsApp
                            </Button>
                          )}
                        </InputGroup>
                        <Form.Text className='text-muted'>
                          +2 01XXXXXXXXX
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className='my-3' controlId='injuries'>
                        <Form.Label
                          style={{ fontWeight: '500', color: colors.text }}
                        >
                          Injuries - Limitations
                        </Form.Label>
                        <Form.Control
                          as='textarea'
                          rows={3}
                          placeholder='Enter any injuries or limitations'
                          value={injuries}
                          onChange={(e) => setInjuries(e.target.value)}
                          style={{
                            backgroundColor: isDarkMode ? '#0a0a0a' : '#fff',
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            padding: '10px 12px',
                          }}
                        />
                      </Form.Group>

                      <Form.Group className='my-3'>
                        <Form.Label htmlFor='additionalInfo'>
                          <FaInfoCircle
                            className='me-2'
                            style={{ color: colors.accent }}
                          />
                          Additional Information
                          <br />
                          <small
                            style={{
                              color: isDarkMode ? '#aaa' : '#666',
                              paddingLeft: '20px',
                            }}
                          >
                            Admin can leave a message here for you
                          </small>
                        </Form.Label>
                        <Form.Control
                          as='textarea'
                          rows={3}
                          placeholder='Enter any additional information'
                          value={additionalInfo}
                          onChange={(e) => setAdditionalInfo(e.target.value)}
                          style={{
                            backgroundColor: isDarkMode ? '#0a0a0a' : '#fff',
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            padding: '10px 12px',
                          }}
                        />
                      </Form.Group>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Right Column */}
                <Col lg={6} md={12}>
                  <Card
                    className='mb-4'
                    style={{
                      backgroundColor: colors.cardBg,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: colors.shadow,
                      border: `1px solid ${colors.border}`,
                      height: 'fit-content',
                    }}
                  >
                    <Card.Body style={{ padding: '20px' }}>
                      <Card.Title
                        style={{
                          color: colors.text,
                          fontWeight: '600',
                          marginBottom: '20px',
                          borderBottom: `1px solid ${colors.border}`,
                          paddingBottom: '12px',
                        }}
                      >
                        Social Media Information
                      </Card.Title>
                      <Form.Group
                        className='my-3'
                        controlId='instagramUsername'
                      >
                        <Form.Label
                          style={{ fontWeight: '500', color: colors.text }}
                        >
                          Instagram Username
                        </Form.Label>
                        <InputGroup>
                          <InputGroup.Text
                            style={{
                              backgroundColor: isDarkMode
                                ? '#1e2736'
                                : '#f1f5f9',
                              border: `1px solid ${colors.border}`,
                              borderRadius: '6px 0 0 6px',
                            }}
                          >
                            @
                          </InputGroup.Text>
                          <Form.Control
                            type='text'
                            placeholder='Enter Instagram username'
                            value={instagramUsername}
                            onChange={(e) =>
                              setInstagramUsername(e.target.value)
                            }
                            style={{
                              backgroundColor: isDarkMode ? '#0a0a0a' : '#fff',
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '0',
                            }}
                          />
                          {instagramUsername && (
                            <Button
                              variant='info'
                              href={`https://instagram.com/${instagramUsername}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              style={{
                                backgroundColor: '#E1306C',
                                borderColor: '#E1306C',
                                color: '#ffffff',
                                borderRadius: '0 6px 6px 0',
                              }}
                            >
                              <i className='fab fa-instagram'></i> View Profile
                            </Button>
                          )}
                        </InputGroup>
                      </Form.Group>

                      <Form.Group className='my-3' controlId='facebookProfile'>
                        <Form.Label
                          style={{ fontWeight: '500', color: colors.text }}
                        >
                          Facebook Profile URL
                        </Form.Label>
                        <InputGroup>
                          <Form.Control
                            type='text'
                            placeholder='Enter Facebook profile URL or username'
                            value={facebookProfile}
                            onChange={(e) => setFacebookProfile(e.target.value)}
                            style={{
                              backgroundColor: isDarkMode ? '#0a0a0a' : '#fff',
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '6px 0 0 6px',
                            }}
                          />
                          {facebookProfile && (
                            <Button
                              variant='primary'
                              href={
                                facebookProfile.includes('facebook.com')
                                  ? facebookProfile
                                  : `https://facebook.com/${facebookProfile}`
                              }
                              target='_blank'
                              rel='noopener noreferrer'
                              style={{
                                backgroundColor: '#1877F2',
                                borderColor: '#1877F2',
                                borderRadius: '0 6px 6px 0',
                              }}
                            >
                              <i className='fab fa-facebook'></i> View Profile
                            </Button>
                          )}
                        </InputGroup>
                        <Form.Text className='text-muted'>
                          You can enter a full URL
                          (https://facebook.com/username) or just the username
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className='my-3' controlId='twitterUsername'>
                        <Form.Label
                          style={{ fontWeight: '500', color: colors.text }}
                        >
                          Twitter/X Username
                        </Form.Label>
                        <InputGroup>
                          <InputGroup.Text
                            style={{
                              backgroundColor: isDarkMode
                                ? '#1e2736'
                                : '#f1f5f9',
                              border: `1px solid ${colors.border}`,
                              borderRadius: '6px 0 0 6px',
                            }}
                          >
                            @
                          </InputGroup.Text>
                          <Form.Control
                            type='text'
                            placeholder='Enter Twitter username'
                            value={twitterUsername}
                            onChange={(e) => setTwitterUsername(e.target.value)}
                            style={{
                              backgroundColor: isDarkMode ? '#0a0a0a' : '#fff',
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '0',
                            }}
                          />
                          {twitterUsername && (
                            <Button
                              variant='dark'
                              href={`https://twitter.com/${twitterUsername}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              style={{
                                backgroundColor: '#000000',
                                borderColor: '#000000',
                                borderRadius: '0 6px 6px 0',
                              }}
                            >
                              <i className='fab fa-twitter'></i> View Profile
                            </Button>
                          )}
                        </InputGroup>
                      </Form.Group>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Quiz Management - Full Width */}
              <UserQuizManagement
                user={user}
                quizzes={quizzes}
                userQuizResults={userQuizResults}
                onAssignQuiz={handleAssignQuiz}
                onUnassignQuiz={handleUnassignQuiz}
                onUnassignSpecificQuiz={handleUnassignSpecificQuiz}
                isLoading={isAssigningQuiz || isUnassigningQuiz}
              />

              {/* Time Frame Management - Full Width */}
              <Card
                className='mb-4'
                style={{
                  backgroundColor: colors.cardBg,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: colors.shadow,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <Card.Header
                  style={{
                    backgroundColor: colors.cardHeaderBg,
                    borderBottom: `1px solid ${colors.border}`,
                    padding: '20px',
                  }}
                >
                  <div className='d-flex justify-content-between align-items-center'>
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          color: colors.text,
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <FaClock style={{ color: '#17a2b8' }} />
                        Time Frame Management
                      </h4>
                      <p
                        className='text-muted mb-0 mt-2'
                        style={{ fontSize: '0.9rem' }}
                      >
                        Set a time period for this user. The system will
                        automatically calculate the end date and track status.
                      </p>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body style={{ padding: '24px' }}>
                  <Row className='g-4'>
                    <Col lg={6} md={12}>
                      <div
                        style={{
                          backgroundColor: colors.cardHeaderBg,
                          padding: '20px',
                          borderRadius: '8px',
                          border: `1px solid ${colors.border}`,
                          height: '100%',
                        }}
                      >
                        <h6
                          style={{
                            color: colors.text,
                            marginBottom: '16px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <FaCalendarAlt style={{ color: '#6c757d' }} />
                          Time Frame Settings
                        </h6>

                        <Form.Group className='mb-3'>
                          <Form.Label
                            style={{ fontWeight: '500', color: colors.text }}
                          >
                            Start Date
                          </Form.Label>
                          <div className='d-flex gap-2'>
                            <Form.Control
                              type='date'
                              value={timeFrameStartDate}
                              onChange={(e) =>
                                setTimeFrameStartDate(e.target.value)
                              }
                              style={{
                                backgroundColor: isDarkMode
                                  ? '#0a0a0a'
                                  : '#fff',
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '6px',
                                padding: '10px 12px',
                              }}
                            />
                            <Button
                              variant='outline-primary'
                              size='sm'
                              onClick={setStartDateToToday}
                              style={{
                                borderColor: '#17a2b8',
                                color: '#17a2b8',
                                whiteSpace: 'nowrap',
                                padding: '8px 12px',
                              }}
                              title="Set to today's date"
                            >
                              Today
                            </Button>
                          </div>
                          {timeFrameStartDate && (
                            <Form.Text className='text-muted d-block mt-1'>
                              Selected:{' '}
                              {formatDateForDisplay(timeFrameStartDate)}
                            </Form.Text>
                          )}
                        </Form.Group>

                        <Form.Group className='mb-3'>
                          <Form.Label
                            style={{ fontWeight: '500', color: colors.text }}
                          >
                            Duration
                          </Form.Label>
                          <Row className='g-2'>
                            <Col xs={7} sm={8}>
                              <Form.Control
                                type='number'
                                placeholder='Enter duration'
                                value={timeFrameDuration}
                                onChange={(e) =>
                                  setTimeFrameDuration(e.target.value)
                                }
                                min='1'
                                style={{
                                  backgroundColor: isDarkMode
                                    ? '#0a0a0a'
                                    : '#fff',
                                  color: colors.text,
                                  border: `1px solid ${colors.border}`,
                                  borderRadius: '6px',
                                  padding: '10px 12px',
                                }}
                              />
                            </Col>
                            <Col xs={5} sm={4}>
                              <Form.Select
                                value={timeFrameDurationType}
                                onChange={(e) =>
                                  setTimeFrameDurationType(e.target.value)
                                }
                                style={{
                                  backgroundColor: isDarkMode
                                    ? '#0a0a0a'
                                    : '#fff',
                                  color: colors.text,
                                  border: `1px solid ${colors.border}`,
                                  borderRadius: '6px',
                                  padding: '10px 12px',
                                }}
                              >
                                <option value='days'>Days</option>
                                <option value='months'>Months</option>
                              </Form.Select>
                            </Col>
                          </Row>
                          <Form.Text className='text-muted'>
                            How long should this time frame last?
                          </Form.Text>
                        </Form.Group>

                        {/* Notes for time frame */}
                        <Form.Group className='mb-3'>
                          <Form.Label
                            style={{ fontWeight: '500', color: colors.text }}
                          >
                            Notes (Optional)
                          </Form.Label>
                          <Form.Control
                            as='textarea'
                            rows={2}
                            placeholder='Add notes about this time frame setting'
                            value={timeFrameNotes}
                            onChange={(e) => setTimeFrameNotes(e.target.value)}
                            style={{
                              backgroundColor: isDarkMode ? '#0a0a0a' : '#fff',
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '6px',
                              padding: '10px 12px',
                            }}
                          />
                        </Form.Group>

                        {/* Save button */}
                        {timeFrameStartDate && timeFrameDuration && (
                          <div className='d-flex gap-2 mb-3'>
                            <Button
                              variant='success'
                              size='sm'
                              onClick={() =>
                                handleSaveTimeFrame(
                                  user?.timeFrame?.startDate ? true : false
                                )
                              }
                              disabled={savingTimeFrame}
                              style={{
                                borderRadius: '6px',
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              {savingTimeFrame ? (
                                <>
                                  <span
                                    className='spinner-border spinner-border-sm'
                                    role='status'
                                    aria-hidden='true'
                                  ></span>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <FaPlus />
                                  {user?.timeFrame?.startDate
                                    ? 'Update Time Frame'
                                    : 'Set Time Frame'}
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {/* History button */}
                        <div className='d-flex gap-2 align-items-center'>
                          <Button
                            variant='outline-info'
                            size='sm'
                            onClick={() => setShowTimeFrameHistory(true)}
                            style={{
                              borderRadius: '6px',
                              padding: '6px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <FaHistory />
                            View History
                            {timeFrameHistory?.timeFrameHistory?.length > 0 && (
                              <Badge bg='info' style={{ marginLeft: '4px' }}>
                                {timeFrameHistory.timeFrameHistory.length}
                              </Badge>
                            )}
                          </Button>
                        </div>
                      </div>
                    </Col>

                    <Col lg={6} md={12}>
                      {timeFrameEndDate ? (
                        <div
                          style={{
                            backgroundColor: isWithinTimeFrame
                              ? isDarkMode
                                ? 'rgba(40, 167, 69, 0.1)'
                                : 'rgba(40, 167, 69, 0.05)'
                              : isDarkMode
                              ? 'rgba(108, 117, 125, 0.1)'
                              : 'rgba(108, 117, 125, 0.05)',
                            padding: '20px',
                            borderRadius: '8px',
                            border: `1px solid ${
                              isWithinTimeFrame ? '#28a745' : colors.border
                            }`,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                          }}
                        >
                          <h6
                            style={{
                              color: colors.text,
                              marginBottom: '16px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <FaInfoCircle
                              style={{
                                color: isWithinTimeFrame
                                  ? '#28a745'
                                  : '#6c757d',
                              }}
                            />
                            Time Frame Status
                          </h6>

                          <div className='mb-3'>
                            <strong
                              style={{ color: colors.text, fontSize: '0.9rem' }}
                            >
                              End Date:
                            </strong>
                            <div
                              style={{
                                color: isWithinTimeFrame
                                  ? '#28a745'
                                  : colors.accent,
                                fontSize: '1.2em',
                                fontWeight: '600',
                                marginTop: '4px',
                              }}
                            >
                              {formatDateForDisplay(timeFrameEndDate)}
                            </div>
                            <div
                              style={{
                                fontSize: '0.85rem',
                                color: isDarkMode ? '#a0aec0' : '#6c757d',
                                marginTop: '2px',
                              }}
                            >
                              {new Date(timeFrameEndDate).toLocaleDateString(
                                'en-US',
                                {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                }
                              )}
                            </div>
                          </div>

                          <div className='mb-3'>
                            <strong
                              style={{ color: colors.text, fontSize: '0.9rem' }}
                            >
                              Current Status:
                            </strong>
                            <div className='mt-2'>
                              <Badge
                                bg={isWithinTimeFrame ? 'success' : 'secondary'}
                                style={{
                                  fontSize: '0.9em',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                }}
                              >
                                {isWithinTimeFrame
                                  ? '✓ Within Time Frame'
                                  : '✗ Outside Time Frame'}
                              </Badge>
                            </div>
                          </div>

                          {timeFrameStartDate && timeFrameDuration && (
                            <div
                              style={{
                                backgroundColor: isDarkMode
                                  ? 'rgba(255, 255, 255, 0.05)'
                                  : 'rgba(0, 0, 0, 0.05)',
                                padding: '12px',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                              }}
                            >
                              <strong style={{ color: colors.text }}>
                                Time Info:
                              </strong>
                              <div
                                style={{
                                  color: isDarkMode ? '#cbd5e0' : '#4a5568',
                                  marginTop: '4px',
                                }}
                              >
                                {(() => {
                                  const now = new Date();
                                  const start = new Date(timeFrameStartDate);
                                  const end = new Date(timeFrameEndDate);

                                  if (now < start) {
                                    const daysUntilStart = Math.ceil(
                                      (start - now) / (1000 * 60 * 60 * 24)
                                    );
                                    return `Starts in ${daysUntilStart} day${
                                      daysUntilStart !== 1 ? 's' : ''
                                    }`;
                                  } else if (now > end) {
                                    const daysSinceEnd = Math.ceil(
                                      (now - end) / (1000 * 60 * 60 * 24)
                                    );
                                    return `Ended ${daysSinceEnd} day${
                                      daysSinceEnd !== 1 ? 's' : ''
                                    } ago`;
                                  } else {
                                    const daysRemaining = Math.ceil(
                                      (end - now) / (1000 * 60 * 60 * 24)
                                    );
                                    if (
                                      timeFrameDurationType === 'months' &&
                                      daysRemaining > 30
                                    ) {
                                      const monthsRemaining = Math.ceil(
                                        daysRemaining / 30
                                      );
                                      return `${monthsRemaining} month${
                                        monthsRemaining !== 1 ? 's' : ''
                                      } remaining (${daysRemaining} days)`;
                                    }
                                    return `${daysRemaining} day${
                                      daysRemaining !== 1 ? 's' : ''
                                    } remaining`;
                                  }
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            backgroundColor: colors.cardHeaderBg,
                            padding: '20px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                          }}
                        >
                          <FaClock
                            style={{
                              fontSize: '3rem',
                              color: isDarkMode ? '#4a5568' : '#a0aec0',
                              marginBottom: '16px',
                              opacity: 0.5,
                            }}
                          />
                          <h6
                            style={{ color: colors.text, marginBottom: '8px' }}
                          >
                            No Time Frame Set
                          </h6>
                          <p
                            style={{
                              color: isDarkMode ? '#a0aec0' : '#6c757d',
                              fontSize: '0.9rem',
                              margin: 0,
                            }}
                          >
                            Set a start date and duration to see the calculated
                            end date and status.
                          </p>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <div
                style={{
                  textAlign: 'center',
                  marginTop: '24px',
                  padding: '20px',
                  backgroundColor: colors.cardHeaderBg,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                }}
              >
                <Button
                  type='submit'
                  variant='primary'
                  size={isMobile ? 'lg' : 'lg'}
                  style={{
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                    padding: isMobile ? '12px 32px' : '14px 48px',
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    fontWeight: '600',
                    borderRadius: '8px',
                    boxShadow: isDarkMode
                      ? '0 4px 12px rgba(139, 92, 246, 0.3)'
                      : '0 2px 8px rgba(139, 92, 246, 0.2)',
                    transition: 'all 0.2s ease',
                    minWidth: isMobile ? '200px' : '250px',
                  }}
                  disabled={loadingUpdate}
                >
                  {loadingUpdate ? (
                    <>
                      <span
                        className='spinner-border spinner-border-sm me-2'
                        role='status'
                        aria-hidden='true'
                      ></span>
                      Updating User...
                    </>
                  ) : (
                    <>
                      <FaUserCheck className='me-2' />
                      Update User
                    </>
                  )}
                </Button>
              </div>
            </Form>

            {/* Password Management Section */}
            <Card className='mt-4 mb-4'>
              <Card.Body>
                <Card.Title>
                  <FaUserShield className='me-2 text-danger' /> Password
                  Management
                </Card.Title>
                <Form onSubmit={handlePasswordUpdate}>
                  <Form.Group className='my-3' controlId='password'>
                    <Form.Label>Set New Password</Form.Label>
                    <Form.Control
                      type='password'
                      placeholder='Enter new password'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    ></Form.Control>
                    <Form.Text className='text-muted'>
                      Password must be at least 6 characters long
                    </Form.Text>
                  </Form.Group>
                  <Button
                    type='submit'
                    variant='danger'
                    disabled={
                      updatingPassword || !password || password.length < 6
                    }
                  >
                    {updatingPassword ? 'Updating...' : 'Reset Password'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>

            {/* Feature Flags Management Section */}
            <Card
              className='mt-4 mb-4'
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: colors.shadow,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Card.Header
                style={{
                  backgroundColor: colors.cardHeaderBg,
                  borderBottom: `1px solid ${colors.border}`,
                  padding: '16px 20px',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    color: colors.text,
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FaTags style={{ color: '#17a2b8' }} />
                  Feature Flags
                </h4>
                <p
                  className='text-muted mb-0 mt-2'
                  style={{ fontSize: '0.9rem' }}
                >
                  Control which features are available to this user
                </p>
              </Card.Header>
              <Card.Body style={{ padding: '20px' }}>
                <Form.Group className='mb-3'>
                  <div className='d-flex align-items-center justify-content-between'>
                    <div>
                      <Form.Label
                        style={{
                          fontWeight: '600',
                          color: colors.text,
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span
                          style={{
                            background:
                              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                          }}
                        >
                          🍽️ MEAL
                        </span>
                        Upload Meal Image with AI Analysis
                      </Form.Label>
                      <Form.Text className='text-muted'>
                        When enabled, users can upload meal images and get
                        AI-powered nutrition analysis in the diet tracking
                        section
                      </Form.Text>
                    </div>
                    <Form.Check
                      type='switch'
                      id='uploadMealImageSwitch'
                      checked={uploadMealImageEnabled}
                      onChange={(e) =>
                        setUploadMealImageEnabled(e.target.checked)
                      }
                      style={{
                        transform: 'scale(1.2)',
                        marginLeft: '16px',
                      }}
                    />
                  </div>
                </Form.Group>

                {uploadMealImageEnabled && (
                  <div
                    style={{
                      backgroundColor: isDarkMode
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(16, 185, 129, 0.05)',
                      border: `1px solid ${
                        isDarkMode
                          ? 'rgba(16, 185, 129, 0.3)'
                          : 'rgba(16, 185, 129, 0.2)'
                      }`,
                      borderRadius: '8px',
                      padding: '12px 16px',
                      marginTop: '12px',
                    }}
                  >
                    <div className='d-flex align-items-center gap-2 mb-2'>
                      <FaCheck
                        style={{ color: '#10b981', fontSize: '0.9rem' }}
                      />
                      <strong
                        style={{
                          color: isDarkMode ? '#34d399' : '#059669',
                          fontSize: '0.9rem',
                        }}
                      >
                        Feature Enabled
                      </strong>
                    </div>
                    <ul
                      style={{
                        color: isDarkMode ? '#a7f3d0' : '#047857',
                        fontSize: '0.85rem',
                        marginBottom: '0',
                        paddingLeft: '20px',
                      }}
                    >
                      <li>
                        User can access the "Upload Meal Image" tab in diet
                        tracking
                      </li>
                      <li>AI-powered nutrition analysis from meal photos</li>
                      <li>Camera capture and image upload functionality</li>
                      <li>
                        Smart nutrition estimation with confidence scoring
                      </li>
                    </ul>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* AI Analysis Feature Flag */}
            <Card className='mt-4'>
              <Card.Body>
                <Card.Title>
                  <FaBrain className='me-2' style={{ color: '#8B5CF6' }} />
                  🧠 AI ANALYSIS
                </Card.Title>
                <Card.Text className='text-muted'>
                  Full AI Analysis Access
                </Card.Text>

                <Form.Group className='mb-3'>
                  <div className='d-flex justify-content-between align-items-center'>
                    <div>
                      <strong>AI Analysis Access</strong>
                      <Form.Text className='text-muted'>
                        When enabled, users can access the full AI analysis screen with comprehensive data analysis
                      </Form.Text>
                    </div>
                    <Form.Check
                      type='switch'
                      id='aiAnalysisSwitch'
                      checked={aiAnalysisEnabled}
                      onChange={(e) =>
                        setAiAnalysisEnabled(e.target.checked)
                      }
                      style={{
                        transform: 'scale(1.2)',
                        marginLeft: '16px',
                      }}
                    />
                  </div>
                </Form.Group>

                {aiAnalysisEnabled && (
                  <div
                    style={{
                      backgroundColor: isDarkMode
                        ? 'rgba(139, 92, 246, 0.1)'
                        : 'rgba(139, 92, 246, 0.05)',
                      border: `1px solid ${
                        isDarkMode
                          ? 'rgba(139, 92, 246, 0.3)'
                          : 'rgba(139, 92, 246, 0.2)'
                      }`,
                      borderRadius: '8px',
                      padding: '12px 16px',
                      marginTop: '12px',
                    }}
                  >
                    <div className='d-flex align-items-center gap-2 mb-2'>
                      <FaCheck
                        style={{ color: '#8B5CF6', fontSize: '0.9rem' }}
                      />
                      <strong
                        style={{
                          color: isDarkMode ? '#c4b5fd' : '#7c3aed',
                          fontSize: '0.9rem',
                        }}
                      >
                        Feature Enabled
                      </strong>
                    </div>
                    <ul
                      style={{
                        color: isDarkMode ? '#c4b5fd' : '#7c3aed',
                        fontSize: '0.85rem',
                        marginBottom: '0',
                        paddingLeft: '20px',
                      }}
                    >
                      <li>
                        User can access the AI Analysis screen at /ai-analysis
                      </li>
                      <li>Comprehensive data analysis across all user data</li>
                      <li>AI-powered insights and recommendations</li>
                      <li>Historical analysis and trend detection</li>
                    </ul>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Debug Information - Commented out as requested */}
            {/* 
            <Card className='mt-4' style={{ 
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            }}>
              <Card.Body>
                <Card.Title style={{ fontSize: '0.9rem', color: isDarkMode ? '#fbbf24' : '#d97706' }}>
                  🔧 Debug Information
                </Card.Title>
                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  <div><strong>Current State:</strong></div>
                  <div>• uploadMealImage: {uploadMealImageEnabled.toString()}</div>
                  <div>• aiAnalysis: {aiAnalysisEnabled.toString()}</div>
                  <br />
                  <div><strong>Database Data:</strong></div>
                  <div>{JSON.stringify(user?.featureFlags, null, 2)}</div>
                  <br />
                  <div><strong>User ID:</strong> {userId}</div>
                  {currentUser && <div><strong>Current User ID:</strong> {currentUser._id}</div>}
                  <div><strong>Is Editing Self:</strong> {(currentUser && currentUser._id === userId).toString()}</div>
                </div>
                
                <div className='mt-3 d-flex gap-2'>
                  <Button 
                    size='sm' 
                    variant='outline-warning'
                    onClick={() => {
                      console.log('🔄 Force refetching user data...');
                      refetch();
                    }}
                  >
                    🔄 Force Refresh Data
                  </Button>
                  
                  <Button 
                    size='sm' 
                    variant='outline-info'
                    onClick={() => {
                      console.log('📊 Current feature flag states:', {
                        uploadMealImageEnabled,
                        aiAnalysisEnabled,
                        userFeatureFlags: user?.featureFlags,
                        currentUserFlags: currentUser?.featureFlags
                      });
                    }}
                  >
                    📊 Log States
                  </Button>
                </div>
              </Card.Body>
            </Card>
            */}

            {/* Accessed Collections with Code Section */}
            <Card className='mt-4'>
              <Card.Body>
                <div className='d-flex justify-content-between align-items-center mb-3'>
                  <Card.Title>
                    <FaKey className='me-2 text-warning' /> Collections Accessed
                    with Code
                  </Card.Title>
                </div>

                {!user?.accessedCollections ||
                user.accessedCollections.length === 0 ? (
                  <Message>
                    This user hasn't accessed any collections with codes yet.
                  </Message>
                ) : (
                  <Table striped bordered hover responsive className='table-sm'>
                    <thead>
                      <tr>
                        <th>COLLECTION</th>
                        <th>FIRST ACCESSED</th>
                        <th>LAST ACCESSED</th>
                        <th>ACCESS COUNT</th>
                        <th>ACCESS TYPE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.accessedCollections
                        .filter((collection) => collection.accessedWithCode)
                        .map((collection) => (
                          <tr key={collection.collectionId}>
                            <td>
                              <Link
                                to={`/admin/collection/${collection.collectionId}/edit`}
                              >
                                {collection.name}
                              </Link>
                            </td>
                            <td>
                              {new Date(
                                collection.firstAccessedAt
                              ).toLocaleDateString()}
                            </td>
                            <td>
                              {new Date(
                                collection.lastAccessedAt
                              ).toLocaleDateString()}
                            </td>
                            <td>{collection.accessCount}</td>
                            <td>
                              {collection.accessedWithCode ? (
                                <Badge bg='warning' text='dark'>
                                  <FaKey className='me-1' /> With Code
                                </Badge>
                              ) : (
                                <Badge bg='info'>
                                  <FaUnlock className='me-1' /> Regular Access
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>

            {/* User-Assigned Collections Section */}
            <Card
              className='mt-4'
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: colors.shadow,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Card.Header
                style={{
                  backgroundColor: colors.cardHeaderBg,
                  borderBottom: `1px solid ${colors.border}`,
                  padding: '16px 20px',
                }}
              >
                <div className='d-flex justify-content-between align-items-center'>
                  <h4
                    style={{
                      margin: 0,
                      color: colors.text,
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <FaUserCheck style={{ color: colors.accent }} />
                    Assigned Collections
                  </h4>
                  <div>
                    <Button
                      onClick={() => setShowRemoveAllModal(true)}
                      variant='danger'
                      size='sm'
                      className='me-2'
                      style={{
                        backgroundColor: '#e53e3e',
                        borderColor: 'transparent',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px 12px',
                      }}
                    >
                      <FaTrash size={12} /> Remove All Collections
                    </Button>
                    <Button
                      onClick={() => setShowBatchModal(true)}
                      variant='success'
                      size='sm'
                      className='me-2'
                      style={{
                        backgroundColor: '#38a169',
                        borderColor: 'transparent',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px 12px',
                      }}
                    >
                      <FaPlus size={12} /> Batch Assign
                    </Button>
                    <Button
                      onClick={() => setShowAssignModal(true)}
                      variant='primary'
                      size='sm'
                      style={{
                        backgroundColor: colors.buttonPrimary,
                        borderColor: 'transparent',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px 12px',
                      }}
                    >
                      <FaPlus size={12} /> Assign Collection
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body
                style={{
                  padding: '20px',
                  color: colors.text,
                }}
              >
                {/* Filters */}
                <Row className='mb-4'>
                  <Col md={6} lg={4}>
                    <InputGroup
                      style={{
                        marginBottom: isMobile ? '12px' : '0',
                      }}
                    >
                      <InputGroup.Text
                        style={{
                          backgroundColor: colors.inputBg,
                          border: `1px solid ${colors.border}`,
                          borderRight: 'none',
                          borderRadius: '8px 0 0 8px',
                          padding: '10px',
                        }}
                      >
                        <FaSearch color={isDarkMode ? '#94a3b8' : '#64748b'} />
                      </InputGroup.Text>
                      <Form.Control
                        type='text'
                        placeholder='Search collections...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          backgroundColor: colors.inputBg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          borderLeft: 'none',
                          borderRadius: '0 8px 8px 0',
                          padding: '10px',
                        }}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={6} lg={3}>
                    <InputGroup>
                      <InputGroup.Text
                        style={{
                          backgroundColor: colors.inputBg,
                          border: `1px solid ${colors.border}`,
                          borderRight: 'none',
                          borderRadius: '8px 0 0 8px',
                          padding: '10px',
                        }}
                      >
                        <FaFilter color={isDarkMode ? '#94a3b8' : '#64748b'} />
                      </InputGroup.Text>
                      <Form.Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                          backgroundColor: colors.inputBg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          borderLeft: 'none',
                          borderRadius: '0 8px 8px 0',
                          padding: '10px',
                        }}
                      >
                        <option value='all'>All Status</option>
                        <option value='active'>Active</option>
                        <option value='archived'>Archived</option>
                      </Form.Select>
                    </InputGroup>
                  </Col>
                </Row>

                {!filteredCollections || filteredCollections.length === 0 ? (
                  <div
                    style={{
                      padding: '30px 20px',
                      textAlign: 'center',
                      backgroundColor: colors.cardHeaderBg,
                      borderRadius: '8px',
                    }}
                  >
                    <FaLayerGroup
                      size={32}
                      style={{
                        color: isDarkMode ? '#4a5568' : '#a0aec0',
                        marginBottom: '16px',
                      }}
                    />
                    <p style={{ color: colors.text, marginBottom: '0' }}>
                      This user has no assigned collections
                    </p>
                  </div>
                ) : !isMobile ? (
                  // Desktop table view
                  <div
                    style={{
                      overflowX: 'auto',
                      backgroundColor: colors.tableBg,
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <Table
                      responsive
                      style={{
                        marginBottom: 0,
                        color: colors.text,
                      }}
                    >
                      <thead
                        style={{
                          backgroundColor: colors.tableHeaderBg,
                          borderBottom: `1px solid ${colors.border}`,
                        }}
                      >
                        <tr>
                          <th
                            style={{
                              padding: '14px',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                            }}
                          >
                            COLLECTION
                          </th>
                          <th
                            style={{
                              padding: '14px',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                            }}
                          >
                            ASSIGNED DATE
                          </th>
                          <th
                            style={{
                              padding: '14px',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                            }}
                          >
                            LAST ACCESSED
                          </th>
                          <th
                            style={{
                              padding: '14px',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                              textAlign: 'center',
                            }}
                          >
                            VIEWS
                          </th>
                          <th
                            style={{
                              padding: '14px',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                            }}
                          >
                            TAGS
                          </th>
                          <th
                            style={{
                              padding: '14px',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                              textAlign: 'center',
                            }}
                          >
                            STATUS
                          </th>
                          <th
                            style={{
                              padding: '14px',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                              textAlign: 'center',
                            }}
                          >
                            ACTIONS
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCollections.map((collection) => (
                          <tr key={collection.collectionId}>
                            <td
                              style={{
                                padding: '14px',
                                verticalAlign: 'middle',
                              }}
                            >
                              <Link
                                to={`/admin/collection/${collection.collectionId}/edit`}
                                onClick={() =>
                                  handleTrackAccess(collection.collectionId)
                                }
                                style={{
                                  fontWeight: '500',
                                  color: colors.text,
                                  textDecoration: 'none',
                                }}
                              >
                                {collection.name}
                              </Link>
                            </td>
                            <td
                              style={{
                                padding: '14px',
                                verticalAlign: 'middle',
                                fontSize: '0.9rem',
                              }}
                            >
                              {new Date(
                                collection.assignedAt
                              ).toLocaleDateString()}
                            </td>
                            <td
                              style={{
                                padding: '14px',
                                verticalAlign: 'middle',
                                fontSize: '0.9rem',
                              }}
                            >
                              {collection.lastAccessedAt
                                ? new Date(
                                    collection.lastAccessedAt
                                  ).toLocaleDateString()
                                : 'Never'}
                            </td>
                            <td
                              style={{
                                padding: '14px',
                                verticalAlign: 'middle',
                                textAlign: 'center',
                              }}
                            >
                              <Badge
                                bg='info'
                                style={{
                                  fontSize: '0.85rem',
                                  padding: '5px 10px',
                                }}
                              >
                                {collection.accessCount || 0}
                              </Badge>
                            </td>
                            <td
                              style={{
                                padding: '14px',
                                verticalAlign: 'middle',
                              }}
                            >
                              {collection.tags?.map((tag) => (
                                <Badge
                                  key={tag}
                                  bg='info'
                                  className='me-1 mb-1'
                                  style={{ fontSize: '0.8rem' }}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </td>
                            <td
                              style={{
                                padding: '14px',
                                verticalAlign: 'middle',
                                textAlign: 'center',
                              }}
                            >
                              <Badge
                                bg={
                                  collection.status === 'active'
                                    ? 'success'
                                    : 'secondary'
                                }
                              >
                                {collection.status}
                              </Badge>
                            </td>
                            <td
                              style={{
                                padding: '14px',
                                verticalAlign: 'middle',
                                textAlign: 'center',
                              }}
                            >
                              <div className='d-flex justify-content-center gap-2'>
                                <Button
                                  variant='light'
                                  size='sm'
                                  onClick={() => {
                                    setEditingCollection(collection);
                                    setCollectionNotes(collection.notes || '');
                                    setCollectionTags(
                                      collection.tags?.join(', ') || ''
                                    );
                                    setCollectionStatus(collection.status);
                                    setShowEditModal(true);
                                  }}
                                >
                                  <FaEdit size={14} />
                                </Button>
                                <Button
                                  variant='danger'
                                  size='sm'
                                  onClick={() =>
                                    handleRemoveAssignedCollection(
                                      collection.collectionId
                                    )
                                  }
                                >
                                  <FaArchive size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  // Mobile card view
                  <div>
                    {filteredCollections.map((collection) =>
                      renderCollectionCard(collection)
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Enhanced User Contact Tracking Section */}
            <Row className='mt-4'>
              <Col lg={6}>
                <ContactForm
                  userId={userId}
                  isDarkMode={isDarkMode}
                  onContactAdded={handleContactAdded}
                />
              </Col>
              <Col lg={6}>
                <ContactHistory
                  userId={userId}
                  isDarkMode={isDarkMode}
                  maxHeight='500px'
                  limit={15}
                  refreshTrigger={contactHistoryRefreshTrigger}
                />
              </Col>
            </Row>
            {/* End Enhanced User Contact Tracking Section */}

            <Row className='my-4'>
              <Col>
                <Card>
                  <Card.Header>
                    <FaInfoCircle /> Admin Notes
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group controlId='adminNote'>
                        <Form.Label>Add a new note</Form.Label>
                        <Form.Control
                          as='textarea'
                          rows={3}
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder='Enter a note about the user...'
                        ></Form.Control>
                      </Form.Group>
                      <Button
                        className='mt-2'
                        onClick={handleAddAdminNote}
                        disabled={isAddingAdminNote}
                      >
                        {isAddingAdminNote ? 'Adding...' : 'Add Note'}
                      </Button>
                    </Form>
                    <hr />
                    <h5>Notes History</h5>
                    <div className='mt-3'>
                      {user?.adminNotes && user.adminNotes.length > 0 ? (
                        user.adminNotes
                          .slice()
                          .reverse()
                          .map((note) => (
                            <div
                              key={note._id}
                              className='mb-3 p-3 rounded shadow-sm'
                              style={{
                                backgroundColor: 'var(--admin-card-bg)',
                              }}
                            >
                              <div className='d-flex justify-content-between align-items-start'>
                                <p
                                  className='mb-1 flex-grow-1'
                                  style={{ fontSize: '1.1rem' }}
                                >
                                  {note.note}
                                </p>
                                <Button
                                  variant='link'
                                  className='text-danger p-0 ms-3'
                                  title='Delete Note'
                                  onClick={() =>
                                    handleDeleteAdminNote(note._id)
                                  }
                                  disabled={isDeletingAdminNote}
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                              <small
                                className='text-muted'
                                style={{ fontSize: '0.75rem' }}
                              >
                                Added by{' '}
                                <strong>
                                  {note.createdBy?.name || 'an admin'}
                                </strong>{' '}
                                on {new Date(note.createdAt).toLocaleString()}
                              </small>
                            </div>
                          ))
                      ) : (
                        <Message variant='info'>No admin notes found.</Message>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <QuizReport userId={userId} user={user} />
          </>
        )}
      {/* </FormContainer> */}

      {/* Add Progress Images Section */}
      <Row className="mt-4">
        <Col>
          <ProgressImageSection />
        </Col>
      </Row>

      {/* Modal for adding a collection to user */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Collection to User</Modal.Title>
        </Modal.Header>
        <Modal.Body>{/* Add collection form content here */}</Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant='primary' onClick={handleAddCollection}>
            Add Collection
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for assigning a single collection */}
      <Modal
        show={showAssignModal}
        onHide={() => {
          setShowAssignModal(false);
          setCollectionToAssign('');
          setCollectionSearchTerm('');
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Assign Collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className='mb-3'>
            <Form.Label>Search Collections</Form.Label>
            <Form.Control
              type='text'
              placeholder='Search collections...'
              value={collectionSearchTerm}
              onChange={(e) => setCollectionSearchTerm(e.target.value)}
            />
          </Form.Group>
          <Form.Group className='mb-3'>
            <Form.Label>Select Collection</Form.Label>
            <Form.Select
              value={collectionToAssign}
              onChange={(e) => setCollectionToAssign(e.target.value)}
            >
              <option value=''>Choose a collection...</option>
              {collections
                .filter(
                  (collection) =>
                    !collectionSearchTerm ||
                    collection.name
                      .toLowerCase()
                      .includes(collectionSearchTerm.toLowerCase())
                )
                .filter(
                  (collection) => !isCollectionAssignedToUser(collection._id)
                )
                .map((collection) => {
                  // Determine visibility text for option
                  const getVisibilityText = (collection) => {
                    if (collection.requiresCode) {
                      return ' [Code Required]';
                    } else if (collection.isPublic) {
                      return ' [Public]';
                    } else {
                      return ' [Private]';
                    }
                  };

                  return (
                    <option key={collection._id} value={collection._id}>
                      {collection.name}
                      {getVisibilityText(collection)}
                    </option>
                  );
                })}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant='secondary'
            onClick={() => {
              setShowAssignModal(false);
              setCollectionToAssign('');
              setCollectionSearchTerm('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={handleAssignCollection}
            disabled={!collectionToAssign}
          >
            Assign Collection
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for batch assigning collections */}
      <Modal
        show={showBatchModal}
        onHide={() => {
          setShowBatchModal(false);
          setSelectedCollections([]);
          setBatchCollectionSearchTerm('');
        }}
        size='lg'
      >
        <Modal.Header closeButton>
          <Modal.Title>Batch Assign Collections</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className='mb-3'>
            <Form.Label>Search Collections</Form.Label>
            <Form.Control
              type='text'
              placeholder='Search collections...'
              value={batchCollectionSearchTerm}
              onChange={(e) => setBatchCollectionSearchTerm(e.target.value)}
            />
          </Form.Group>
          <Form.Group className='mb-3'>
            <Form.Label>
              Select Collections (hold Ctrl/Cmd to select multiple)
            </Form.Label>
            <div
              style={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #dee2e6',
                borderRadius: '0.375rem',
                padding: '0.5rem',
              }}
            >
              {collections
                .filter(
                  (collection) =>
                    !batchCollectionSearchTerm ||
                    collection.name
                      .toLowerCase()
                      .includes(batchCollectionSearchTerm.toLowerCase())
                )
                .filter(
                  (collection) => !isCollectionAssignedToUser(collection._id)
                )
                .map((collection) => {
                  // Determine visibility status
                  const getVisibilityBadge = (collection) => {
                    if (collection.requiresCode) {
                      return (
                        <span
                          className='badge bg-warning text-dark ms-2'
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          Code Required
                        </span>
                      );
                    } else if (collection.isPublic) {
                      return (
                        <span
                          className='badge bg-success ms-2'
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          Public
                        </span>
                      );
                    } else {
                      return (
                        <span
                          className='badge bg-secondary ms-2'
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          Private
                        </span>
                      );
                    }
                  };

                  return (
                    <Form.Check
                      key={collection._id}
                      type='checkbox'
                      id={`batch-${collection._id}`}
                      label={
                        <div className='d-flex align-items-center justify-content-between w-100'>
                          <span>{collection.name}</span>
                          {getVisibilityBadge(collection)}
                        </div>
                      }
                      checked={selectedCollections.includes(collection._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCollections([
                            ...selectedCollections,
                            collection._id,
                          ]);
                        } else {
                          setSelectedCollections(
                            selectedCollections.filter(
                              (id) => id !== collection._id
                            )
                          );
                        }
                      }}
                      className='mb-2'
                    />
                  );
                })}
            </div>
          </Form.Group>
          <Form.Text className='text-muted'>
            Selected: {selectedCollections.length} collection(s)
          </Form.Text>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant='secondary'
            onClick={() => {
              setShowBatchModal(false);
              setSelectedCollections([]);
              setBatchCollectionSearchTerm('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={handleBatchAssign}
            disabled={selectedCollections.length === 0}
          >
            Assign {selectedCollections.length} Collection(s)
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for editing collection assignment */}
      <Modal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setEditingCollection(null);
          setCollectionNotes('');
          setCollectionTags('');
          setCollectionStatus('active');
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Collection Assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingCollection && (
            <>
              <h5>{editingCollection.name}</h5>
              <Form.Group className='mb-3'>
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as='textarea'
                  rows={3}
                  value={collectionNotes}
                  onChange={(e) => setCollectionNotes(e.target.value)}
                  placeholder='Add notes about this collection assignment...'
                />
              </Form.Group>
              <Form.Group className='mb-3'>
                <Form.Label>Tags (comma-separated)</Form.Label>
                <Form.Control
                  type='text'
                  value={collectionTags}
                  onChange={(e) => setCollectionTags(e.target.value)}
                  placeholder='tag1, tag2, tag3'
                />
              </Form.Group>
              <Form.Group className='mb-3'>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={collectionStatus}
                  onChange={(e) => setCollectionStatus(e.target.value)}
                >
                  <option value='active'>Active</option>
                  <option value='archived'>Archived</option>
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant='secondary'
            onClick={() => {
              setShowEditModal(false);
              setEditingCollection(null);
              setCollectionNotes('');
              setCollectionTags('');
              setCollectionStatus('active');
            }}
          >
            Cancel
          </Button>
          <Button variant='primary' onClick={handleEditCollection}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Time Frame History Modal */}
      <Modal
        show={showTimeFrameHistory}
        onHide={() => setShowTimeFrameHistory(false)}
        size='xl'
        scrollable
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: colors.cardHeaderBg,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <Modal.Title
            style={{
              color: colors.text,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <FaHistory style={{ color: colors.accent }} />
            Time Frame History - Complete Audit Trail
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{ backgroundColor: colors.background, padding: '0' }}
        >
          {timeFrameHistory &&
          timeFrameHistory.timeFrameHistory &&
          timeFrameHistory.timeFrameHistory.length > 0 ? (
            <div style={{ padding: '20px' }}>
              <div
                className='mb-3 p-3 rounded'
                style={{
                  backgroundColor: isDarkMode
                    ? 'rgba(139, 92, 246, 0.1)'
                    : 'rgba(139, 92, 246, 0.05)',
                  border: `1px solid ${
                    isDarkMode
                      ? 'rgba(139, 92, 246, 0.3)'
                      : 'rgba(139, 92, 246, 0.2)'
                  }`,
                }}
              >
                <div className='d-flex align-items-center gap-2 mb-2'>
                  <FaShieldAlt style={{ color: colors.accent }} />
                  <strong style={{ color: colors.text }}>
                    Audit Trail Protection
                  </strong>
                </div>
                <p
                  style={{
                    color: isDarkMode ? '#cbd5e0' : '#4a5568',
                    margin: 0,
                    fontSize: '0.9rem',
                  }}
                >
                  This history is <strong>permanently protected</strong> and
                  cannot be deleted. All time frame changes are automatically
                  recorded for complete audit compliance.
                </p>
              </div>

              <div className='timeline'>
                {timeFrameHistory.timeFrameHistory
                  .slice()
                  .sort((a, b) => new Date(b.setAt) - new Date(a.setAt))
                  .map((entry, index) => {
                    const isActive = entry.isActive;
                    const wasReplaced = entry.replacedAt && entry.replacedBy;
                    const startDate = new Date(entry.startDate);
                    const endDate = new Date(entry.endDate);
                    const setAt = new Date(entry.setAt);
                    const now = new Date();

                    // Determine the status of this time frame
                    let timeFrameStatus;
                    let statusColor;
                    let statusIcon;

                    if (isActive) {
                      if (now >= startDate && now <= endDate) {
                        timeFrameStatus = 'Currently Active & Within Range';
                        statusColor = '#28a745';
                        statusIcon = FaCheck;
                      } else if (now < startDate) {
                        timeFrameStatus = 'Currently Active & Pending Start';
                        statusColor = '#17a2b8';
                        statusIcon = FaClock;
                      } else {
                        timeFrameStatus = 'Currently Active & Expired';
                        statusColor = '#ffc107';
                        statusIcon = FaInfoCircle;
                      }
                    } else if (wasReplaced) {
                      timeFrameStatus = 'Replaced/Overridden';
                      statusColor = '#6f42c1';
                      statusIcon = FaEdit;
                    } else {
                      timeFrameStatus = 'Completed';
                      statusColor = '#6c757d';
                      statusIcon = FaArchive;
                    }

                    const StatusIcon = statusIcon;

                    return (
                      <div
                        key={entry._id || index}
                        className='timeline-item mb-4'
                        style={{
                          position: 'relative',
                          paddingLeft: '50px',
                          borderLeft:
                            index ===
                            timeFrameHistory.timeFrameHistory.length - 1
                              ? 'none'
                              : `2px solid ${colors.border}`,
                          paddingBottom: '20px',
                        }}
                      >
                        {/* Timeline dot */}
                        <div
                          style={{
                            position: 'absolute',
                            left: '-10px',
                            top: '10px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: statusColor,
                            border: `3px solid ${colors.background}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: colors.shadow,
                          }}
                        >
                          <StatusIcon
                            style={{
                              color: 'white',
                              fontSize: '8px',
                            }}
                          />
                        </div>

                        {/* Timeline content */}
                        <div
                          className='timeline-content p-3 rounded'
                          style={{
                            backgroundColor: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                            boxShadow: colors.shadow,
                            marginLeft: '10px',
                          }}
                        >
                          {/* Header with status */}
                          <div className='d-flex justify-content-between align-items-start mb-3'>
                            <div>
                              <h6
                                style={{
                                  color: colors.text,
                                  marginBottom: '5px',
                                  fontWeight: '600',
                                }}
                              >
                                Time Frame #
                                {timeFrameHistory.timeFrameHistory.length -
                                  index}
                              </h6>
                              <Badge
                                style={{
                                  backgroundColor: statusColor,
                                  color: 'white',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                }}
                              >
                                <StatusIcon
                                  className='me-1'
                                  style={{ fontSize: '0.8rem' }}
                                />
                                {timeFrameStatus}
                              </Badge>
                            </div>
                            <small
                              style={{
                                color: isDarkMode ? '#a0aec0' : '#6c757d',
                                fontWeight: '500',
                              }}
                            >
                              {setAt.toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </small>
                          </div>

                          {/* Time Frame Details */}
                          <Row>
                            <Col md={6}>
                              <div className='mb-2'>
                                <strong
                                  style={{
                                    color: colors.text,
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  <FaCalendarAlt
                                    className='me-2'
                                    style={{ color: colors.accent }}
                                  />
                                  Date Range:
                                </strong>
                                <div
                                  style={{
                                    color: isDarkMode ? '#cbd5e0' : '#4a5568',
                                    marginTop: '4px',
                                  }}
                                >
                                  <div>
                                    {startDate.toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.85rem',
                                      opacity: 0.8,
                                    }}
                                  >
                                    to
                                  </div>
                                  <div>
                                    {endDate.toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </div>
                                </div>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className='mb-2'>
                                <strong
                                  style={{
                                    color: colors.text,
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  <FaClock
                                    className='me-2'
                                    style={{ color: colors.accent }}
                                  />
                                  Duration:
                                </strong>
                                <div
                                  style={{
                                    color: isDarkMode ? '#cbd5e0' : '#4a5568',
                                    marginTop: '4px',
                                  }}
                                >
                                  {entry.duration} {entry.durationType}
                                  <div
                                    style={{
                                      fontSize: '0.85rem',
                                      opacity: 0.8,
                                    }}
                                  >
                                    (
                                    {Math.ceil(
                                      (endDate - startDate) /
                                        (1000 * 60 * 60 * 24)
                                    )}{' '}
                                    days total)
                                  </div>
                                </div>
                              </div>
                            </Col>
                          </Row>

                          {/* Admin Info */}
                          <div className='mb-2'>
                            <strong
                              style={{ color: colors.text, fontSize: '0.9rem' }}
                            >
                              <FaUserShield
                                className='me-2'
                                style={{ color: colors.accent }}
                              />
                              Set by Admin:
                            </strong>
                            <div
                              style={{
                                color: isDarkMode ? '#cbd5e0' : '#4a5568',
                                marginTop: '4px',
                              }}
                            >
                              {entry.setBy && typeof entry.setBy === 'object'
                                ? `${entry.setBy.name || 'Unknown Admin'} (${
                                    entry.setBy.email || entry.setBy._id
                                  })`
                                : `Admin ID: ${entry.setBy}`}{' '}
                              at {setAt.toLocaleString()}
                            </div>
                          </div>

                          {/* Notes */}
                          {entry.notes && (
                            <div className='mb-2'>
                              <strong
                                style={{
                                  color: colors.text,
                                  fontSize: '0.9rem',
                                }}
                              >
                                <FaClipboardCheck
                                  className='me-2'
                                  style={{ color: colors.accent }}
                                />
                                Notes:
                              </strong>
                              <div
                                style={{
                                  color: isDarkMode ? '#cbd5e0' : '#4a5568',
                                  marginTop: '4px',
                                  fontStyle: 'italic',
                                  backgroundColor: isDarkMode
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'rgba(0, 0, 0, 0.05)',
                                  padding: '8px',
                                  borderRadius: '4px',
                                }}
                              >
                                "{entry.notes}"
                              </div>
                            </div>
                          )}

                          {/* Replacement Info */}
                          {wasReplaced && (
                            <div
                              className='mt-3 p-2 rounded'
                              style={{
                                backgroundColor: isDarkMode
                                  ? 'rgba(108, 92, 231, 0.1)'
                                  : 'rgba(108, 92, 231, 0.05)',
                                border: `1px solid ${
                                  isDarkMode
                                    ? 'rgba(108, 92, 231, 0.3)'
                                    : 'rgba(108, 92, 231, 0.2)'
                                }`,
                              }}
                            >
                              <small
                                style={{
                                  color: isDarkMode ? '#b794f6' : '#6b46c1',
                                }}
                              >
                                <FaEdit className='me-1' />
                                <strong>Replaced on:</strong>{' '}
                                {new Date(entry.replacedAt).toLocaleString()}
                                <br />
                                <strong>Replaced by:</strong>{' '}
                                {entry.replacedBy &&
                                typeof entry.replacedBy === 'object'
                                  ? `${
                                      entry.replacedBy.name || 'Unknown Admin'
                                    } (${
                                      entry.replacedBy.email ||
                                      entry.replacedBy._id
                                    })`
                                  : `Admin ID: ${entry.replacedBy}`}
                              </small>
                            </div>
                          )}

                          {/* Final Status */}
                          {!isActive &&
                            entry.wasWithinTimeFrame !== undefined && (
                              <div className='mt-2'>
                                <small
                                  style={{
                                    color: isDarkMode ? '#a0aec0' : '#6c757d',
                                  }}
                                >
                                  <strong>Final Status:</strong>{' '}
                                  {entry.wasWithinTimeFrame
                                    ? 'User was within time frame when this period ended'
                                    : 'User was outside time frame when this period ended'}
                                </small>
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className='text-center p-5'>
              <FaClock
                style={{
                  fontSize: '4rem',
                  color: isDarkMode ? '#4a5568' : '#a0aec0',
                  marginBottom: '20px',
                  opacity: 0.5,
                }}
              />
              <h5 style={{ color: colors.text, marginBottom: '10px' }}>
                No Time Frame History
              </h5>
              <p
                style={{ color: isDarkMode ? '#a0aec0' : '#6c757d', margin: 0 }}
              >
                No time frames have been set for this user yet. Once you set a
                time frame, all changes will be recorded here permanently.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer
          style={{
            backgroundColor: colors.cardHeaderBg,
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          <div className='d-flex align-items-center justify-content-between w-100'>
            <div
              style={{
                color: isDarkMode ? '#a0aec0' : '#6c757d',
                fontSize: '0.9rem',
              }}
            >
              <FaShieldAlt className='me-2' style={{ color: colors.accent }} />
              This audit trail is permanently protected and cannot be modified
            </div>
            <Button
              variant='secondary'
              onClick={() => setShowTimeFrameHistory(false)}
              style={{
                borderRadius: '6px',
                padding: '8px 16px',
              }}
            >
              Close
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Add confirmation modal */}
      <Modal show={showRemoveAllModal} onHide={() => setShowRemoveAllModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Remove All Collections</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to remove all assigned collections from this user? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRemoveAllModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRemoveAllCollections}>
            Remove All
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserEditScreen;
