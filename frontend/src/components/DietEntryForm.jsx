import { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert, Badge, Modal } from 'react-bootstrap';
import { FaUtensils, FaPlus, FaCheck, FaTimes, FaHeart, FaBolt, FaAppleAlt, FaTrash } from 'react-icons/fa';
import { useCreateDietEntryMutation, useQuickLogMealMutation } from '../slices/dietApiSlice';
import { successToast, errorToast } from '../utils/toastConfig';
import { format } from 'date-fns';

const DietEntryForm = ({ 
  product, 
  collectionId, 
  onSuccess, 
  isDarkMode = false,
  quickLog = false,
  inCollection = false 
}) => {
  // Initialize with current date and time
  const getCurrentDateTime = () => format(new Date(), "yyyy-MM-dd'T'HH:mm");
  
  const [formData, setFormData] = useState({
    mealType: 'other',
    items: [{ quantity: '1', unit: 'serving' }],
    feeling: 'satisfied',
    energyLevel: 'medium',
    comments: '',
    date: getCurrentDateTime()
  });

  // Update date/time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setFormData(prev => ({
        ...prev,
        date: getCurrentDateTime()
      }));
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustomMeal, setShowCustomMeal] = useState(false);
  const [customMealData, setCustomMealData] = useState({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  });
  const [hoveredDelete, setHoveredDelete] = useState(null);
  
  // Track focus state for input fields
  const [fieldFocus, setFieldFocus] = useState({
    calories: false,
    protein: false,
    carbs: false,
    fat: false,
    fiber: false
  });

  const [createDietEntry, { isLoading: isCreating }] = useCreateDietEntryMutation();
  const [quickLogMeal, { isLoading: isQuickLogging }] = useQuickLogMealMutation();

  // Theme colors
  const themeColors = {
    accent: '#4CAF50', // Changed to match theme's accentColor
    cardBg: isDarkMode ? '#0D0D0D' : '#ffffff',
    text: isDarkMode ? '#E2E8F0' : '#1A202C',
    textSecondary: isDarkMode ? '#94A3B8' : '#4A5568',
    textMuted: isDarkMode ? '#64748B' : '#6B7280',
    border: isDarkMode ? '#1E1E1E' : '#E2E8F0',
    success: '#4CAF50', // Changed to match theme's accentColor 
    warning: isDarkMode ? '#FBBF24' : '#F59E0B',
    inputBg: isDarkMode ? '#121212' : '#F9FAFB',
  };

  const inputStyle = {
    backgroundColor: themeColors.inputBg,
    color: themeColors.text,
    border: `1px solid ${isDarkMode ? '#232323' : themeColors.border}`,
    borderRadius: '8px',
    padding: '0.5rem',
    fontSize: '0.9rem',
    width: '100%',
    transition: 'all 0.2s ease',
  };

  const compactInputStyle = {
    ...inputStyle,
    width: '80px',
    textAlign: 'center',
    padding: '0.3rem',
  };

  const noteInputStyle = {
    ...inputStyle,
    height: 'auto',
    minHeight: '40px',
    padding: '0.5rem 0.75rem',
  };

  const deleteButtonStyle = {
    background: 'transparent',
    border: `1px solid ${isDarkMode ? '#4A5568' : '#CBD5E1'}`,
    color: themeColors.textSecondary,
    borderRadius: '8px',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    padding: 0,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  };

  const deleteButtonHoverStyle = {
    background: '#ef4444',
    color: '#ffffff',
    border: '1px solid #ef4444',
  };

  const smallInputStyle = {
    ...inputStyle,
    padding: '0.3rem 0.5rem',
    height: '32px',
    fontSize: '0.8rem',
  };

  // Handle quantity input focus
  const handleQuantityFocus = (e) => {
    e.target.select();
  };
  
  // Handle nutrition field focus
  const handleNutritionFieldFocus = (field) => {
    setFieldFocus({...fieldFocus, [field]: true});
    // Also select the text
    setTimeout(() => {
      document.activeElement.select();
    }, 0);
  };
  
  // Handle nutrition field blur
  const handleNutritionFieldBlur = (field) => {
    setFieldFocus({...fieldFocus, [field]: false});
  };

  // Update item
  const updateItem = (index, field, value) => {
    const updatedItems = [...formData.items];
    if (field === 'quantity') {
      // Only allow numbers and decimal point
      value = value.replace(/[^\d.]/g, '');
      // Prevent multiple decimal points
      const decimalCount = (value.match(/\./g) || []).length;
      if (decimalCount > 1) return;
    }
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData({ ...formData, items: updatedItems });
  };

  // Quick log meal without form
  const handleQuickLog = async () => {
    if (!product || !collectionId) {
      errorToast('Missing product or collection information');
      return;
    }

    try {
      const mealData = {
        productId: product._id,
        collectionId: collectionId,
        mealType: product.mealType?.[0] || 'other',
        items: [{ quantity: 1, unit: 'serving' }],
        feeling: 'satisfied',
        energyLevel: 'medium',
        date: new Date().toISOString()
      };
      
      console.log('Quick logging meal:', mealData);
      console.log('Product:', product);
      
      await createDietEntry(mealData).unwrap();

      successToast(`${product.name} logged successfully!`);
      if (onSuccess) onSuccess();
    } catch (error) {
      errorToast(error?.data?.message || 'Failed to log meal');
    }
  };

  // Submit detailed diet entry
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (showCustomMeal && !customMealData.name.trim()) {
      errorToast('Please enter a custom meal name');
      return;
    }

    // Validate quantity for product meals
    if (!showCustomMeal) {
      for (const item of formData.items) {
        if (!item.quantity || isNaN(parseFloat(item.quantity)) || parseFloat(item.quantity) <= 0) {
          errorToast('Please enter a valid quantity for all items.');
          return;
        }
      }
    }

    try {
      // Create a deep copy to manipulate before sending
      const dataToSend = JSON.parse(JSON.stringify(formData));

      // Sanitize and validate items
      if (showCustomMeal) {
        delete dataToSend.items;
      } else {
        dataToSend.items = dataToSend.items.map(item => {
          const qty = parseFloat(item.quantity);
          return { ...item, quantity: isNaN(qty) || qty <= 0 ? 1 : qty };
        });
      }

      const entryData = {
        productId: showCustomMeal ? null : product._id,
        collectionId,
        ...dataToSend,
        isCustomMeal: showCustomMeal,
        customMealName: showCustomMeal ? customMealData.name : undefined,
        customNutrition: showCustomMeal ? {
          calories: customMealData.calories,
          protein: customMealData.protein,
          carbs: customMealData.carbs,
          fat: customMealData.fat,
          fiber: customMealData.fiber
        } : undefined
      };

      console.log('Submitting diet entry:', entryData);
      console.log('Product:', product);

      await createDietEntry(entryData).unwrap();
      
      successToast(showCustomMeal ? 'Custom meal logged successfully!' : `${product.name} logged successfully!`);
      
      // Reset form
      setFormData({
        mealType: 'other',
        items: [{ quantity: '1', unit: 'serving' }],
        feeling: 'satisfied',
        energyLevel: 'medium',
        comments: '',
        date: getCurrentDateTime()
      });
      
      if (showCustomMeal) {
        setCustomMealData({
          name: '',
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0
        });
        setShowCustomMeal(false);
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Detailed error logging meal:', error);
      errorToast(error?.data?.message || 'Failed to log meal. Please check console for details.');
    }
  };

  // Add new item
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { quantity: '1', unit: 'serving' }]
    });
  };

  // Remove item
  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      });
    }
  };

  // Get feeling icon
  const getFeelingIcon = (feeling) => {
    switch (feeling) {
      case 'very-satisfied': return <FaHeart style={{ color: themeColors.success }} />;
      case 'satisfied': return <FaCheck style={{ color: themeColors.success }} />;
      case 'neutral': return <FaAppleAlt style={{ color: themeColors.warning }} />;
      case 'hungry': return <FaTimes style={{ color: '#EF4444' }} />;
      case 'very-hungry': return <FaTimes style={{ color: '#DC2626' }} />;
      default: return <FaAppleAlt style={{ color: themeColors.warning }} />;
    }
  };

  // Get energy icon
  const getEnergyIcon = (level) => {
    switch (level) {
      case 'high': return <FaBolt style={{ color: themeColors.success }} />;
      case 'medium': return <FaBolt style={{ color: themeColors.warning }} />;
      case 'low': return <FaBolt style={{ color: '#EF4444' }} />;
      default: return <FaBolt style={{ color: themeColors.warning }} />;
    }
  };

  // Calculate estimated nutrition (if product has nutrition data)
  const calculateEstimatedNutrition = () => {
    if (!product?.nutrition || formData.items.length === 0) return null;

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    formData.items.forEach(item => {
      const multiplier = item.quantity || 1;
      totalCalories += (product.nutrition.calories || 0) * multiplier;
      totalProtein += (product.nutrition.protein || 0) * multiplier;
      totalCarbs += (product.nutrition.carbs || 0) * multiplier;
      totalFat += (product.nutrition.fat || 0) * multiplier;
    });

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10
    };
  };

  const estimatedNutrition = calculateEstimatedNutrition();

  // If quickLog is true, just show quick log button
  if (quickLog) {
    return (
      <div className="d-grid gap-2">
        <Form.Group className="mb-2">
          <Form.Label style={{ color: themeColors.text, fontSize: '0.9rem' }}>Meal Type</Form.Label>
          <Form.Select
            value={formData.mealType}
            onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
            style={{ 
              backgroundColor: themeColors.cardBg, 
              color: themeColors.text,
              borderColor: themeColors.border
            }}
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
            <option value="other">Other</option>
          </Form.Select>
        </Form.Group>
        
        <Button
          variant="success"
          onClick={handleQuickLog}
          disabled={isQuickLogging}
          style={{ 
            background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
            border: 'none',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(76, 175, 80, 0.35)',
            transition: 'all 0.2s ease',
            borderRadius: '8px'
          }}
          className="btn-green-theme"
        >
          <FaUtensils className="me-2" />
          {isQuickLogging ? 'Logging...' : 'Quick Log Meal'}
        </Button>
        
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => setShowAdvanced(true)}
          style={{ 
            borderColor: '#4CAF50', 
            color: '#4CAF50' 
          }}
        >
          Advanced Options
        </Button>
      </div>
    );
  }

  return (
    <>
      <div style={{ 
        width: '100%', 
        backgroundColor: isDarkMode ? '#000000' : '#ffffff', // use pure black for dark mode, white for light mode
        padding: '0 1rem 1.5rem', 
        margin: 0,
        transition: 'background-color 0.3s ease'
      }}>
        <div className="d-flex justify-content-between align-items-center py-3">
          <h5 style={{ margin: 0, color: themeColors.text }}>
            <FaUtensils className="me-2" style={{ color: '#4CAF50' }} />
            {showCustomMeal ? 'Custom Meal' : 'Log Meal'}
          </h5>

          <div className="d-flex gap-1">
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => setShowCustomMeal(false)}
              style={{
                fontSize: '0.8rem',
                padding: '4px 12px',
                borderRadius: '6px',
                backgroundColor: showCustomMeal ? 'transparent' : '#4CAF50',
                color: showCustomMeal ? themeColors.text : '#ffffff',
                borderColor: '#4CAF50',
                opacity: showCustomMeal ? 0.8 : 1,
              }}
            >
              Meal
            </Button>
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => setShowCustomMeal(true)}
              style={{
                fontSize: '0.8rem',
                padding: '4px 12px',
                borderRadius: '6px',
                backgroundColor: showCustomMeal ? '#4CAF50' : 'transparent',
                color: !showCustomMeal ? themeColors.text : '#ffffff',
                borderColor: '#4CAF50',
                opacity: !showCustomMeal ? 0.8 : 1,
              }}
            >
              Custom
            </Button>
          </div>
        </div>

        <Form onSubmit={handleSubmit} style={{ color: themeColors.text }}>
          {/* Custom Meal Section */}
          {showCustomMeal && (
            <div className="mb-3">
              <h6 style={{ marginBottom: '1rem' }}>Custom Meal Details</h6>
              
              <Row className="g-2">
                <Col xs={12} className="mb-2">
                  <Form.Group>
                    <Form.Label style={{ display:'none' }}>Meal Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Meal Name*"
                      value={customMealData.name}
                      onChange={(e) => setCustomMealData({...customMealData, name: e.target.value})}
                      style={{...inputStyle,height:'44px'}}
                      size="sm"
                      required
                    />
                  </Form.Group>
                </Col>
                
                <Col xs={4} sm={4} className="mb-2">
                  <Form.Group className="position-relative">
                    {(!fieldFocus.calories && customMealData.calories === 0) && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '24px',
                          color: themeColors.textMuted,
                          pointerEvents: 'none',
                          fontSize: '0.9rem'
                        }}
                      >
                        Calories
                      </div>
                    )}
                    <Form.Control
                      type="number"
                      min="0"
                      value={customMealData.calories}
                      onChange={(e) => setCustomMealData({...customMealData, calories: parseInt(e.target.value) || 0})}
                      onFocus={() => handleNutritionFieldFocus('calories')}
                      onBlur={() => handleNutritionFieldBlur('calories')}
                      style={inputStyle}
                      size="sm"
                    />
                  </Form.Group>
                </Col>
                
                <Col xs={4} sm={4} className="mb-2">
                  <Form.Group className="position-relative">
                    {(!fieldFocus.protein && customMealData.protein === 0) && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '24px',
                          color: themeColors.textMuted,
                          pointerEvents: 'none',
                          fontSize: '0.9rem'
                        }}
                      >
                        Protein (g)
                      </div>
                    )}
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.1"
                      value={customMealData.protein}
                      onChange={(e) => setCustomMealData({...customMealData, protein: parseFloat(e.target.value) || 0})}
                      onFocus={() => handleNutritionFieldFocus('protein')}
                      onBlur={() => handleNutritionFieldBlur('protein')}
                      style={inputStyle}
                      size="sm"
                    />
                  </Form.Group>
                </Col>
                
                <Col xs={4} sm={4} className="mb-2">
                  <Form.Group className="position-relative">
                    {(!fieldFocus.carbs && customMealData.carbs === 0) && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '24px',
                          color: themeColors.textMuted,
                          pointerEvents: 'none',
                          fontSize: '0.9rem'
                        }}
                      >
                        Carbs (g)
                      </div>
                    )}
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.1"
                      value={customMealData.carbs}
                      onChange={(e) => setCustomMealData({...customMealData, carbs: parseFloat(e.target.value) || 0})}
                      onFocus={() => handleNutritionFieldFocus('carbs')}
                      onBlur={() => handleNutritionFieldBlur('carbs')}
                      style={inputStyle}
                      size="sm"
                    />
                  </Form.Group>
                </Col>
                
                <Col xs={4} sm={4} className="mb-2">
                  <Form.Group className="position-relative">
                    {(!fieldFocus.fat && customMealData.fat === 0) && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '24px',
                          color: themeColors.textMuted,
                          pointerEvents: 'none',
                          fontSize: '0.9rem'
                        }}
                      >
                        Fat (g)
                      </div>
                    )}
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.1"
                      value={customMealData.fat}
                      onChange={(e) => setCustomMealData({...customMealData, fat: parseFloat(e.target.value) || 0})}
                      onFocus={() => handleNutritionFieldFocus('fat')}
                      onBlur={() => handleNutritionFieldBlur('fat')}
                      style={inputStyle}
                      size="sm"
                    />
                  </Form.Group>
                </Col>
                
                <Col xs={4} sm={4} className="mb-2">
                  <Form.Group className="position-relative">
                    {(!fieldFocus.fiber && customMealData.fiber === 0) && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '24px',
                          color: themeColors.textMuted,
                          pointerEvents: 'none',
                          fontSize: '0.9rem'
                        }}
                      >
                        Fiber (g)
                      </div>
                    )}
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.1"
                      value={customMealData.fiber}
                      onChange={(e) => setCustomMealData({...customMealData, fiber: parseFloat(e.target.value) || 0})}
                      onFocus={() => handleNutritionFieldFocus('fiber')}
                      onBlur={() => handleNutritionFieldBlur('fiber')}
                      style={inputStyle}
                      size="sm"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          )}

          {/* Basic Information */}
          <Row className="mb-3">
            <Col xs={12}>
              <Form.Group>
                <Form.Label style={{ fontSize: '0.85rem', marginBottom: '0.25rem', color: themeColors.textMuted }}>Meal Type</Form.Label>
                <Form.Select
                  value={formData.mealType}
                  onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
                  style={inputStyle}
                  size="sm"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                  <option value="other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Quantities (only for product meals) */}
          {!showCustomMeal && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="mb-0" style={{ fontSize: '0.85rem', color: themeColors.textSecondary }}>
                  Quantities
                </Form.Label>
                <Button
                  variant="link"
                  size="sm"
                  onClick={addItem}
                  style={{ 
                    color: '#4CAF50', 
                    textDecoration: 'none',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}
                >
                  <FaPlus className="me-1" /> Add Item
                </Button>
              </div>
              {formData.items.map((item, index) => (
                <Row key={index} className="mb-2 g-2 align-items-center">
                  <Col xs={5} sm={4}>
                    <Form.Control
                      type="text"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      onFocus={handleQuantityFocus}
                      placeholder="Qty"
                      style={{...compactInputStyle, height: '40px'}}
                      size="sm"
                    />
                  </Col>
                  <Col xs={5} sm={6}>
                    <Form.Select
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      style={{...compactInputStyle, width: '100%', height: '40px'}}
                      size="sm"
                    >
                      <option value="serving">serving</option>
                      <option value="grams">grams</option>
                      <option value="oz">ounces</option>
                      <option value="cups">cups</option>
                      <option value="tablespoons">tbsp</option>
                    </Form.Select>
                  </Col>
                  <Col xs={2} sm={2} className="text-center">
                    {formData.items.length > 1 && (
                       <Button 
                        variant="link" 
                        onClick={() => removeItem(index)} 
                        style={{
                          ...deleteButtonStyle,
                          ...(hoveredDelete === index ? deleteButtonHoverStyle : {})
                        }}
                        onMouseEnter={() => setHoveredDelete(index)}
                        onMouseLeave={() => setHoveredDelete(null)}
                      >
                        <FaTrash />
                      </Button>
                    )}
                  </Col>
                </Row>
              ))}
            </div>
          )}

          {/* Estimated Nutrition (for product meals) */}
          {!showCustomMeal && estimatedNutrition && (
            <Alert
              variant="info"
              className="mb-3 py-2 px-3"
              style={{
                backgroundColor: isDarkMode ? 'rgba(34, 211, 238, 0.08)' : 'rgba(34, 211, 238, 0.06)',
                borderColor: 'transparent',
                fontSize: '0.8rem',
                borderRadius: '6px',
                color: themeColors.textSecondary,
              }}
            >
              <span style={{ fontWeight: 600, color: themeColors.text }}>
                Est. Nutrition:
              </span>{' '}
              {estimatedNutrition.calories} cal · {estimatedNutrition.protein}g P · {estimatedNutrition.carbs}g C · {estimatedNutrition.fat}g F
            </Alert>
          )}

          {/* Feeling & Energy */}
          <Row className="mb-3">
            <Col xs={12} md={6} className="mb-3 mb-md-0">
              <Form.Group>
                <Form.Label style={{ fontSize: '0.85rem', marginBottom: '0.3rem', color: themeColors.textMuted }}>How do you feel?</Form.Label>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {[
                    { value: 'very-satisfied', label: 'Great', bg: 'success' },
                    { value: 'satisfied', label: 'Good', bg: 'info' },
                    { value: 'neutral', label: 'Okay', bg: 'secondary' },
                    { value: 'hungry', label: 'Hungry', bg: 'warning' },
                    { value: 'very-hungry', label: 'Starving', bg: 'danger' }
                  ].map(feeling => (
                    <Badge
                      key={feeling.value}
                      bg={formData.feeling === feeling.value ? feeling.bg : 'outline-secondary'}
                      className="p-2 cursor-pointer"
                      style={{ 
                        cursor: 'pointer',
                        opacity: formData.feeling === feeling.value ? 1 : 0.8,
                        fontSize: '0.75rem',
                        flexGrow: 1,
                        textAlign: 'center'
                      }}
                      onClick={() => setFormData({ ...formData, feeling: feeling.value })}
                    >
                      {feeling.label}
                    </Badge>
                  ))}
                </div>
              </Form.Group>
            </Col>
            
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label style={{ fontSize: '0.85rem', marginBottom: '0.3rem', color: themeColors.textMuted }}>Energy Level</Form.Label>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {[
                    { value: 'high', label: 'High', bg: 'success' },
                    { value: 'medium', label: 'Medium', bg: 'warning' },
                    { value: 'low', label: 'Low', bg: 'danger' }
                  ].map(energy => (
                    <Badge
                      key={energy.value}
                      bg={formData.energyLevel === energy.value ? energy.bg : 'outline-secondary'}
                      className="p-2 cursor-pointer"
                      style={{ 
                        cursor: 'pointer',
                        opacity: formData.energyLevel === energy.value ? 1 : 0.8,
                        fontSize: '0.75rem',
                        flexGrow: 1,
                        textAlign: 'center'
                      }}
                      onClick={() => setFormData({ ...formData, energyLevel: energy.value })}
                    >
                      {energy.label}
                    </Badge>
                  ))}
                </div>
              </Form.Group>
            </Col>
          </Row>

          {/* Comments */}
          <Form.Group className="mb-3">
            <Form.Control
              as="textarea"
              rows={1}
              placeholder="Notes (Optional)"
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              style={{ 
                ...inputStyle, 
                minHeight: '45px', 
                height: '45px', 
                width: '100%',
                paddingTop: '12px',
                display: 'flex',
                alignItems: 'center'
              }}
            />
          </Form.Group>

          {/* Submit Buttons */}
          <div className="d-grid gap-2 mt-3">
            <Button
              variant="success"
              type="submit"
              disabled={isCreating}
              style={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                border: 'none',
                padding: '0.6rem',
                fontWeight: '600',
                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.35)',
                transition: 'all 0.2s ease',
                color: '#FFFFFF',
                borderRadius: '8px',
              }}
              className="btn-green-theme"
            >
              {isCreating ? 'Logging...' : `Log ${showCustomMeal ? 'Custom Meal' : 'Meal'}`}
            </Button>
          </div>
        </Form>
      </div>

      {/* Advanced Options Modal */}
      <Modal show={showAdvanced} onHide={() => setShowAdvanced(false)} size="lg" centered>
        <Modal.Header closeButton style={{ backgroundColor: themeColors.cardBg, color: '#4CAF50' }}>
          <Modal.Title>Advanced Meal Logging</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: themeColors.cardBg }}>
          <DietEntryForm
            product={product}
            collectionId={collectionId}
            onSuccess={() => {
              setShowAdvanced(false);
              if (onSuccess) onSuccess();
            }}
            isDarkMode={isDarkMode}
            quickLog={false}
            inCollection={inCollection}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default DietEntryForm;