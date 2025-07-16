import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Badge,
  Button,
  Collapse,
  Modal,
  Form,
} from 'react-bootstrap';
import {
  FaFire,
  FaEdit,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaHeart,
  FaBolt,
  FaUtensils,
  FaSave,
  FaTimes,
} from 'react-icons/fa';
import { format } from 'date-fns';
import {
  useUpdateDietEntryMutation,
  useDeleteDietEntryMutation,
} from '../slices/dietApiSlice';
import { successToast, errorToast } from '../utils/toastConfig';

const MealTimelineCard = ({
  meal,
  amoledColors,
  isDarkMode,
  onUpdate,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isVerySmallMobile, setIsVerySmallMobile] = useState(window.innerWidth <= 480);

  const [editFormData, setEditFormData] = useState({
    mealType: meal.mealType,
    items: meal.items || [{ quantity: 1, unit: 'serving', notes: '' }],
    feeling: meal.feeling,
    energyLevel: meal.energyLevel,
    comments: meal.comments || '',
    date: format(new Date(meal.date), "yyyy-MM-dd'T'HH:mm"),
    customMealName: meal.customMealName || '',
    customMealDescription: meal.customMealDescription || '',
    customNutrition: meal.customNutrition || {
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      fiber: meal.fiber || 0,
    },
  });

  const [updateDietEntry, { isLoading: isUpdating }] =
    useUpdateDietEntryMutation();
  const [deleteDietEntry, { isLoading: isDeleting }] =
    useDeleteDietEntryMutation();

  // Get feeling variant for badges
  const getFeelingVariant = (feeling) => {
    switch (feeling) {
      case 'very-satisfied':
        return 'success';
      case 'satisfied':
        return 'success';
      case 'neutral':
        return 'warning';
      case 'hungry':
        return 'danger';
      case 'very-hungry':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Get energy level color
  const getEnergyColor = (level) => {
    switch (level) {
      case 'high':
        return amoledColors.success;
      case 'medium':
        return amoledColors.warning;
      case 'low':
        return amoledColors.danger;
      default:
        return amoledColors.textMuted;
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const updateData = {
        id: meal._id,
        ...editFormData,
        isCustomMeal: meal.isCustomMeal,
        customNutrition: meal.isCustomMeal
          ? editFormData.customNutrition
          : undefined,
      };

      await updateDietEntry(updateData).unwrap();
      successToast('Meal updated successfully!');
      setShowEditModal(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      errorToast(error?.data?.message || 'Failed to update meal');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteDietEntry(meal._id).unwrap();
      successToast('Meal deleted successfully!');
      setShowDeleteModal(false);
      if (onDelete) onDelete();
    } catch (error) {
      errorToast(error?.data?.message || 'Failed to delete meal');
    }
  };

  // Add new item to edit form
  const addItem = () => {
    setEditFormData({
      ...editFormData,
      items: [
        ...editFormData.items,
        { quantity: 1, unit: 'serving', notes: '' },
      ],
    });
  };

  // Remove item from edit form
  const removeItem = (index) => {
    if (editFormData.items.length > 1) {
      setEditFormData({
        ...editFormData,
        items: editFormData.items.filter((_, i) => i !== index),
      });
    }
  };

  // Update item in edit form
  const updateItem = (index, field, value) => {
    const updatedItems = [...editFormData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setEditFormData({ ...editFormData, items: updatedItems });
  };

  // Add useEffect for window resize handling
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsVerySmallMobile(window.innerWidth <= 480);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <div
        style={{
          backgroundColor: amoledColors.cardBg,
          border: `1px solid ${amoledColors.border}`,
          borderRadius: isVerySmallMobile ? '6px' : '12px',
          marginBottom: isVerySmallMobile ? '0.5rem' : '1rem',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          boxShadow: isVerySmallMobile ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {/* Main Meal Card */}
        <div style={{ padding: isVerySmallMobile ? '0.5rem' : '1rem' }}>
          {isVerySmallMobile ? (
            // Compact mobile layout
            <>
              {/* Top row: Image, Meal Info, Actions */}
              <div className='d-flex align-items-center gap-2'>
                {/* Meal Image */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    backgroundColor: meal.image || meal.product?.image 
                      ? 'transparent' 
                      : isDarkMode
                        ? `linear-gradient(135deg, ${amoledColors.accent}20, ${amoledColors.accent}40)`
                        : `linear-gradient(135deg, ${amoledColors.accent}30, ${amoledColors.accent}50)`,
                    border: `1px solid ${isDarkMode ? amoledColors.accent + '30' : amoledColors.accent + '40'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  {meal.image || meal.product?.image ? (
                    <img
                      src={meal.image || meal.product.image}
                      alt={meal.customMealName || meal.product?.name || 'Meal'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '5px',
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.background = isDarkMode
                          ? `linear-gradient(135deg, ${amoledColors.accent}20, ${amoledColors.accent}40)`
                          : `linear-gradient(135deg, ${amoledColors.accent}30, ${amoledColors.accent}50)`;
                        const fallbackIcon = e.target.parentElement.querySelector('.fallback-icon');
                        if (fallbackIcon) {
                          fallbackIcon.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className="fallback-icon"
                    style={{
                      display: meal.image || meal.product?.image ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        color: amoledColors.accent,
                        textTransform: 'uppercase',
                      }}
                    >
                      {(meal.isCustomMeal 
                        ? meal.customMealName 
                        : meal.product?.name || 'M'
                      ).charAt(0)}
                    </span>
                  </div>
                </div>

                {/* Meal Info - Flex grow */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Header with meal type and time */}
                  <div className='d-flex align-items-center justify-content-between mb-2'>
                    <div className='d-flex align-items-center gap-2' style={{ flex: 1, minWidth: 0 }}>
                      <Badge
                        style={{
                          backgroundColor: amoledColors.accent + '25',
                          color: amoledColors.accent,
                          fontSize: '0.6rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '600',
                          border: `1px solid ${amoledColors.accent}40`,
                        }}
                      >
                        {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                      </Badge>
                      <small style={{ 
                        color: amoledColors.textMuted,
                        fontSize: '0.55rem',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}>
                        <FaClock style={{ fontSize: '0.5rem' }} />
                        {format(new Date(meal.date), 'h:mm a')}
                      </small>
                    </div>
                    
                    {/* Action Buttons - Better positioned and sized for mobile */}
                    <div className='d-flex align-items-center' style={{ flexShrink: 0, gap: '0.25rem' }}>
                      <Button
                        variant='outline-secondary'
                        size='sm'
                        onClick={() => setShowEditModal(true)}
                        style={{
                          borderColor: amoledColors.border,
                          color: amoledColors.textMuted,
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                          padding: '3px 5px',
                          fontSize: '0.6rem',
                          lineHeight: 1,
                          borderRadius: '4px',
                          minWidth: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${amoledColors.border}`,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <FaEdit size={9} />
                      </Button>
                      <Button
                        variant='outline-danger'
                        size='sm'
                        onClick={() => setShowDeleteModal(true)}
                        style={{ 
                          padding: '3px 5px',
                          fontSize: '0.6rem',
                          lineHeight: 1,
                          borderRadius: '4px',
                          minWidth: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid #dc3545`,
                          color: '#dc3545',
                          backgroundColor: isDarkMode ? 'rgba(220,53,69,0.1)' : 'rgba(220,53,69,0.05)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <FaTrash size={9} />
                      </Button>
                    </div>
                  </div>

                  {/* Meal Name */}
                  <h6
                    style={{
                      color: amoledColors.text,
                      marginBottom: '0.2rem',
                      fontSize: '0.75rem',
                      lineHeight: '1.1',
                      fontWeight: '600',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {meal.isCustomMeal
                      ? meal.customMealName
                      : meal.product?.name || 'Unknown Meal'}
                  </h6>

                  {/* Compact nutrition info - Better mobile layout */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.65rem',
                      marginBottom: '0.3rem',
                      flexWrap: 'nowrap',
                      overflow: 'hidden',
                      padding: '2px 0',
                    }}
                  >
                    <span style={{ 
                      color: amoledColors.warning,
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      whiteSpace: 'nowrap',
                    }}>
                      <FaFire size={8} />
                      {meal.calories}
                    </span>
                    <span style={{ color: amoledColors.success, fontWeight: '600', whiteSpace: 'nowrap' }}>
                      P:{Math.round(meal.protein)}
                    </span>
                    <span style={{ color: amoledColors.info, fontWeight: '600', whiteSpace: 'nowrap' }}>
                      C:{Math.round(meal.carbs)}
                    </span>
                    <span style={{ color: amoledColors.accent, fontWeight: '600', whiteSpace: 'nowrap' }}>
                      F:{Math.round(meal.fat)}
                    </span>
                  </div>

                  {/* Feeling and Energy - Better mobile layout */}
                  <div className='d-flex align-items-center gap-3 mt-1'>
                    <div className='d-flex align-items-center gap-1'>
                      <FaHeart 
                        size={8} 
                        style={{ color: getFeelingVariant(meal.feeling) === 'success' ? amoledColors.success : 
                                        getFeelingVariant(meal.feeling) === 'warning' ? amoledColors.warning : amoledColors.danger }} 
                      />
                      <span
                        style={{
                          fontSize: '0.6rem',
                          color: amoledColors.textMuted,
                          fontWeight: '600',
                        }}
                      >
                        {meal.feeling.replace('-', ' ').replace('very ', '')}
                      </span>
                    </div>
                    <div className='d-flex align-items-center gap-1'>
                      <FaBolt 
                        size={8} 
                        style={{ color: getEnergyColor(meal.energyLevel) }} 
                      />
                      <span
                        style={{
                          fontSize: '0.6rem',
                          color: getEnergyColor(meal.energyLevel),
                          fontWeight: '600',
                        }}
                      >
                        {meal.energyLevel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Desktop/tablet layout
            <Row className='align-items-center'>
              <Col xs={2} className='text-center'>
                {/* Meal Image */}
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    backgroundColor: meal.image || meal.product?.image 
                      ? 'transparent' 
                      : isDarkMode
                        ? `linear-gradient(135deg, ${amoledColors.accent}20, ${amoledColors.accent}40)`
                        : `linear-gradient(135deg, ${amoledColors.accent}30, ${amoledColors.accent}50)`,
                    border: `2px solid ${isDarkMode ? amoledColors.accent + '30' : amoledColors.accent + '40'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    margin: '0 auto',
                    position: 'relative',
                  }}
                >
                  {meal.image || meal.product?.image ? (
                    <img
                      src={meal.image || meal.product.image}
                      alt={meal.customMealName || meal.product?.name || 'Meal'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '10px',
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.background = isDarkMode
                          ? `linear-gradient(135deg, ${amoledColors.accent}20, ${amoledColors.accent}40)`
                          : `linear-gradient(135deg, ${amoledColors.accent}30, ${amoledColors.accent}50)`;
                        const fallbackIcon = e.target.parentElement.querySelector('.fallback-icon');
                        if (fallbackIcon) {
                          fallbackIcon.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className="fallback-icon"
                    style={{
                      display: meal.image || meal.product?.image ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: amoledColors.accent,
                        textTransform: 'uppercase',
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                      }}
                    >
                      {(meal.isCustomMeal 
                        ? meal.customMealName 
                        : meal.product?.name || 'M'
                      ).charAt(0)}
                    </span>
                  </div>
                </div>
              </Col>

              <Col xs={6}>
                {/* Meal Info */}
                <div className='d-flex align-items-center mb-2'>
                  <Badge
                    style={{
                      backgroundColor: amoledColors.accent + '25',
                      color: amoledColors.accent,
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      marginRight: '0.75rem',
                      border: `1px solid ${amoledColors.accent}40`,
                    }}
                  >
                    {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                  </Badge>
                  <small style={{ 
                    color: amoledColors.textMuted,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <FaClock />
                    {format(new Date(meal.date), 'h:mm a')}
                  </small>
                </div>

                <h6
                  style={{
                    color: amoledColors.text,
                    marginBottom: '0.5rem',
                    fontSize: '1rem',
                    lineHeight: '1.2',
                  }}
                >
                  {meal.isCustomMeal
                    ? meal.customMealName
                    : meal.product?.name || 'Unknown Meal'}
                </h6>

                {/* Description preview for desktop only */}
                {meal.customMealDescription && (
                  <p
                    style={{
                      color: amoledColors.textSecondary,
                      fontSize: '0.85rem',
                      marginBottom: '0.5rem',
                      lineHeight: '1.3',
                    }}
                  >
                    {meal.customMealDescription.length > 40 
                      ? `${meal.customMealDescription.substring(0, 40)}...` 
                      : meal.customMealDescription}
                  </p>
                )}

                <div
                  className='d-flex flex-wrap gap-1'
                  style={{ fontSize: '0.8rem' }}
                >
                  <span style={{ color: amoledColors.textMuted }}>
                    <FaFire
                      style={{
                        color: amoledColors.warning,
                        marginRight: '0.25rem',
                      }}
                    />
                    {meal.calories} cal
                  </span>
                  <span style={{ color: amoledColors.textMuted }}>
                    P: {Math.round(meal.protein)}g
                  </span>
                  <span style={{ color: amoledColors.textMuted }}>
                    C: {Math.round(meal.carbs)}g
                  </span>
                  <span style={{ color: amoledColors.textMuted }}>
                    F: {Math.round(meal.fat)}g
                  </span>
                </div>
              </Col>

              <Col xs={2} className='text-center'>
                {/* Feeling & Energy */}
                <div className='d-flex flex-column gap-2 align-items-center'>
                  <Badge
                    bg={getFeelingVariant(meal.feeling)}
                    style={{ 
                      fontSize: '0.7rem',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontWeight: '600',
                    }}
                  >
                    <FaHeart className='me-1' size={10} />
                    {meal.feeling.replace('-', ' ')}
                  </Badge>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: getEnergyColor(meal.energyLevel),
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }}
                  >
                    <FaBolt size={10} />
                    {meal.energyLevel}
                  </div>
                </div>
              </Col>

              <Col xs={2} className='text-end'>
                {/* Action Buttons */}
                <div className='d-flex flex-column gap-2'>
                  <Button
                    variant='outline-secondary'
                    size='sm'
                    onClick={() => setShowEditModal(true)}
                    style={{
                      borderColor: amoledColors.border,
                      color: amoledColors.textMuted,
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                      minHeight: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaEdit size={14} />
                  </Button>
                  <Button
                    variant='outline-danger'
                    size='sm'
                    onClick={() => setShowDeleteModal(true)}
                    style={{ 
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? 'rgba(220,53,69,0.1)' : 'rgba(220,53,69,0.05)',
                      transition: 'all 0.2s ease',
                      minHeight: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaTrash size={14} />
                  </Button>
                </div>
              </Col>
            </Row>
          )}

          {/* Expand/Collapse Button */}
          <Row className={isVerySmallMobile ? 'mt-1' : 'mt-2'}>
            <Col className='text-center'>
              <Button
                variant='link'
                onClick={() => setExpanded(!expanded)}
                style={{
                  color: amoledColors.textMuted,
                  textDecoration: 'none',
                  fontSize: isVerySmallMobile ? '0.65rem' : '0.8rem',
                  padding: isVerySmallMobile ? '0.15rem' : '0.25rem',
                  lineHeight: 1,
                }}
              >
                {expanded ? (
                  <>
                    <FaChevronUp className='me-1' size={isVerySmallMobile ? 8 : 10} />
                    Less
                  </>
                ) : (
                  <>
                    <FaChevronDown className='me-1' size={isVerySmallMobile ? 8 : 10} />
                    More
                  </>
                )}
              </Button>
            </Col>
          </Row>
        </div>

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <div>
            <div
              style={{
                backgroundColor: isDarkMode
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(0,0,0,0.03)',
                borderTop: `1px solid ${amoledColors.border}`,
                padding: isVerySmallMobile ? '0.5rem' : '1rem',
              }}
            >
              {/* Description Section - Always show full description here */}
              {meal.customMealDescription && (
                <div style={{ marginBottom: isVerySmallMobile ? '1rem' : '1.25rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <FaUtensils
                      size={isVerySmallMobile ? 10 : 14}
                      style={{ color: amoledColors.accent, marginRight: '0.4rem' }}
                    />
                    <h6
                      style={{
                        color: amoledColors.text,
                        fontSize: isVerySmallMobile ? '0.7rem' : '0.9rem',
                        marginBottom: '0',
                        fontWeight: '600',
                      }}
                    >
                      Description
                    </h6>
                  </div>
                  <div
                    style={{
                      padding: isVerySmallMobile ? '0.4rem' : '0.75rem',
                      backgroundColor: isDarkMode
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.05)',
                      borderRadius: isVerySmallMobile ? '6px' : '8px',
                      border: `1px solid ${amoledColors.border}`,
                    }}
                  >
                    <p
                      style={{
                        color: amoledColors.textSecondary,
                        fontSize: isVerySmallMobile ? '0.65rem' : '0.85rem',
                        marginBottom: '0',
                        lineHeight: '1.3',
                      }}
                    >
                      {meal.customMealDescription}
                    </p>
                  </div>
                </div>
              )}

              {/* Estimation Notice */}
              {meal.comments && meal.comments.includes('Estimated based on') && (
                <div style={{ marginBottom: isVerySmallMobile ? '1rem' : '1.25rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <FaClock
                      size={isVerySmallMobile ? 10 : 14}
                      style={{ color: amoledColors.warning, marginRight: '0.4rem' }}
                    />
                    <h6
                      style={{
                        color: amoledColors.text,
                        fontSize: isVerySmallMobile ? '0.7rem' : '0.9rem',
                        marginBottom: '0',
                        fontWeight: '600',
                      }}
                    >
                      Estimation Notice
                    </h6>
                  </div>
                  <div
                    style={{
                      padding: isVerySmallMobile ? '0.4rem' : '0.75rem',
                      backgroundColor: isDarkMode
                        ? 'rgba(251, 146, 60, 0.1)'
                        : 'rgba(251, 146, 60, 0.1)',
                      borderRadius: isVerySmallMobile ? '6px' : '8px',
                      border: `1px solid ${isDarkMode ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.3)'}`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: isVerySmallMobile ? '0.6rem' : '0.8rem',
                        color: amoledColors.textMuted,
                        marginBottom: '0',
                        fontStyle: 'italic',
                        lineHeight: '1.3',
                      }}
                    >
                      {meal.comments}
                    </p>
                  </div>
                </div>
              )}

              <Row>
                <Col md={isVerySmallMobile ? 12 : 6} xs={12}>
                  {/* Nutrition Details Section */}
                  <div style={{ marginBottom: isVerySmallMobile ? '1rem' : '0' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: isVerySmallMobile ? '0.5rem' : '0.75rem',
                      }}
                    >
                      <FaFire
                        size={isVerySmallMobile ? 10 : 14}
                        style={{ color: amoledColors.warning, marginRight: '0.4rem' }}
                      />
                      <h6
                        style={{
                          color: amoledColors.text,
                          fontSize: isVerySmallMobile ? '0.7rem' : '0.9rem',
                          marginBottom: '0',
                          fontWeight: '600',
                        }}
                      >
                        Nutrition
                      </h6>
                    </div>
                    
                    {/* Complete nutrition breakdown */}
                    <div
                      style={{
                        padding: isVerySmallMobile ? '0.4rem' : '0.5rem',
                        backgroundColor: isDarkMode
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.05)',
                        borderRadius: isVerySmallMobile ? '4px' : '6px',
                        border: `1px solid ${amoledColors.border}`,
                        marginBottom: isVerySmallMobile ? '0.5rem' : '0.75rem',
                      }}
                    >
                      <div 
                        style={{
                          display: isVerySmallMobile ? 'flex' : 'grid',
                          gridTemplateColumns: isVerySmallMobile ? 'none' : 'repeat(auto-fit, minmax(60px, 1fr))',
                          gap: isVerySmallMobile ? '0.5rem' : '0.5rem',
                          alignItems: 'center',
                          justifyContent: isVerySmallMobile ? 'space-between' : 'initial',
                          flexWrap: isVerySmallMobile ? 'nowrap' : 'initial',
                          overflow: isVerySmallMobile ? 'auto' : 'initial',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'center', flexShrink: isVerySmallMobile ? 0 : 'initial' }}>
                          <span
                            style={{
                              fontSize: isVerySmallMobile ? '0.65rem' : '0.9rem',
                              fontWeight: 'bold',
                              color: amoledColors.warning,
                            }}
                          >
                            {meal.calories}
                          </span>
                          <span
                            style={{
                              fontSize: isVerySmallMobile ? '0.5rem' : '0.65rem',
                              color: amoledColors.textMuted,
                            }}
                          >
                            cal
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'center', flexShrink: isVerySmallMobile ? 0 : 'initial' }}>
                          <span
                            style={{
                              fontSize: isVerySmallMobile ? '0.65rem' : '0.9rem',
                              fontWeight: 'bold',
                              color: amoledColors.success,
                            }}
                          >
                            {Math.round(meal.protein)}g
                          </span>
                          <span
                            style={{
                              fontSize: isVerySmallMobile ? '0.5rem' : '0.65rem',
                              color: amoledColors.textMuted,
                            }}
                          >
                            P
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'center', flexShrink: isVerySmallMobile ? 0 : 'initial' }}>
                          <span
                            style={{
                              fontSize: isVerySmallMobile ? '0.65rem' : '0.9rem',
                              fontWeight: 'bold',
                              color: amoledColors.info,
                            }}
                          >
                            {Math.round(meal.carbs)}g
                          </span>
                          <span
                            style={{
                              fontSize: isVerySmallMobile ? '0.5rem' : '0.65rem',
                              color: amoledColors.textMuted,
                            }}
                          >
                            C
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'center', flexShrink: isVerySmallMobile ? 0 : 'initial' }}>
                          <span
                            style={{
                              fontSize: isVerySmallMobile ? '0.65rem' : '0.9rem',
                              fontWeight: 'bold',
                              color: amoledColors.accent,
                            }}
                          >
                            {Math.round(meal.fat)}g
                          </span>
                          <span
                            style={{
                              fontSize: isVerySmallMobile ? '0.5rem' : '0.65rem',
                              color: amoledColors.textMuted,
                            }}
                          >
                            F
                          </span>
                        </div>
                        
                        {meal.fiber > 0 && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.2rem', 
                            justifyContent: 'center',
                            gridColumn: isVerySmallMobile ? 'auto' : 'auto',
                            flexShrink: isVerySmallMobile ? 0 : 'initial',
                          }}>
                            <span
                              style={{
                                fontSize: isVerySmallMobile ? '0.6rem' : '0.85rem',
                                fontWeight: 'bold',
                                color: amoledColors.textSecondary,
                              }}
                            >
                              {Math.round(meal.fiber)}g
                            </span>
                            <span
                              style={{
                                fontSize: isVerySmallMobile ? '0.5rem' : '0.65rem',
                                color: amoledColors.textMuted,
                              }}
                            >
                              Fiber
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantities Section */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <FaUtensils
                        size={isVerySmallMobile ? 8 : 12}
                        style={{ color: amoledColors.textMuted, marginRight: '0.4rem' }}
                      />
                      <h6
                        style={{
                          color: amoledColors.text,
                          fontSize: isVerySmallMobile ? '0.65rem' : '0.85rem',
                          marginBottom: '0',
                          fontWeight: '500',
                        }}
                      >
                        Quantities
                      </h6>
                    </div>
                    {meal.items?.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          fontSize: isVerySmallMobile ? '0.6rem' : '0.8rem',
                          color: amoledColors.textMuted,
                          marginBottom: '0.2rem',
                          paddingLeft: isVerySmallMobile ? '1rem' : '1.25rem',
                          lineHeight: '1.3',
                        }}
                      >
                        • {item.quantity} {item.unit}
                        {item.notes && ` (${item.notes})`}
                      </div>
                    ))}
                  </div>
                </Col>

                <Col md={isVerySmallMobile ? 12 : 6} xs={12}>
                  {/* Comments Section */}
                  {meal.comments && !meal.comments.includes('Estimated based on') && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <FaEdit
                          size={isVerySmallMobile ? 12 : 14}
                          style={{ color: amoledColors.info, marginRight: '0.5rem' }}
                        />
                        <h6
                          style={{
                            color: amoledColors.text,
                            fontSize: isVerySmallMobile ? '0.8rem' : '0.9rem',
                            marginBottom: '0',
                            fontWeight: '600',
                          }}
                        >
                          Notes
                        </h6>
                      </div>
                      <div
                        style={{
                          padding: isVerySmallMobile ? '0.5rem' : '0.75rem',
                          backgroundColor: isDarkMode
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.05)',
                          borderRadius: '8px',
                          border: `1px solid ${amoledColors.border}`,
                        }}
                      >
                        <p
                          style={{
                            fontSize: isVerySmallMobile ? '0.7rem' : '0.8rem',
                            color: amoledColors.textMuted,
                            marginBottom: '0',
                            fontStyle: 'italic',
                            lineHeight: '1.3',
                          }}
                        >
                          "{meal.comments}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Product Information Section */}
                  {meal.product && !meal.isCustomMeal && (
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <FaUtensils
                          size={isVerySmallMobile ? 12 : 14}
                          style={{ color: amoledColors.info, marginRight: '0.5rem' }}
                        />
                        <h6
                          style={{
                            color: amoledColors.text,
                            fontSize: isVerySmallMobile ? '0.8rem' : '0.9rem',
                            marginBottom: '0',
                            fontWeight: '600',
                          }}
                        >
                          Product Info
                        </h6>
                      </div>
                      <div
                        style={{
                          padding: isVerySmallMobile ? '0.5rem' : '0.75rem',
                          backgroundColor: isDarkMode
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.05)',
                          borderRadius: '8px',
                          border: `1px solid ${amoledColors.border}`,
                        }}
                      >
                        {meal.product.description && (
                          <p
                            style={{
                              fontSize: isVerySmallMobile ? '0.7rem' : '0.8rem',
                              color: amoledColors.textMuted,
                              marginBottom: '0.75rem',
                              lineHeight: '1.3',
                            }}
                          >
                            {isVerySmallMobile 
                              ? meal.product.description.substring(0, 80) + (meal.product.description.length > 80 ? '...' : '')
                              : meal.product.description.substring(0, 120) + (meal.product.description.length > 120 ? '...' : '')
                            }
                          </p>
                        )}
                        {meal.product.mealType && (
                          <div className='d-flex flex-wrap gap-1'>
                            {meal.product.mealType.map((type, index) => (
                              <Badge
                                key={index}
                                bg='secondary'
                                style={{ 
                                  fontSize: isVerySmallMobile ? '0.55rem' : '0.6rem',
                                  backgroundColor: amoledColors.accent + '30',
                                  color: amoledColors.accent,
                                }}
                              >
                                {type}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Col>
              </Row>
            </div>
          </div>
        </Collapse>
      </div>

      {/* Edit Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size={isMobile ? 'md' : 'lg'}
        centered
        fullscreen={isVerySmallMobile ? 'sm-down' : false}
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: amoledColors.cardBg,
            borderColor: amoledColors.border,
          }}
        >
          <Modal.Title style={{ color: amoledColors.text }}>
            Edit Meal
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body
            style={{
              backgroundColor: amoledColors.cardBg,
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
          >
            <Row>
              <Col md={6}>
                {/* Date & Time */}
                <Form.Group className='mb-3'>
                  <Form.Label style={{ color: amoledColors.text }}>
                    Date & Time
                  </Form.Label>
                  <Form.Control
                    type='datetime-local'
                    value={editFormData.date}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, date: e.target.value })
                    }
                    style={{
                      backgroundColor: amoledColors.cardBg,
                      borderColor: amoledColors.border,
                      color: amoledColors.text,
                    }}
                  />
                </Form.Group>

                {/* Meal Type */}
                <Form.Group className='mb-3'>
                  <Form.Label style={{ color: amoledColors.text }}>
                    Meal Type
                  </Form.Label>
                  <Form.Select
                    value={editFormData.mealType}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        mealType: e.target.value,
                      })
                    }
                    style={{
                      backgroundColor: amoledColors.cardBg,
                      borderColor: amoledColors.border,
                      color: amoledColors.text,
                    }}
                  >
                    <option value='breakfast'>Breakfast</option>
                    <option value='lunch'>Lunch</option>
                    <option value='dinner'>Dinner</option>
                    <option value='snack'>Snack</option>
                    <option value='other'>Other</option>
                  </Form.Select>
                </Form.Group>

                {/* Custom Meal Name */}
                {meal.isCustomMeal && (
                  <>
                    <Form.Group className='mb-3'>
                      <Form.Label style={{ color: amoledColors.text }}>
                        Meal Name
                      </Form.Label>
                      <Form.Control
                        type='text'
                        value={editFormData.customMealName}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            customMealName: e.target.value,
                          })
                        }
                        style={{
                          backgroundColor: amoledColors.cardBg,
                          borderColor: amoledColors.border,
                          color: amoledColors.text,
                        }}
                      />
                    </Form.Group>
                    <Form.Group className='mb-3'>
                      <Form.Label style={{ color: amoledColors.text }}>
                        Description
                      </Form.Label>
                      <Form.Control
                        as='textarea'
                        rows={3}
                        value={editFormData.customMealDescription}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            customMealDescription: e.target.value,
                          })
                        }
                        style={{
                          backgroundColor: amoledColors.cardBg,
                          borderColor: amoledColors.border,
                          color: amoledColors.text,
                        }}
                        placeholder='Describe your meal ingredients, cooking method, or any notes...'
                      />
                    </Form.Group>
                  </>
                )}

                {/* Quantities */}
                <Form.Group className='mb-3'>
                  <Form.Label style={{ color: amoledColors.text }}>
                    Quantities
                  </Form.Label>
                  {editFormData.items.map((item, index) => (
                    <div key={index} className='d-flex gap-2 mb-2'>
                      <Form.Control
                        type='number'
                        step='0.1'
                        min='0'
                        placeholder='Qty'
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'quantity',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        style={{
                          backgroundColor: amoledColors.cardBg,
                          borderColor: amoledColors.border,
                          color: amoledColors.text,
                          flex: '0 0 80px',
                        }}
                      />
                      <Form.Select
                        value={item.unit}
                        onChange={(e) =>
                          updateItem(index, 'unit', e.target.value)
                        }
                        style={{
                          backgroundColor: amoledColors.cardBg,
                          borderColor: amoledColors.border,
                          color: amoledColors.text,
                          flex: '1',
                        }}
                      >
                        <option value='serving'>Serving</option>
                        <option value='grams'>Grams</option>
                        <option value='pieces'>Pieces</option>
                        <option value='cups'>Cups</option>
                        <option value='tablespoons'>Tbsp</option>
                        <option value='oz'>Oz</option>
                        <option value='ml'>mL</option>
                      </Form.Select>
                      {editFormData.items.length > 1 && (
                        <Button
                          variant='outline-danger'
                          size='sm'
                          onClick={() => removeItem(index)}
                          style={{ flex: '0 0 auto' }}
                        >
                          <FaTimes />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type='button'
                    variant='outline-primary'
                    size='sm'
                    onClick={addItem}
                    style={{
                      borderColor: amoledColors.accent,
                      color: amoledColors.accent,
                    }}
                  >
                    Add Quantity
                  </Button>
                </Form.Group>
              </Col>

              <Col md={6}>
                {/* Feeling */}
                <Form.Group className='mb-3'>
                  <Form.Label style={{ color: amoledColors.text }}>
                    How did you feel?
                  </Form.Label>
                  <Form.Select
                    value={editFormData.feeling}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        feeling: e.target.value,
                      })
                    }
                    style={{
                      backgroundColor: amoledColors.cardBg,
                      borderColor: amoledColors.border,
                      color: amoledColors.text,
                    }}
                  >
                    <option value='very-satisfied'>Very Satisfied</option>
                    <option value='satisfied'>Satisfied</option>
                    <option value='neutral'>Neutral</option>
                    <option value='hungry'>Still Hungry</option>
                    <option value='very-hungry'>Very Hungry</option>
                  </Form.Select>
                </Form.Group>

                {/* Energy Level */}
                <Form.Group className='mb-3'>
                  <Form.Label style={{ color: amoledColors.text }}>
                    Energy Level After
                  </Form.Label>
                  <Form.Select
                    value={editFormData.energyLevel}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        energyLevel: e.target.value,
                      })
                    }
                    style={{
                      backgroundColor: amoledColors.cardBg,
                      borderColor: amoledColors.border,
                      color: amoledColors.text,
                    }}
                  >
                    <option value='high'>High Energy</option>
                    <option value='medium'>Medium Energy</option>
                    <option value='low'>Low Energy</option>
                  </Form.Select>
                </Form.Group>

                {/* Comments */}
                <Form.Group className='mb-3'>
                  <Form.Label style={{ color: amoledColors.text }}>
                    Comments
                  </Form.Label>
                  <Form.Control
                    as='textarea'
                    rows={3}
                    value={editFormData.comments}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        comments: e.target.value,
                      })
                    }
                    style={{
                      backgroundColor: amoledColors.cardBg,
                      borderColor: amoledColors.border,
                      color: amoledColors.text,
                    }}
                  />
                </Form.Group>

                {/* Custom Nutrition (if custom meal) */}
                {meal.isCustomMeal && (
                  <>
                    <h6
                      style={{
                        color: amoledColors.text,
                        marginBottom: '0.75rem',
                      }}
                    >
                      Nutrition Information
                    </h6>
                    <Row>
                      <Col xs={6}>
                        <Form.Group className='mb-2'>
                          <Form.Label
                            style={{
                              color: amoledColors.text,
                              fontSize: '0.9rem',
                            }}
                          >
                            Calories
                          </Form.Label>
                          <Form.Control
                            type='number'
                            value={editFormData.customNutrition.calories}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                customNutrition: {
                                  ...editFormData.customNutrition,
                                  calories: e.target.value,
                                },
                              })
                            }
                            style={{
                              backgroundColor: amoledColors.cardBg,
                              borderColor: amoledColors.border,
                              color: amoledColors.text,
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={6}>
                        <Form.Group className='mb-2'>
                          <Form.Label
                            style={{
                              color: amoledColors.text,
                              fontSize: '0.9rem',
                            }}
                          >
                            Protein (g)
                          </Form.Label>
                          <Form.Control
                            type='number'
                            step='0.1'
                            value={editFormData.customNutrition.protein}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                customNutrition: {
                                  ...editFormData.customNutrition,
                                  protein: e.target.value,
                                },
                              })
                            }
                            style={{
                              backgroundColor: amoledColors.cardBg,
                              borderColor: amoledColors.border,
                              color: amoledColors.text,
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={6}>
                        <Form.Group className='mb-2'>
                          <Form.Label
                            style={{
                              color: amoledColors.text,
                              fontSize: '0.9rem',
                            }}
                          >
                            Carbs (g)
                          </Form.Label>
                          <Form.Control
                            type='number'
                            step='0.1'
                            value={editFormData.customNutrition.carbs}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                customNutrition: {
                                  ...editFormData.customNutrition,
                                  carbs: e.target.value,
                                },
                              })
                            }
                            style={{
                              backgroundColor: amoledColors.cardBg,
                              borderColor: amoledColors.border,
                              color: amoledColors.text,
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={6}>
                        <Form.Group className='mb-2'>
                          <Form.Label
                            style={{
                              color: amoledColors.text,
                              fontSize: '0.9rem',
                            }}
                          >
                            Fat (g)
                          </Form.Label>
                          <Form.Control
                            type='number'
                            step='0.1'
                            value={editFormData.customNutrition.fat}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                customNutrition: {
                                  ...editFormData.customNutrition,
                                  fat: e.target.value,
                                },
                              })
                            }
                            style={{
                              backgroundColor: amoledColors.cardBg,
                              borderColor: amoledColors.border,
                              color: amoledColors.text,
                            }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer
            style={{
              backgroundColor: amoledColors.cardBg,
              borderColor: amoledColors.border,
            }}
          >
            <Button
              variant='secondary'
              onClick={() => setShowEditModal(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isUpdating}
              style={{
                backgroundColor: amoledColors.accent,
                borderColor: amoledColors.accent,
              }}
            >
              {isUpdating ? (
                'Saving...'
              ) : (
                <>
                  <FaSave className='me-1' />
                  Save Changes
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        size={isMobile ? 'sm' : 'md'}
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: amoledColors.cardBg,
            borderColor: amoledColors.border,
          }}
        >
          <Modal.Title style={{ color: amoledColors.text }}>
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundColor: amoledColors.cardBg,
            color: amoledColors.text,
          }}
        >
          Are you sure you want to delete this meal entry? This action cannot be
          undone.
          <div
            className='mt-2'
            style={{ fontSize: '0.9rem', color: amoledColors.textMuted }}
          >
            <strong>Meal:</strong>{' '}
            {meal.isCustomMeal ? meal.customMealName : meal.product?.name}
          </div>
        </Modal.Body>
        <Modal.Footer
          style={{
            backgroundColor: amoledColors.cardBg,
            borderColor: amoledColors.border,
          }}
        >
          <Button
            variant='secondary'
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button variant='danger' onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MealTimelineCard;
