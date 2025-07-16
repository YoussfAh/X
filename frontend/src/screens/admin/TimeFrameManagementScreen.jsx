import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Badge,
  InputGroup,
  Modal,
  Alert,
  Dropdown,
  OverlayTrigger,
  Tooltip,
  Spinner,
  ButtonGroup,
} from 'react-bootstrap';
import {
  FaClock,
  FaSearch,
  FaFilter,
  FaSort,
  FaWhatsapp,
  FaUser,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaEye,
  FaPhoneAlt,
  FaEnvelope,
  FaCopy,
  FaShare,
  FaSync,
  FaDownload,
  FaChartBar,
  FaBell,
  FaInfoCircle,
  FaSave,
  FaTrash,
  FaPlus,
  FaBolt,
  FaMobile,
  FaDesktop,
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { showSuccessToast, showErrorToast } from '../../utils/toastConfig';
import {
  useGetTimeFrameManagementQuery,
  useSendWhatsAppContactMutation,
  useProcessMessageTemplateMutation,
  useCleanupRegularUsersMutation,
} from '../../slices/usersApiSlice';
import {
  useGetMessageTemplatesQuery,
  useCreateMessageTemplateMutation,
  useUpdateMessageTemplateMutation,
  useDeleteMessageTemplateMutation,
  useInitializeDefaultTemplatesMutation,
  useIncrementTemplateUsageMutation,
} from '../../slices/messageTemplateApiSlice';

const TimeFrameManagementScreen = () => {
  const navigate = useNavigate();

  // State variables
  const [filters, setFilters] = useState({
    timeFrameStatus: 'all',
    daysUntilExpiration: 'all',
    lastContactFilter: 'all',
    search: '',
    hasWhatsApp: 'all',
    subscriptionType: 'all',
    page: 1,
    limit: 100, // Increased limit to show all users
    sortBy: 'endDate',
    sortOrder: 'asc',
  });

  // Quick WhatsApp toggle state
  const [quickWhatsAppMode, setQuickWhatsAppMode] = useState(false);

  // Handle quick WhatsApp mode toggle with feedback
  const handleQuickModeToggle = () => {
    const newMode = !quickWhatsAppMode;
    setQuickWhatsAppMode(newMode);

    if (newMode) {
      showSuccessToast(
        '🚀 Quick Send Mode ACTIVATED! Messages will send directly to WhatsApp'
      );
    } else {
      showSuccessToast(
        '📋 Quick Send Mode DEACTIVATED! Messages will show confirmation popup'
      );
    }
  };

  // Mobile view state
  const [isMobileView, setIsMobileView] = useState(false);

  // Check screen size for mobile responsiveness
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Message Templates State
  // Database-driven templates
  const {
    data: templatesData,
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
  } = useGetMessageTemplatesQuery();

  const [createTemplate] = useCreateMessageTemplateMutation();
  const [updateTemplate] = useUpdateMessageTemplateMutation();
  const [deleteTemplate] = useDeleteMessageTemplateMutation();
  const [initializeDefaults] = useInitializeDefaultTemplatesMutation();
  const [incrementUsage] = useIncrementTemplateUsageMutation();

  // Template management state
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateMessage, setNewTemplateMessage] = useState('');
  const [newTemplateIcon, setNewTemplateIcon] = useState('💬');
  const [newTemplateCategory, setNewTemplateCategory] = useState('custom');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Get templates from API or fallback to empty array
  const messageTemplates = templatesData?.templates || [];

  // Initialize default templates if none exist
  useEffect(() => {
    if (templatesData && messageTemplates.length === 0) {
      initializeDefaults().catch(console.error);
    }
  }, [templatesData, messageTemplates.length, initializeDefaults]);

  const [oldMessageTemplates] = useState([
    {
      id: 1,
      name: '🔴 Urgent - Expiring Soon',
      message:
        "Hi [user]! ⚠️ Your subscription expires on [endDate] - only [daysUntilEnd] days left! Don't lose access to your benefits. Renew now to continue enjoying our services. 💪",
    },
    {
      id: 2,
      name: '🟡 Friendly Reminder',
      message:
        'Hello [user]! 😊 Just a friendly reminder that your subscription ends on [endDate] ([daysUntilEnd] days remaining). Would you like to renew to keep enjoying our premium features?',
    },
    {
      id: 3,
      name: '🎯 Professional Follow-up',
      message:
        "Dear [name], your subscription with us is scheduled to end on [endDate]. You have [daysUntilEnd] days remaining. Please let us know if you'd like to discuss renewal options.",
    },
    {
      id: 4,
      name: '💪 Motivational',
      message:
        "Hey [user]! 🔥 Don't let your progress stop! Your subscription expires on [endDate] ([daysUntilEnd] days left). Keep crushing your goals - renew today! 💯",
    },
    {
      id: 5,
      name: '📞 Personal Touch',
      message:
        "Hi [user], hope you're doing well! Your subscription ends on [endDate] - [daysUntilEnd] days to go. I'd love to help you continue your journey with us. Let's chat! 😊",
    },
  ]);

  const [selectedTemplateId, setSelectedTemplateId] = useState(1);
  const [messageTemplate, setMessageTemplate] = useState('');

  // Update message template when templates are loaded
  useEffect(() => {
    if (messageTemplates.length > 0 && !messageTemplate) {
      setMessageTemplate(messageTemplates[0].message);
    }
  }, [messageTemplates, messageTemplate]);

  // Template management functions
  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateMessage.trim()) {
      showErrorToast('Template name and message are required');
      return;
    }

    try {
      await createTemplate({
        name: newTemplateName.trim(),
        message: newTemplateMessage.trim(),
        icon: newTemplateIcon,
        category: newTemplateCategory,
      }).unwrap();

      showSuccessToast('Template created successfully!');
      setShowTemplateModal(false);
      resetTemplateForm();
      refetchTemplates();
    } catch (err) {
      showErrorToast(err?.data?.message || 'Failed to create template');
    }
  };

  const handleUpdateTemplate = async () => {
    if (
      !editingTemplate ||
      !newTemplateName.trim() ||
      !newTemplateMessage.trim()
    ) {
      showErrorToast('Template name and message are required');
      return;
    }

    try {
      await updateTemplate({
        id: editingTemplate._id,
        name: newTemplateName.trim(),
        message: newTemplateMessage.trim(),
        icon: newTemplateIcon,
        category: newTemplateCategory,
      }).unwrap();

      showSuccessToast('Template updated successfully!');
      setShowTemplateModal(false);
      setEditingTemplate(null);
      resetTemplateForm();
      refetchTemplates();
    } catch (err) {
      showErrorToast(err?.data?.message || 'Failed to update template');
    }
  };

  const handleDeleteTemplate = async (
    templateId,
    templateName,
    isDefault = false
  ) => {
    let confirmMessage;

    if (isDefault) {
      confirmMessage =
        `⚠️ WARNING: You are about to delete a DEFAULT template!\n\n` +
        `Template: "${templateName}"\n\n` +
        `This is a system template that other admins might be using. ` +
        `Deleting it will remove it for ALL users permanently.\n\n` +
        `Are you absolutely sure you want to delete this default template?\n\n` +
        `Type "DELETE" to confirm:`;

      const userInput = prompt(confirmMessage);
      if (userInput !== 'DELETE') {
        showErrorToast(
          'Deletion cancelled. You must type "DELETE" to confirm.'
        );
        return;
      }
    } else {
      confirmMessage = `Are you sure you want to delete the template "${templateName}"?\n\nThis action cannot be undone.`;
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;
    }

    try {
      await deleteTemplate(templateId).unwrap();
      showSuccessToast(`✅ Template "${templateName}" deleted successfully!`);
      refetchTemplates();

      // If the deleted template was currently selected, reset to first available
      const remainingTemplates = messageTemplates.filter(
        (t) => t._id !== templateId
      );
      if (remainingTemplates.length > 0) {
        setMessageTemplate(remainingTemplates[0].message);
        setSelectedTemplateId(remainingTemplates[0]._id);
      } else {
        setMessageTemplate('');
        setSelectedTemplateId(null);
      }
    } catch (err) {
      showErrorToast(err?.data?.message || 'Failed to delete template');
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setNewTemplateName(template.name);
    setNewTemplateMessage(template.message);
    setNewTemplateIcon(template.icon);
    setNewTemplateCategory(template.category);
    setShowTemplateModal(true);
  };

  const resetTemplateForm = () => {
    setNewTemplateName('');
    setNewTemplateMessage('');
    setNewTemplateIcon('💬');
    setNewTemplateCategory('custom');
  };

  const handleTemplateSelect = async (template) => {
    setMessageTemplate(template.message);

    // Increment usage count
    try {
      await incrementUsage(template._id);
    } catch (err) {
      console.error('Failed to increment template usage:', err);
    }
  };

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showIndividualMessageModal, setShowIndividualMessageModal] =
    useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [processedMessage, setProcessedMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Theme detection
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

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

  // Add mobile styles and animations after isDarkMode is defined
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
            .mobile-users-grid {
                max-height: 70vh;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: ${
                  isDarkMode ? '#404040 #1a1a1a' : '#c1c1c1 #f8f9fa'
                };
            }
            .mobile-users-grid::-webkit-scrollbar {
                width: 8px;
            }
            .mobile-users-grid::-webkit-scrollbar-track {
                background: ${isDarkMode ? '#1a1a1a' : '#f8f9fa'};
                border-radius: 4px;
            }
            .mobile-users-grid::-webkit-scrollbar-thumb {
                background: ${isDarkMode ? '#404040' : '#c1c1c1'};
                border-radius: 4px;
            }
            .mobile-users-grid::-webkit-scrollbar-thumb:hover {
                background: ${isDarkMode ? '#505050' : '#a1a1a1'};
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }

            @keyframes glow {
                0% { box-shadow: 0 0 5px rgba(37, 211, 102, 0.5); }
                50% { box-shadow: 0 0 20px rgba(37, 211, 102, 0.8); }
                100% { box-shadow: 0 0 5px rgba(37, 211, 102, 0.5); }
            }
        `;
    document.head.appendChild(style);

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [isDarkMode]);

  // Define theme colors
  const colors = {
    background: isDarkMode ? '#0a0a0a' : '#f8f9fa',
    cardBg: isDarkMode ? '#1a1a1a' : '#ffffff',
    cardHeaderBg: isDarkMode ? '#2d2d2d' : '#f1f3f4',
    text: isDarkMode ? '#ffffff' : '#333333',
    border: isDarkMode ? '#404040' : '#dee2e6',
    accent: '#8b5cf6',
    muted: isDarkMode ? '#a0aec0' : '#6c757d',
    inputBg: isDarkMode ? '#2d2d2d' : '#ffffff',
  };

  // API hooks
  const {
    data: managementData,
    isLoading,
    error,
    refetch,
  } = useGetTimeFrameManagementQuery(filters);

  const [sendWhatsAppContact] = useSendWhatsAppContactMutation();
  const [processTemplate] = useProcessMessageTemplateMutation();
  const [cleanupRegularUsers] = useCleanupRegularUsersMutation();

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: field === 'page' ? value : 1, // Reset page when other filters change
    }));
  };

  // Handle individual user message processing
  const handleProcessIndividualMessage = async (user) => {
    try {
      const result = await processTemplate({
        template: messageTemplate,
        userIds: [user._id],
      }).unwrap();

      if (result.processedMessages && result.processedMessages.length > 0) {
        const processedMsg = result.processedMessages[0].processedMessage;

        // If quick WhatsApp mode is enabled, send directly to WhatsApp
        if (quickWhatsAppMode) {
          await handleSendWhatsApp(user._id, processedMsg, true);
        } else {
          // Show modal for confirmation
          setSelectedUser(user);
          setProcessedMessage(processedMsg);
          setShowIndividualMessageModal(true);
        }
      }
    } catch (err) {
      showErrorToast(err?.data?.message || 'Failed to process message');
    }
  };

  // Handle WhatsApp message send
  const handleSendWhatsApp = async (userId, message, isQuickMode = false) => {
    try {
      setSendingMessage(userId);
      const result = await sendWhatsAppContact({
        userId,
        message,
        messageTemplate: 'timeframe-reminder',
      }).unwrap();

      // Open WhatsApp URL
      window.open(result.whatsappUrl, '_blank');

      if (isQuickMode) {
        showSuccessToast('🚀 Quick WhatsApp message sent!');
      } else {
        showSuccessToast('WhatsApp message prepared and contact recorded!');
        // Close modal only for non-quick mode
        setShowIndividualMessageModal(false);
        setSelectedUser(null);
        setProcessedMessage('');
      }

      // Refresh data to update contact status
      refetch();
    } catch (err) {
      showErrorToast(err?.data?.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle cleanup of all regular users
  const handleCleanupUsers = async () => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to remove ALL regular users?\n\n' +
        'This will permanently delete all non-admin users from the database.\n' +
        'Admin users will be preserved.\n\n' +
        'This action cannot be undone!'
    );

    if (!confirmed) return;

    try {
      const result = await cleanupRegularUsers().unwrap();

      showSuccessToast(
        `✅ Successfully removed ${result.removedCount} regular users. ` +
          `${result.remainingAdmins} admin users preserved.`
      );

      // Refresh data to update the dashboard
      refetch();
    } catch (err) {
      showErrorToast(err?.data?.message || 'Failed to cleanup users');
    }
  };

  // Format time frames
  const formatTimeFrame = (user) => {
    if (!user.timeFrame || !user.timeFrame.endDate) {
      return { text: 'No time frame', variant: 'secondary' };
    }

    const endDate = new Date(user.timeFrame.endDate);
    const now = new Date();
    const daysUntilEnd = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    if (user.isWithinTimeFrame) {
      if (daysUntilEnd <= 7) {
        return { text: `Ends in ${daysUntilEnd} days`, variant: 'danger' };
      } else if (daysUntilEnd <= 14) {
        return { text: `Ends in ${daysUntilEnd} days`, variant: 'warning' };
      } else {
        return { text: `${daysUntilEnd} days remaining`, variant: 'success' };
      }
    } else {
      return { text: 'Expired', variant: 'dark' };
    }
  };

  // Format last contact
  const formatLastContact = (user) => {
    if (!user.lastContactedAt) {
      return { text: 'Never contacted', variant: 'secondary' };
    }

    const lastContact = new Date(user.lastContactedAt);
    const now = new Date();
    const daysSince = Math.floor((now - lastContact) / (1000 * 60 * 60 * 24));

    if (daysSince === 0) {
      return { text: 'Today', variant: 'success' };
    } else if (daysSince === 1) {
      return { text: 'Yesterday', variant: 'info' };
    } else if (daysSince <= 7) {
      return { text: `${daysSince} days ago`, variant: 'info' };
    } else if (daysSince <= 30) {
      return { text: `${daysSince} days ago`, variant: 'warning' };
    } else {
      return { text: `${daysSince} days ago`, variant: 'danger' };
    }
  };

  // Template placeholders help
  const templateHelp = [
    { placeholder: '[user]', description: "User's name" },
    { placeholder: '[name]', description: "User's name (alias)" },
    { placeholder: '[email]', description: "User's email" },
    { placeholder: '[endDate]', description: 'Time frame end date' },
    { placeholder: '[endDateFormatted]', description: 'Formatted end date' },
    { placeholder: '[daysUntilEnd]', description: 'Days until end' },
    { placeholder: '[startDate]', description: 'Time frame start date' },
    { placeholder: '[duration]', description: 'Duration number' },
    {
      placeholder: '[durationType]',
      description: 'Duration type (days/months)',
    },
  ];

  if (isLoading) return <Loader />;

  if (error) {
    return (
      <Container fluid className='px-1'>
        <Message variant='danger'>
          {error?.data?.message || error.error}
        </Message>
      </Container>
    );
  }

  const { users = [], stats = {}, pagination = {} } = managementData || {};

  return (
    <Container
      fluid
      className='px-1'
      style={{
        backgroundColor: colors.background,
        minHeight: '100vh',
      }}
    >
      {/* Compact Header */}
      <Row className='mb-3'>
        <Col>
          <div className='d-flex justify-content-between align-items-center'>
            <div>
              <h4
                style={{
                  color: colors.text,
                  marginBottom: '4px',
                  fontWeight: '600',
                }}
              >
                <FaClock className='me-2' style={{ color: colors.accent }} />
                Subscription Dashboard
              </h4>
              <small style={{ color: colors.muted }}>
                Monitor user subscriptions & send reminders
              </small>
            </div>
            <Button
              variant='outline-primary'
              size='sm'
              onClick={() => refetch()}
              style={{ borderColor: colors.accent, color: colors.accent }}
            >
              <FaSync className='me-1' />
              Refresh
            </Button>
          </div>
        </Col>
      </Row>

      {/* Compact Statistics Cards */}
      <Row className='mb-3'>
        {/* Row 1: Total & Active */}
        <Col xs={6} sm={4} md={3} lg={2} className='mb-2'>
          <Card
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              cursor: 'pointer',
              minHeight: '85px',
            }}
            onClick={() => handleFilterChange('daysUntilExpiration', 'all')}
          >
            <Card.Body className='text-center py-2 px-2'>
              <div
                style={{
                  color: colors.accent,
                  fontSize: '1.2rem',
                  marginBottom: '2px',
                }}
              >
                <FaUser />
              </div>
              <h6
                style={{
                  color: colors.text,
                  marginBottom: '2px',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                }}
              >
                {stats.total || 0}
              </h6>
              <small style={{ color: colors.muted, fontSize: '0.7rem' }}>
                Total
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={4} md={3} lg={2} className='mb-2'>
          <Card
            style={{
              backgroundColor: colors.cardBg,
              border: `2px solid #28a745`,
              cursor: 'pointer',
              minHeight: '85px',
            }}
            onClick={() =>
              handleFilterChange('timeFrameStatus', 'within-timeframe')
            }
          >
            <Card.Body className='text-center py-2 px-2'>
              <div
                style={{
                  color: '#28a745',
                  fontSize: '1.2rem',
                  marginBottom: '2px',
                }}
              >
                <FaCheckCircle />
              </div>
              <h6
                style={{
                  color: colors.text,
                  marginBottom: '2px',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                }}
              >
                {stats.withinTimeframe || 0}
              </h6>
              <small
                style={{
                  color: '#28a745',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                }}
              >
                Active
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={4} md={3} lg={2} className='mb-2'>
          <Card
            style={{
              backgroundColor: colors.cardBg,
              border: `2px solid #ffc107`,
              cursor: 'pointer',
              minHeight: '85px',
            }}
            onClick={() =>
              handleFilterChange('timeFrameStatus', 'ending-two-weeks')
            }
          >
            <Card.Body className='text-center py-2 px-2'>
              <div
                style={{
                  color: '#ffc107',
                  fontSize: '1.2rem',
                  marginBottom: '2px',
                }}
              >
                <FaExclamationTriangle />
              </div>
              <h6
                style={{
                  color: colors.text,
                  marginBottom: '2px',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                }}
              >
                {stats.endingTwoWeeks || 0}
              </h6>
              <small
                style={{
                  color: '#ffc107',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                }}
              >
                Soon
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={4} md={3} lg={2} className='mb-2'>
          <Card
            style={{
              backgroundColor: colors.cardBg,
              border: `2px solid #dc3545`,
              cursor: 'pointer',
              minHeight: '85px',
            }}
            onClick={() => handleFilterChange('timeFrameStatus', 'ending-week')}
          >
            <Card.Body className='text-center py-2 px-2'>
              <div
                style={{
                  color: '#dc3545',
                  fontSize: '1.2rem',
                  marginBottom: '2px',
                }}
              >
                <FaBell />
              </div>
              <h6
                style={{
                  color: colors.text,
                  marginBottom: '2px',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                }}
              >
                {stats.endingWeek || 0}
              </h6>
              <small
                style={{
                  color: '#dc3545',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                }}
              >
                Urgent
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={4} md={3} lg={2} className='mb-2'>
          <Card
            style={{
              backgroundColor: colors.cardBg,
              border: `2px solid #6c757d`,
              cursor: 'pointer',
              minHeight: '85px',
            }}
            onClick={() =>
              handleFilterChange('timeFrameStatus', 'outside-timeframe')
            }
          >
            <Card.Body className='text-center py-2 px-2'>
              <div
                style={{
                  color: '#6c757d',
                  fontSize: '1.2rem',
                  marginBottom: '2px',
                }}
              >
                <FaTimesCircle />
              </div>
              <h6
                style={{
                  color: colors.text,
                  marginBottom: '2px',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                }}
              >
                {stats.outsideTimeframe || 0}
              </h6>
              <small
                style={{
                  color: '#6c757d',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                }}
              >
                Expired
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={4} md={3} lg={2} className='mb-2'>
          <Card
            style={{
              backgroundColor: colors.cardBg,
              border: `2px solid ${colors.accent}`,
              cursor: 'pointer',
              minHeight: '85px',
            }}
            onClick={() =>
              handleFilterChange('lastContactFilter', 'needs-follow-up')
            }
          >
            <Card.Body className='text-center py-2 px-2'>
              <div
                style={{
                  color: colors.accent,
                  fontSize: '1.2rem',
                  marginBottom: '2px',
                }}
              >
                <FaPhoneAlt />
              </div>
              <h6
                style={{
                  color: colors.text,
                  marginBottom: '2px',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                }}
              >
                {stats.needsContact || 0}
              </h6>
              <small
                style={{
                  color: colors.accent,
                  fontSize: '0.7rem',
                  fontWeight: '600',
                }}
              >
                Contact
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions Summary */}
      {stats.hasFiltersApplied && (
        <Row className='mb-3'>
          <Col>
            <Card
              style={{
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Card.Body className='py-2'>
                <div className='d-flex justify-content-between align-items-center'>
                  <div style={{ color: colors.text }}>
                    <small>
                      <strong>Filtered Results:</strong> Showing{' '}
                      {stats.filteredTotal} of {stats.total} users
                    </small>
                  </div>
                  <Button
                    variant='outline-secondary'
                    size='sm'
                    onClick={() =>
                      setFilters({
                        timeFrameStatus: 'all',
                        daysUntilExpiration: 'all',
                        lastContactFilter: 'all',
                        search: '',
                        hasWhatsApp: 'all',
                        subscriptionType: 'all',
                        page: 1,
                        limit: 100,
                        sortBy: 'endDate',
                        sortOrder: 'asc',
                      })
                    }
                    style={{
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Enhanced Message Template */}
      <Row className='mb-4'>
        <Col>
          <Card
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
            }}
          >
            <Card.Header
              style={{
                backgroundColor: colors.cardHeaderBg,
                borderBottom: `2px solid #25D366`,
                padding: '20px',
              }}
            >
              <div className='d-flex justify-content-between align-items-center flex-wrap gap-2'>
                <h4
                  style={{
                    color: colors.text,
                    marginBottom: 0,
                    fontWeight: '600',
                  }}
                >
                  <FaWhatsapp
                    className='me-2'
                    style={{ color: '#25D366', fontSize: '1.3rem' }}
                  />
                  WhatsApp Message Templates
                </h4>
                <div className='d-flex align-items-center gap-2'>
                  {/* Quick WhatsApp Toggle */}
                  <div
                    className='d-flex align-items-center gap-2'
                    style={{
                      backgroundColor: quickWhatsAppMode
                        ? '#e8f5e8'
                        : colors.cardHeaderBg,
                      padding: '8px 12px',
                      borderRadius: '20px',
                      border: `2px solid ${
                        quickWhatsAppMode ? '#25D366' : colors.border
                      }`,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <FaBolt
                      style={{
                        color: quickWhatsAppMode ? '#25D366' : colors.muted,
                        fontSize: '1rem',
                      }}
                    />
                    <Form.Check
                      type='switch'
                      id='quick-whatsapp-toggle'
                      checked={quickWhatsAppMode}
                      onChange={handleQuickModeToggle}
                      style={{
                        marginBottom: 0,
                      }}
                    />
                    <small
                      style={{
                        color: quickWhatsAppMode ? '#25D366' : colors.text,
                        fontWeight: '600',
                        fontSize: '0.8rem',
                      }}
                    >
                      Quick Send
                    </small>
                  </div>

                  <Button
                    variant='outline-info'
                    size='sm'
                    onClick={() => setShowMessageModal(true)}
                    style={{
                      borderRadius: '20px',
                      padding: '6px 12px',
                    }}
                  >
                    <FaInfoCircle className='me-1' />
                    Placeholders
                  </Button>
                </div>
              </div>
              {quickWhatsAppMode && (
                <div
                  style={{
                    backgroundColor: '#e8f5e8',
                    padding: '10px 20px',
                    borderTop: `1px solid #25D366`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FaBolt style={{ color: '#25D366', fontSize: '0.9rem' }} />
                  <small style={{ color: '#25D366', fontWeight: '600' }}>
                    Quick Send Mode Active: Messages will be sent directly to
                    WhatsApp without confirmation popup
                  </small>
                </div>
              )}
            </Card.Header>
            <Card.Body style={{ padding: '25px' }}>
              {/* Template Selector */}
              <div className='mb-4'>
                <Form.Label
                  style={{
                    color: colors.text,
                    fontWeight: '600',
                    marginBottom: '12px',
                    fontSize: '1rem',
                  }}
                >
                  📋 Choose Template:
                </Form.Label>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '20px',
                  }}
                >
                  {/* Templates with Edit/Save buttons */}
                  {messageTemplates.map((template) => (
                    <div
                      key={template._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        backgroundColor:
                          selectedTemplateId === template._id
                            ? colors.accent + '20'
                            : 'transparent',
                        borderRadius: '12px',
                        border:
                          selectedTemplateId === template._id
                            ? `2px solid ${colors.accent}`
                            : `1px solid ${colors.border}`,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Button
                        variant={
                          selectedTemplateId === template._id
                            ? 'primary'
                            : 'outline-secondary'
                        }
                        size='sm'
                        onClick={() => {
                          setSelectedTemplateId(template._id);
                          handleTemplateSelect(template);
                        }}
                        style={{
                          borderRadius: '20px',
                          padding: '8px 16px',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          flex: 1,
                          backgroundColor:
                            selectedTemplateId === template._id
                              ? colors.accent
                              : 'transparent',
                          borderColor:
                            selectedTemplateId === template._id
                              ? colors.accent
                              : colors.border,
                          color:
                            selectedTemplateId === template._id
                              ? 'white'
                              : colors.text,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {template.icon} {template.name}
                        {template.isDefault && (
                          <Badge
                            bg='warning'
                            text='dark'
                            className='ms-2'
                            style={{ fontSize: '0.6rem' }}
                          >
                            DEFAULT
                          </Badge>
                        )}
                        {template.usageCount > 0 && (
                          <Badge
                            bg='light'
                            text='dark'
                            className='ms-2'
                            style={{ fontSize: '0.6rem' }}
                          >
                            {template.usageCount}
                          </Badge>
                        )}
                      </Button>

                      {/* Quick Save Button */}
                      <Button
                        variant='outline-success'
                        size='sm'
                        onClick={async () => {
                          try {
                            await updateTemplate({
                              id: template._id,
                              name: template.name,
                              message: messageTemplate.trim(),
                              icon: template.icon,
                              category: template.category,
                            }).unwrap();

                            showSuccessToast(
                              `✅ Template "${template.name}" saved!`
                            );
                            refetchTemplates();
                          } catch (err) {
                            showErrorToast(
                              err?.data?.message || 'Failed to save template'
                            );
                          }
                        }}
                        disabled={
                          !messageTemplate.trim() ||
                          messageTemplate === template.message
                        }
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.8rem',
                          borderRadius: '8px',
                        }}
                        title='Save changes to this template'
                      >
                        <FaSave />
                      </Button>

                      {/* Edit Button */}
                      <Button
                        variant='outline-info'
                        size='sm'
                        onClick={() => {
                          const newName = prompt(
                            'Enter new template name:',
                            template.name
                          );
                          const newIcon = prompt(
                            'Enter new icon:',
                            template.icon
                          );

                          if (newName && newName.trim()) {
                            updateTemplate({
                              id: template._id,
                              name: newName.trim(),
                              message: template.message,
                              icon: newIcon?.trim() || template.icon,
                              category: template.category,
                            })
                              .unwrap()
                              .then(() => {
                                showSuccessToast(
                                  `✅ Template renamed to "${newName}"`
                                );
                                refetchTemplates();
                              })
                              .catch((err) => {
                                showErrorToast(
                                  err?.data?.message ||
                                    'Failed to update template'
                                );
                              });
                          }
                        }}
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.8rem',
                          borderRadius: '8px',
                        }}
                        title='Edit template name and icon'
                      >
                        <FaEdit />
                      </Button>

                      {/* Delete Button (all templates removable) */}
                      <Button
                        variant='outline-danger'
                        size='sm'
                        onClick={() =>
                          handleDeleteTemplate(
                            template._id,
                            template.name,
                            template.isDefault
                          )
                        }
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.8rem',
                          borderRadius: '8px',
                        }}
                        title={
                          template.isDefault
                            ? 'Delete default template'
                            : 'Delete template'
                        }
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  ))}

                  {/* Add New Template Button */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      marginTop: '12px',
                    }}
                  >
                    <Button
                      variant='success'
                      size='sm'
                      onClick={async () => {
                        const templateName = prompt(
                          'Enter template name:',
                          'My New Template'
                        );
                        if (!templateName || !templateName.trim()) return;

                        const templateIcon = prompt(
                          'Enter template icon (emoji):',
                          '💬'
                        );
                        const templateCategory = prompt(
                          'Enter category (urgent/friendly/professional/motivational/personal/custom):',
                          'custom'
                        );

                        try {
                          await createTemplate({
                            name: templateName.trim(),
                            message: 'Hi [user]! Your message here...',
                            icon: templateIcon?.trim() || '💬',
                            category: templateCategory?.trim() || 'custom',
                          }).unwrap();

                          showSuccessToast(
                            `✅ Template "${templateName}" created successfully!`
                          );
                          refetchTemplates();
                        } catch (err) {
                          showErrorToast(
                            err?.data?.message || 'Failed to create template'
                          );
                        }
                      }}
                      style={{
                        borderRadius: '20px',
                        padding: '8px 20px',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        backgroundColor: '#28a745',
                        borderColor: '#28a745',
                      }}
                    >
                      <FaPlus className='me-2' />
                      Create New Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* WhatsApp Style Message Preview */}
              <div className='mb-4'>
                <Form.Label
                  style={{
                    color: colors.text,
                    fontWeight: '600',
                    marginBottom: '12px',
                    fontSize: '1rem',
                  }}
                >
                  📱 Message Preview (WhatsApp Style):
                </Form.Label>
                <div
                  style={{
                    backgroundColor: '#e5ddd5', // WhatsApp chat background
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.04'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #E0E0E0',
                    minHeight: '200px',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: '#DCF8C6',
                      padding: '12px 16px',
                      borderRadius: '18px 18px 4px 18px',
                      marginLeft: 'auto',
                      marginRight: '0',
                      maxWidth: '80%',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.95rem',
                        lineHeight: '1.4',
                        color: '#2A2A2A',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {messageTemplate ||
                        'Select a template or type your message...'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#8696A0',
                        textAlign: 'right',
                        marginTop: '4px',
                      }}
                    >
                      {new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      ✓✓
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Text Area with Save Button */}
              <Form.Group className='mb-4'>
                <div className='d-flex justify-content-between align-items-center mb-3'>
                  <Form.Label
                    style={{
                      color: colors.text,
                      fontWeight: '600',
                      fontSize: '1rem',
                      marginBottom: '0',
                    }}
                  >
                    ✏️ Edit Message:
                  </Form.Label>

                  {/* Save Template Button */}
                  <Button
                    variant='success'
                    size='sm'
                    onClick={async () => {
                      setSavingTemplate(true);
                      try {
                        const currentTemplate = messageTemplates.find(
                          (t) => t._id === selectedTemplateId
                        );
                        if (currentTemplate) {
                          // Update existing template
                          await updateTemplate({
                            id: currentTemplate._id,
                            name: currentTemplate.name,
                            message: messageTemplate.trim(),
                            icon: currentTemplate.icon,
                            category: currentTemplate.category,
                          }).unwrap();

                          showSuccessToast(
                            `✅ Template "${currentTemplate.name}" updated successfully!`
                          );
                          refetchTemplates();
                        } else {
                          // Create new template with current message
                          const templateName = prompt(
                            'Enter a name for this template:',
                            'My Custom Template'
                          );
                          if (templateName && templateName.trim()) {
                            await createTemplate({
                              name: templateName.trim(),
                              message: messageTemplate.trim(),
                              icon: '💬',
                              category: 'custom',
                            }).unwrap();

                            showSuccessToast(
                              `✅ New template "${templateName}" created successfully!`
                            );
                            refetchTemplates();
                          }
                        }
                      } catch (err) {
                        showErrorToast(
                          err?.data?.message || 'Failed to save template'
                        );
                      } finally {
                        setSavingTemplate(false);
                      }
                    }}
                    disabled={!messageTemplate.trim() || savingTemplate}
                    style={{
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      backgroundColor: '#28a745',
                      borderColor: '#28a745',
                    }}
                    title='Save current message as template'
                  >
                    {savingTemplate ? (
                      <>
                        <Spinner
                          animation='border'
                          size='sm'
                          className='me-1'
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className='me-1' />
                        Save Template
                      </>
                    )}
                  </Button>
                </div>

                <Form.Control
                  as='textarea'
                  rows={6}
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder='Enter your message template with placeholders like [user], [endDate], [daysUntilEnd], etc.'
                  style={{
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    border: `2px solid ${colors.border}`,
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '150px',
                    transition: 'border-color 0.2s ease',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = colors.accent)}
                  onBlur={(e) => (e.target.style.borderColor = colors.border)}
                />
                <Form.Text
                  style={{
                    color: colors.muted,
                    fontSize: '0.9rem',
                    marginTop: '8px',
                    display: 'block',
                  }}
                >
                  💡 Use placeholders: <code>[user]</code>{' '}
                  <code>[endDate]</code> <code>[daysUntilEnd]</code> to
                  personalize messages
                  <br />
                  💾 Click "Save Template" to save your changes permanently for
                  all admins
                </Form.Text>

                {/* Template Management Warning */}
                <Alert
                  variant='info'
                  style={{
                    backgroundColor: colors.cardHeaderBg,
                    borderColor: colors.accent,
                    color: colors.text,
                    fontSize: '0.85rem',
                    marginTop: '12px',
                  }}
                >
                  <div className='d-flex align-items-center'>
                    <FaInfoCircle
                      className='me-2'
                      style={{ color: colors.accent }}
                    />
                    <div>
                      <strong>Template Management:</strong>
                      <br />
                      • All templates can be deleted individually (including
                      default ones)
                      <br />
                      • Default templates require typing "DELETE" to confirm
                      removal
                      <br />• Changes are shared across all admin users
                      instantly
                    </div>
                  </div>
                </Alert>
              </Form.Group>

              {/* Action Bar */}
              <div
                style={{
                  backgroundColor: colors.cardHeaderBg,
                  borderRadius: '12px',
                  padding: '16px',
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className='d-flex justify-content-between align-items-center flex-wrap gap-3'>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        color: colors.text,
                        fontSize: '0.9rem',
                        fontWeight: '500',
                      }}
                    >
                      📱 Ready to send via WhatsApp
                    </span>
                    <span
                      style={{
                        backgroundColor: '#25D366',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                      }}
                    >
                      Individual Mode
                    </span>
                  </div>
                  <div
                    style={{
                      color: colors.muted,
                      fontSize: '0.85rem',
                      textAlign: 'right',
                    }}
                  >
                    Click 📱 next to any user to send
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Advanced Filters */}
      <Row className='mb-4'>
        <Col>
          <Card
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Card.Header
              style={{
                backgroundColor: colors.cardHeaderBg,
                borderBottom: `2px solid ${colors.accent}`,
                borderRadius: '12px 12px 0 0',
              }}
            >
              <div className='d-flex justify-content-between align-items-center'>
                <h5
                  style={{
                    color: colors.text,
                    marginBottom: 0,
                    fontWeight: '600',
                  }}
                >
                  <FaFilter className='me-2' style={{ color: colors.accent }} />
                  Advanced Filtering & Search
                </h5>
                <Button
                  variant='outline-secondary'
                  size='sm'
                  onClick={() =>
                    setFilters({
                      timeFrameStatus: 'all',
                      daysUntilExpiration: 'all',
                      lastContactFilter: 'all',
                      search: '',
                      hasWhatsApp: 'all',
                      subscriptionType: 'all',
                      page: 1,
                      limit: 100,
                      sortBy: 'endDate',
                      sortOrder: 'asc',
                    })
                  }
                  style={{
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            </Card.Header>
            <Card.Body style={{ padding: '25px' }}>
              {/* Primary Filters Row */}
              <Row className='g-3 mb-4'>
                <Col lg={4} md={6}>
                  <Form.Group>
                    <Form.Label
                      style={{
                        color: colors.text,
                        fontWeight: '500',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <FaSearch style={{ color: colors.accent }} />
                      Search Users
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.border,
                          color: colors.accent,
                        }}
                      >
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        type='text'
                        placeholder='Search by name, email, or phone number...'
                        value={filters.search}
                        onChange={(e) =>
                          handleFilterChange('search', e.target.value)
                        }
                        style={{
                          backgroundColor: colors.inputBg,
                          color: colors.text,
                          borderColor: colors.border,
                        }}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col lg={3} md={6}>
                  <Form.Group>
                    <Form.Label
                      style={{
                        color: colors.text,
                        fontWeight: '500',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <FaClock style={{ color: colors.accent }} />
                      Days Until Expiration
                    </Form.Label>
                    <Form.Select
                      value={filters.daysUntilExpiration}
                      onChange={(e) =>
                        handleFilterChange(
                          'daysUntilExpiration',
                          e.target.value
                        )
                      }
                      style={{
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        borderColor: colors.border,
                        fontWeight: '500',
                      }}
                    >
                      <option value='all'>🌐 All Time Ranges</option>

                      <optgroup label='📊 Cumulative Ranges (0 to X days)'>
                        <option value='0-to-7'>
                          ⚡ 0-7 Days (Critical Window)
                        </option>
                        <option value='0-to-14'>
                          🔥 0-14 Days (Urgent Window)
                        </option>
                        <option value='0-to-30'>
                          📅 0-30 Days (Monthly Window)
                        </option>
                        <option value='0-to-60'>
                          📆 0-60 Days (2 Month Window)
                        </option>
                        <option value='0-to-90'>
                          🗓️ 0-90 Days (Quarterly Window)
                        </option>
                        <option value='0-to-180'>
                          📋 0-180 Days (6 Month Window)
                        </option>
                        <option value='0-to-365'>
                          📝 0-365 Days (Annual Window)
                        </option>
                      </optgroup>

                      <optgroup label='🎯 Specific Ranges'>
                        <option value='today'>🔴 Expiring Today</option>
                        <option value='1-3-days'>🟠 1-3 Days (Critical)</option>
                        <option value='4-7-days'>🟡 4-7 Days (Urgent)</option>
                        <option value='8-14-days'>🟢 1-2 Weeks</option>
                        <option value='15-30-days'>
                          🔵 2-4 Weeks (1 Month)
                        </option>
                        <option value='31-60-days'>🟣 1-2 Months</option>
                        <option value='61-90-days'>⚪ 2-3 Months</option>
                        <option value='over-90-days'>📅 Over 3 Months</option>
                        <option value='expired'>❌ Already Expired</option>
                        <option value='no-expiration'>
                          ➖ No Time Frame Set
                        </option>
                      </optgroup>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col lg={3} md={6}>
                  <Form.Group>
                    <Form.Label
                      style={{
                        color: colors.text,
                        fontWeight: '500',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <FaPhoneAlt style={{ color: colors.accent }} />
                      Last Contact Status
                    </Form.Label>
                    <Form.Select
                      value={filters.lastContactFilter}
                      onChange={(e) =>
                        handleFilterChange('lastContactFilter', e.target.value)
                      }
                      style={{
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        borderColor: colors.border,
                        fontWeight: '500',
                      }}
                    >
                      <option value='all'>📞 All Contact Status</option>

                      <optgroup label='📊 Contacted Within Range (0 to X days)'>
                        <option value='contacted-0-to-7'>
                          🟢 Contacted 0-7 Days
                        </option>
                        <option value='contacted-0-to-14'>
                          🔵 Contacted 0-14 Days
                        </option>
                        <option value='contacted-0-to-30'>
                          🟡 Contacted 0-30 Days
                        </option>
                        <option value='contacted-0-to-60'>
                          🟠 Contacted 0-60 Days
                        </option>
                        <option value='contacted-0-to-90'>
                          🔴 Contacted 0-90 Days
                        </option>
                        <option value='contacted-0-to-180'>
                          🟣 Contacted 0-180 Days
                        </option>
                        <option value='contacted-0-to-365'>
                          📅 Contacted 0-365 Days
                        </option>
                      </optgroup>

                      <optgroup label='🎯 Specific Contact Status'>
                        <option value='never'>🚫 Never Contacted</option>
                        <option value='today'>🟢 Contacted Today</option>
                        <option value='yesterday'>
                          🔵 Contacted Yesterday
                        </option>
                        <option value='week'>🟡 This Week (1-7 days)</option>
                        <option value='month'>🟠 This Month (8-30 days)</option>
                        <option value='quarter'>
                          🔴 This Quarter (31-90 days)
                        </option>
                        <option value='long-ago'>
                          ⚫ Long Time Ago (90+ days)
                        </option>
                        <option value='needs-follow-up'>
                          ⚠️ Needs Follow-up
                        </option>
                      </optgroup>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col lg={2} md={6}>
                  <Form.Group>
                    <Form.Label
                      style={{
                        color: colors.text,
                        fontWeight: '500',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <FaWhatsapp style={{ color: '#25D366' }} />
                      WhatsApp Status
                    </Form.Label>
                    <Form.Select
                      value={filters.hasWhatsApp}
                      onChange={(e) =>
                        handleFilterChange('hasWhatsApp', e.target.value)
                      }
                      style={{
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        borderColor: colors.border,
                        fontWeight: '500',
                      }}
                    >
                      <option value='all'>📱 All Users</option>
                      <option value='with-whatsapp'>✅ Has WhatsApp</option>
                      <option value='without-whatsapp'>❌ No WhatsApp</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Secondary Filters Row */}
              <Row className='g-3 mb-3'>
                <Col lg={2} md={4}>
                  <Form.Group>
                    <Form.Label
                      style={{
                        color: colors.text,
                        fontWeight: '500',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <FaSort style={{ color: colors.accent }} />
                      Sort By
                    </Form.Label>
                    <Form.Select
                      value={filters.sortBy}
                      onChange={(e) =>
                        handleFilterChange('sortBy', e.target.value)
                      }
                      style={{
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        borderColor: colors.border,
                      }}
                    >
                      <option value='endDate'>📅 End Date</option>
                      <option value='name'>👤 User Name</option>
                      <option value='lastContact'>📞 Last Contact</option>
                      <option value='daysUntilEnd'>⏰ Days Until End</option>
                      <option value='createdAt'>🆕 Registration Date</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col lg={2} md={4}>
                  <Form.Group>
                    <Form.Label
                      style={{
                        color: colors.text,
                        fontWeight: '500',
                        marginBottom: '8px',
                      }}
                    >
                      Order
                    </Form.Label>
                    <Form.Select
                      value={filters.sortOrder}
                      onChange={(e) =>
                        handleFilterChange('sortOrder', e.target.value)
                      }
                      style={{
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        borderColor: colors.border,
                      }}
                    >
                      <option value='asc'>📈 Ascending</option>
                      <option value='desc'>📉 Descending</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col lg={2} md={4}>
                  <Form.Group>
                    <Form.Label
                      style={{
                        color: colors.text,
                        fontWeight: '500',
                        marginBottom: '8px',
                      }}
                    >
                      Results Per Page
                    </Form.Label>
                    <Form.Select
                      value={filters.limit}
                      onChange={(e) =>
                        handleFilterChange('limit', parseInt(e.target.value))
                      }
                      style={{
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        borderColor: colors.border,
                      }}
                    >
                      <option value='10'>10 users</option>
                      <option value='25'>25 users</option>
                      <option value='50'>50 users</option>
                      <option value='100'>100 users</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col lg={6} className='d-flex align-items-end'>
                  <div style={{ width: '100%' }}>
                    <div className='d-flex justify-content-between align-items-center'>
                      <div
                        style={{
                          display: 'flex',
                          gap: '10px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {Object.entries(filters).map(([key, value]) => {
                          if (
                            value !== 'all' &&
                            value !== '' &&
                            value !== 1 &&
                            value !== 25 &&
                            value !== 'endDate' &&
                            value !== 'asc'
                          ) {
                            return (
                              <Badge
                                key={key}
                                bg='primary'
                                style={{
                                  backgroundColor: colors.accent,
                                  color: 'white',
                                  padding: '6px 10px',
                                  borderRadius: '15px',
                                  fontSize: '0.8rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                {key === 'search'
                                  ? `Search: ${value}`
                                  : key === 'daysUntilExpiration'
                                  ? `Days: ${value
                                      .replace(/0-to-/g, '0-')
                                      .replace(/-days/g, 'd')
                                      .replace(/-/g, ' ')}`
                                  : key === 'lastContactFilter'
                                  ? `Contact: ${value
                                      .replace(/contacted-0-to-/g, '0-')
                                      .replace(/-/g, ' ')}`
                                  : key === 'hasWhatsApp'
                                  ? `WhatsApp: ${value}`
                                  : `${key}: ${value}`}
                                <span
                                  style={{
                                    cursor: 'pointer',
                                    marginLeft: '4px',
                                  }}
                                  onClick={() =>
                                    handleFilterChange(
                                      key,
                                      key === 'page'
                                        ? 1
                                        : key === 'limit'
                                        ? 25
                                        : key === 'sortBy'
                                        ? 'endDate'
                                        : key === 'sortOrder'
                                        ? 'asc'
                                        : 'all'
                                    )
                                  }
                                >
                                  ×
                                </span>
                              </Badge>
                            );
                          }
                          return null;
                        })}
                      </div>
                      <div
                        style={{
                          color: colors.muted,
                          fontSize: '0.9rem',
                          fontWeight: '500',
                        }}
                      >
                        Total Results: {pagination.total || 0}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Quick Filter Buttons */}
              <div
                style={{
                  borderTop: `1px solid ${colors.border}`,
                  paddingTop: '15px',
                  marginTop: '10px',
                }}
              >
                <div
                  style={{
                    color: colors.text,
                    fontWeight: '600',
                    marginBottom: '10px',
                    fontSize: '0.9rem',
                  }}
                >
                  🚀 Quick Filters:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Cumulative Time Range Filters */}
                  <Button
                    variant='outline-danger'
                    size='sm'
                    onClick={() =>
                      handleFilterChange('daysUntilExpiration', '0-to-7')
                    }
                    style={{
                      borderRadius: '20px',
                      fontWeight: '500',
                      fontSize: '0.8rem',
                    }}
                  >
                    ⚡ 0-7 Days Critical
                  </Button>
                  <Button
                    variant='outline-warning'
                    size='sm'
                    onClick={() =>
                      handleFilterChange('daysUntilExpiration', '0-to-14')
                    }
                    style={{
                      borderRadius: '20px',
                      fontWeight: '500',
                      fontSize: '0.8rem',
                    }}
                  >
                    🔥 0-14 Days Urgent
                  </Button>
                  <Button
                    variant='outline-success'
                    size='sm'
                    onClick={() =>
                      handleFilterChange('daysUntilExpiration', '0-to-30')
                    }
                    style={{
                      borderRadius: '20px',
                      fontWeight: '500',
                      fontSize: '0.8rem',
                    }}
                  >
                    📅 0-30 Days Monthly
                  </Button>
                  <Button
                    variant='outline-primary'
                    size='sm'
                    onClick={() =>
                      handleFilterChange('daysUntilExpiration', '0-to-60')
                    }
                    style={{
                      borderRadius: '20px',
                      fontWeight: '500',
                      fontSize: '0.8rem',
                    }}
                  >
                    📆 0-60 Days 2-Month
                  </Button>

                  {/* Cumulative Contact Filters */}
                  <Button
                    variant='outline-info'
                    size='sm'
                    onClick={() =>
                      handleFilterChange(
                        'lastContactFilter',
                        'contacted-0-to-7'
                      )
                    }
                    style={{
                      borderRadius: '20px',
                      fontWeight: '500',
                      fontSize: '0.8rem',
                    }}
                  >
                    🟢 Contacted 0-7d
                  </Button>
                  <Button
                    variant='outline-warning'
                    size='sm'
                    onClick={() =>
                      handleFilterChange(
                        'lastContactFilter',
                        'contacted-0-to-30'
                      )
                    }
                    style={{
                      borderRadius: '20px',
                      fontWeight: '500',
                      fontSize: '0.8rem',
                    }}
                  >
                    🟡 Contacted 0-30d
                  </Button>

                  {/* WhatsApp Filter */}
                  <Button
                    variant='outline-secondary'
                    size='sm'
                    onClick={() =>
                      handleFilterChange('hasWhatsApp', 'with-whatsapp')
                    }
                    style={{
                      borderRadius: '20px',
                      fontWeight: '500',
                      fontSize: '0.8rem',
                    }}
                  >
                    📱 Has WhatsApp
                  </Button>

                  {/* Never Contacted & Expired */}
                  <Button
                    variant='outline-dark'
                    size='sm'
                    onClick={() =>
                      handleFilterChange('lastContactFilter', 'never')
                    }
                    style={{
                      borderRadius: '20px',
                      fontWeight: '500',
                      fontSize: '0.8rem',
                    }}
                  >
                    🚫 Never Contacted
                  </Button>
                  <Button
                    variant='outline-dark'
                    size='sm'
                    onClick={() =>
                      handleFilterChange('daysUntilExpiration', 'expired')
                    }
                    style={{
                      borderRadius: '20px',
                      fontWeight: '500',
                      fontSize: '0.8rem',
                    }}
                  >
                    ❌ Expired
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Users Table */}
      <Row>
        <Col>
          <Card
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Card.Header style={{ backgroundColor: colors.cardHeaderBg }}>
              <div className='d-flex justify-content-between align-items-center flex-wrap gap-2'>
                <div>
                  <h5
                    style={{
                      color: colors.text,
                      marginBottom: '2px',
                      fontWeight: '600',
                    }}
                  >
                    Users ({pagination.total || 0}) - Individual Messaging
                  </h5>
                  <small style={{ color: colors.muted, fontSize: '0.8rem' }}>
                    {isMobileView
                      ? 'Tap WhatsApp to send messages'
                      : 'Click WhatsApp button to send personalized messages'}
                    {quickWhatsAppMode && (
                      <span style={{ color: '#25D366', fontWeight: '600' }}>
                        {' '}
                        • Quick Send Active
                      </span>
                    )}
                  </small>
                </div>
                <div className='d-flex align-items-center gap-2'>
                  {/* Quick WhatsApp Toggle Button */}
                  <Button
                    variant={quickWhatsAppMode ? 'success' : 'outline-success'}
                    size='sm'
                    onClick={handleQuickModeToggle}
                    style={{
                      borderRadius: '20px',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      backgroundColor: quickWhatsAppMode
                        ? '#25D366'
                        : 'transparent',
                      borderColor: '#25D366',
                      color: quickWhatsAppMode ? 'white' : '#25D366',
                      transition: 'all 0.3s ease',
                      boxShadow: quickWhatsAppMode
                        ? '0 4px 12px rgba(37, 211, 102, 0.3)'
                        : 'none',
                    }}
                  >
                    <FaBolt className='me-2' />
                    {quickWhatsAppMode
                      ? '⚡ Quick Send ON'
                      : '⚡ Quick Send OFF'}
                  </Button>

                  <Button
                    variant={isMobileView ? 'primary' : 'outline-secondary'}
                    size='sm'
                    onClick={() => setIsMobileView(!isMobileView)}
                    style={{
                      borderRadius: '20px',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                    }}
                  >
                    {isMobileView ? (
                      <FaMobile className='me-1' />
                    ) : (
                      <FaDesktop className='me-1' />
                    )}
                    {isMobileView ? 'Mobile' : 'Desktop'}
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body style={{ padding: isMobileView ? '10px' : 0 }}>
              {!isMobileView ? (
                // Desktop Table View
                <div style={{ overflowX: 'auto' }}>
                  <Table hover responsive style={{ marginBottom: 0 }}>
                    <thead style={{ backgroundColor: colors.cardHeaderBg }}>
                      <tr>
                        <th
                          style={{
                            color: colors.text,
                            borderColor: colors.border,
                          }}
                        >
                          User
                        </th>
                        <th
                          style={{
                            color: colors.text,
                            borderColor: colors.border,
                          }}
                        >
                          Time Frame Status
                        </th>
                        <th
                          style={{
                            color: colors.text,
                            borderColor: colors.border,
                          }}
                        >
                          End Date
                        </th>
                        <th
                          style={{
                            color: colors.text,
                            borderColor: colors.border,
                          }}
                        >
                          Last Contact
                        </th>
                        <th
                          style={{
                            color: colors.text,
                            borderColor: colors.border,
                          }}
                        >
                          Send WhatsApp Message
                        </th>
                        <th
                          style={{
                            color: colors.text,
                            borderColor: colors.border,
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td
                            colSpan='6'
                            className='text-center py-4'
                            style={{ color: colors.muted }}
                          >
                            No users found matching the current filters
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => {
                          const timeFrameInfo = formatTimeFrame(user);
                          const lastContactInfo = formatLastContact(user);

                          return (
                            <tr
                              key={user._id}
                              style={{ borderColor: colors.border }}
                            >
                              <td>
                                <div>
                                  <div
                                    style={{
                                      color: colors.text,
                                      fontWeight: '500',
                                    }}
                                  >
                                    {user.name}
                                  </div>
                                  <small style={{ color: colors.muted }}>
                                    {user.email}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <Badge bg={timeFrameInfo.variant}>
                                  {timeFrameInfo.text}
                                </Badge>
                              </td>
                              <td style={{ color: colors.text }}>
                                {user.timeFrame?.endDate
                                  ? new Date(
                                      user.timeFrame.endDate
                                    ).toLocaleDateString()
                                  : '-'}
                              </td>
                              <td>
                                <Badge bg={lastContactInfo.variant}>
                                  {lastContactInfo.text}
                                </Badge>
                              </td>
                              <td>
                                {user.whatsAppPhoneNumber ? (
                                  <Button
                                    variant='success'
                                    size='sm'
                                    onClick={() =>
                                      handleProcessIndividualMessage(user)
                                    }
                                    disabled={
                                      sendingMessage === user._id ||
                                      !messageTemplate.trim()
                                    }
                                    style={{
                                      backgroundColor: '#25D366',
                                      borderColor: '#25D366',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '8px 12px',
                                    }}
                                  >
                                    {sendingMessage === user._id ? (
                                      <Spinner animation='border' size='sm' />
                                    ) : (
                                      <>
                                        <FaWhatsapp />
                                        <span className='ms-1'>
                                          Send Message
                                        </span>
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <OverlayTrigger
                                    overlay={
                                      <Tooltip>
                                        No WhatsApp number available
                                      </Tooltip>
                                    }
                                  >
                                    <Button
                                      variant='outline-secondary'
                                      size='sm'
                                      disabled
                                    >
                                      <FaWhatsapp />
                                      <span className='ms-1'>No WhatsApp</span>
                                    </Button>
                                  </OverlayTrigger>
                                )}
                              </td>
                              <td>
                                <ButtonGroup size='sm'>
                                  <OverlayTrigger
                                    overlay={
                                      <Tooltip>View User Details</Tooltip>
                                    }
                                  >
                                    <Button
                                      variant='outline-primary'
                                      as={Link}
                                      to={`/admin/user/${user._id}/edit`}
                                    >
                                      <FaEye />
                                    </Button>
                                  </OverlayTrigger>
                                  <OverlayTrigger
                                    overlay={<Tooltip>Edit Time Frame</Tooltip>}
                                  >
                                    <Button
                                      variant='outline-secondary'
                                      as={Link}
                                      to={`/admin/user/${user._id}/edit#timeframe`}
                                    >
                                      <FaEdit />
                                    </Button>
                                  </OverlayTrigger>
                                </ButtonGroup>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </div>
              ) : (
                // Mobile Card View
                <div className='mobile-users-grid'>
                  {users.length === 0 ? (
                    <div
                      className='text-center py-4'
                      style={{ color: colors.muted }}
                    >
                      <FaUser
                        style={{
                          fontSize: '2rem',
                          marginBottom: '10px',
                          opacity: 0.5,
                        }}
                      />
                      <div>No users found matching the current filters</div>
                    </div>
                  ) : (
                    users.map((user) => {
                      const timeFrameInfo = formatTimeFrame(user);
                      const lastContactInfo = formatLastContact(user);

                      return (
                        <Card
                          key={user._id}
                          className='mb-3'
                          style={{
                            backgroundColor: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '12px',
                            boxShadow: isDarkMode
                              ? '0 2px 8px rgba(0,0,0,0.3)'
                              : '0 2px 8px rgba(0,0,0,0.1)',
                          }}
                        >
                          <Card.Body style={{ padding: '15px' }}>
                            {/* User Info */}
                            <div className='d-flex justify-content-between align-items-start mb-3'>
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    color: colors.text,
                                    fontWeight: '600',
                                    fontSize: '1.1rem',
                                    marginBottom: '4px',
                                  }}
                                >
                                  {user.name}
                                </div>
                                <div
                                  style={{
                                    color: colors.muted,
                                    fontSize: '0.85rem',
                                    marginBottom: '8px',
                                  }}
                                >
                                  {user.email}
                                </div>
                              </div>
                              <div className='d-flex gap-1'>
                                <Button
                                  variant='outline-primary'
                                  size='sm'
                                  as={Link}
                                  to={`/admin/user/${user._id}/edit`}
                                  style={{
                                    padding: '6px 8px',
                                    borderRadius: '8px',
                                  }}
                                >
                                  <FaEye size={12} />
                                </Button>
                                <Button
                                  variant='outline-secondary'
                                  size='sm'
                                  as={Link}
                                  to={`/admin/user/${user._id}/edit#timeframe`}
                                  style={{
                                    padding: '6px 8px',
                                    borderRadius: '8px',
                                  }}
                                >
                                  <FaEdit size={12} />
                                </Button>
                              </div>
                            </div>

                            {/* Status Badges */}
                            <div className='d-flex flex-wrap gap-2 mb-3'>
                              <Badge
                                bg={timeFrameInfo.variant}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '6px 10px',
                                  borderRadius: '12px',
                                }}
                              >
                                <FaClock className='me-1' size={10} />
                                {timeFrameInfo.text}
                              </Badge>
                              <Badge
                                bg={lastContactInfo.variant}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '6px 10px',
                                  borderRadius: '12px',
                                }}
                              >
                                <FaEnvelope className='me-1' size={10} />
                                {lastContactInfo.text}
                              </Badge>
                            </div>

                            {/* End Date */}
                            {user.timeFrame?.endDate && (
                              <div
                                style={{
                                  color: colors.muted,
                                  fontSize: '0.8rem',
                                  marginBottom: '15px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <FaCalendarAlt size={12} />
                                Ends:{' '}
                                {new Date(
                                  user.timeFrame.endDate
                                ).toLocaleDateString()}
                              </div>
                            )}

                            {/* WhatsApp Button */}
                            <div className='d-grid'>
                              {user.whatsAppPhoneNumber ? (
                                <Button
                                  variant='success'
                                  size='sm'
                                  onClick={() =>
                                    handleProcessIndividualMessage(user)
                                  }
                                  disabled={
                                    sendingMessage === user._id ||
                                    !messageTemplate.trim()
                                  }
                                  style={{
                                    backgroundColor: '#25D366',
                                    borderColor: '#25D366',
                                    borderRadius: '10px',
                                    padding: '10px',
                                    fontWeight: '600',
                                    position: 'relative',
                                  }}
                                >
                                  {sendingMessage === user._id ? (
                                    <>
                                      <Spinner
                                        animation='border'
                                        size='sm'
                                        className='me-2'
                                      />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <FaWhatsapp className='me-2' />
                                      {quickWhatsAppMode
                                        ? '⚡ Quick Send'
                                        : 'Send Message'}
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  variant='outline-secondary'
                                  size='sm'
                                  disabled
                                  style={{
                                    borderRadius: '10px',
                                    padding: '10px',
                                  }}
                                >
                                  <FaWhatsapp className='me-2' />
                                  No WhatsApp
                                </Button>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className='d-flex justify-content-center py-3'>
                  <ButtonGroup>
                    <Button
                      variant='outline-primary'
                      disabled={pagination.page <= 1}
                      onClick={() =>
                        handleFilterChange('page', pagination.page - 1)
                      }
                    >
                      Previous
                    </Button>
                    {[...Array(Math.min(pagination.pages, 5))].map(
                      (_, index) => {
                        let pageNum;
                        if (pagination.pages <= 5) {
                          pageNum = index + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = index + 1;
                        } else if (pagination.page >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + index;
                        } else {
                          pageNum = pagination.page - 2 + index;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={
                              pagination.page === pageNum
                                ? 'primary'
                                : 'outline-primary'
                            }
                            onClick={() => handleFilterChange('page', pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                    <Button
                      variant='outline-primary'
                      disabled={pagination.page >= pagination.pages}
                      onClick={() =>
                        handleFilterChange('page', pagination.page + 1)
                      }
                    >
                      Next
                    </Button>
                  </ButtonGroup>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Template Placeholders Modal */}
      <Modal
        show={showMessageModal}
        onHide={() => setShowMessageModal(false)}
        size='lg'
      >
        <Modal.Header closeButton>
          <Modal.Title>Message Template Placeholders</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className='text-muted mb-3'>
            Use these placeholders in your message template to personalize
            messages for each user:
          </p>
          <Row>
            {templateHelp.map((item, index) => (
              <Col md={6} key={index} className='mb-2'>
                <div className='d-flex align-items-center'>
                  <code
                    style={{
                      backgroundColor: colors.cardHeaderBg,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      marginRight: '8px',
                      minWidth: '140px',
                    }}
                  >
                    {item.placeholder}
                  </code>
                  <span style={{ color: colors.text }}>{item.description}</span>
                </div>
              </Col>
            ))}
          </Row>
          <Alert variant='info' className='mt-3'>
            <FaInfoCircle className='me-2' />
            Example: "Hi [user], your subscription ends on [endDate]
            ([daysUntilEnd] days remaining)"
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant='secondary'
            onClick={() => setShowMessageModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Individual Message Modal */}
      <Modal
        show={showIndividualMessageModal}
        onHide={() => setShowIndividualMessageModal(false)}
        size='lg'
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaWhatsapp className='me-2' style={{ color: '#25D366' }} />
            Send WhatsApp Message to {selectedUser?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <div className='mb-3'>
                <h6 style={{ color: colors.text }}>User Information:</h6>
                <div
                  style={{
                    backgroundColor: colors.cardHeaderBg,
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '15px',
                  }}
                >
                  <div>
                    <strong>Name:</strong> {selectedUser.name}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedUser.email}
                  </div>
                  <div>
                    <strong>WhatsApp:</strong>{' '}
                    {selectedUser.whatsAppPhoneNumber}
                  </div>
                  {selectedUser.timeFrame?.endDate && (
                    <div>
                      <strong>Subscription End:</strong>{' '}
                      {new Date(
                        selectedUser.timeFrame.endDate
                      ).toLocaleDateString()}
                    </div>
                  )}
                  {selectedUser.daysUntilEnd && (
                    <div>
                      <strong>Days Until End:</strong>{' '}
                      {selectedUser.daysUntilEnd} days
                    </div>
                  )}
                </div>
              </div>

              <div className='mb-3'>
                <h6 style={{ color: colors.text }}>Personalized Message:</h6>
                <div
                  style={{
                    backgroundColor: colors.cardHeaderBg,
                    padding: '15px',
                    borderRadius: '8px',
                    color: colors.text,
                    border: `2px solid ${colors.accent}`,
                    fontSize: '1.1rem',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {processedMessage}
                </div>
              </div>

              <Alert variant='info'>
                <FaInfoCircle className='me-2' />
                This message has been personalized with the user's specific
                information using your template placeholders.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant='secondary'
            onClick={() => setShowIndividualMessageModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant='success'
            onClick={() =>
              handleSendWhatsApp(selectedUser?._id, processedMessage)
            }
            disabled={sendingMessage || !processedMessage.trim()}
            style={{
              backgroundColor: '#25D366',
              borderColor: '#25D366',
            }}
          >
            {sendingMessage ? (
              <>
                <Spinner animation='border' size='sm' className='me-2' />
                Sending...
              </>
            ) : (
              <>
                <FaWhatsapp className='me-2' />
                Send WhatsApp Message
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TimeFrameManagementScreen;
