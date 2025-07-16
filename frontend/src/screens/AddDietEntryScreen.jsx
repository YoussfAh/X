import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Badge,
  Tab,
  Tabs,
  Modal,
  ListGroup,
} from 'react-bootstrap';
import {
  FaUtensils,
  FaPlus,
  FaSearch,
  FaAppleAlt,
  FaSave,
  FaTimes,
  FaFire,
  FaImage,
  FaCloudUploadAlt,
  FaCamera,
} from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useCreateDietEntryMutation } from '../slices/dietApiSlice';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { useAnalyzeNutritionMutation } from '../slices/nutritionApiSlice';
import { successToast, errorToast } from '../utils/toastConfig';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';

const AddDietEntryScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get('collectionId');

  // Get user info from Redux store to check feature flags
  const { userInfo } = useSelector((state) => state.auth);

  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [activeTab, setActiveTab] = useState('custom-meal');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    mealType: 'other',
    items: [{ quantity: 1, unit: 'serving', notes: '' }],
    feeling: 'satisfied',
    energyLevel: 'medium',
    comments: '',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });

  // Custom meal data
  const [customMealData, setCustomMealData] = useState({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });

  // Upload meal image data (similar to custom meal but with image)
  const [uploadMealData, setUploadMealData] = useState({
    name: '',
    description: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    image: '',
  });

  const [createDietEntry, { isLoading: isCreating }] =
    useCreateDietEntryMutation();

  const [analyzeNutrition] = useAnalyzeNutritionMutation(); // Image compression utility function - improved for mobile
  const compressImage = (file, maxSizeMB = 2, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          const maxWidth = window.innerWidth < 768 ? 1024 : 2048; // Smaller on mobile
          const maxHeight = window.innerWidth < 768 ? 1024 : 2048;
          let { width, height } = img;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Clear canvas with white background to prevent transparency issues
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () =>
                reject(new Error('Failed to read compressed image'));
              reader.readAsDataURL(blob);
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () =>
        reject(new Error('Failed to load image for compression'));

      // Handle different input types
      if (typeof file === 'string') {
        img.crossOrigin = 'anonymous'; // Handle CORS for URLs
        img.src = file;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => (img.src = e.target.result);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      }
    });
  };

  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // Smart nutrition estimation based on meal name and type
  const getSmartNutritionEstimation = (
    mealName,
    mealType,
    description = ''
  ) => {
    const name = mealName.toLowerCase();
    const desc = description.toLowerCase();
    const combined = `${name} ${desc}`;

    // Base values for different meal types
    const mealTypeMultipliers = {
      breakfast: 0.8,
      lunch: 1.0,
      dinner: 1.2,
      snack: 0.5,
      other: 1.0,
    };

    const multiplier = mealTypeMultipliers[mealType] || 1.0;

    // Food categories with estimated nutrition per 100g
    const foodCategories = {
      // Proteins
      chicken: {
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        confidence: 85,
      },
      beef: {
        calories: 250,
        protein: 26,
        carbs: 0,
        fat: 17,
        fiber: 0,
        confidence: 85,
      },
      pork: {
        calories: 242,
        protein: 27,
        carbs: 0,
        fat: 14,
        fiber: 0,
        confidence: 85,
      },
      fish: {
        calories: 206,
        protein: 22,
        carbs: 0,
        fat: 12,
        fiber: 0,
        confidence: 80,
      },
      salmon: {
        calories: 208,
        protein: 20,
        carbs: 0,
        fat: 13,
        fiber: 0,
        confidence: 90,
      },
      turkey: {
        calories: 135,
        protein: 30,
        carbs: 0,
        fat: 1,
        fiber: 0,
        confidence: 85,
      },
      eggs: {
        calories: 155,
        protein: 13,
        carbs: 1,
        fat: 11,
        fiber: 0,
        confidence: 95,
      },

      // Grains & Starches
      rice: {
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
        fiber: 0.4,
        confidence: 90,
      },
      pasta: {
        calories: 220,
        protein: 8,
        carbs: 44,
        fat: 1,
        fiber: 3,
        confidence: 90,
      },
      bread: {
        calories: 265,
        protein: 9,
        carbs: 49,
        fat: 3.2,
        fiber: 2.8,
        confidence: 85,
      },
      potato: {
        calories: 77,
        protein: 2,
        carbs: 17,
        fat: 0.1,
        fiber: 2.2,
        confidence: 90,
      },
      quinoa: {
        calories: 120,
        protein: 4.4,
        carbs: 22,
        fat: 1.9,
        fiber: 2.8,
        confidence: 85,
      },

      // Vegetables
      broccoli: {
        calories: 34,
        protein: 2.8,
        carbs: 7,
        fat: 0.4,
        fiber: 2.6,
        confidence: 95,
      },
      spinach: {
        calories: 23,
        protein: 2.9,
        carbs: 3.6,
        fat: 0.4,
        fiber: 2.2,
        confidence: 95,
      },
      carrots: {
        calories: 41,
        protein: 0.9,
        carbs: 10,
        fat: 0.2,
        fiber: 2.8,
        confidence: 95,
      },
      tomato: {
        calories: 18,
        protein: 0.9,
        carbs: 3.9,
        fat: 0.2,
        fiber: 1.2,
        confidence: 95,
      },

      // Fruits
      apple: {
        calories: 52,
        protein: 0.3,
        carbs: 14,
        fat: 0.2,
        fiber: 2.4,
        confidence: 95,
      },
      banana: {
        calories: 89,
        protein: 1.1,
        carbs: 23,
        fat: 0.3,
        fiber: 2.6,
        confidence: 95,
      },
      orange: {
        calories: 47,
        protein: 0.9,
        carbs: 12,
        fat: 0.1,
        fiber: 2.4,
        confidence: 95,
      },

      // Common meals
      pizza: {
        calories: 266,
        protein: 11,
        carbs: 33,
        fat: 10,
        fiber: 2.3,
        confidence: 75,
      },
      burger: {
        calories: 295,
        protein: 17,
        carbs: 23,
        fat: 14,
        fiber: 2,
        confidence: 70,
      },
      sandwich: {
        calories: 200,
        protein: 10,
        carbs: 30,
        fat: 5,
        fiber: 3,
        confidence: 70,
      },
      salad: {
        calories: 85,
        protein: 5,
        carbs: 8,
        fat: 4,
        fiber: 3,
        confidence: 65,
      },
      soup: {
        calories: 120,
        protein: 6,
        carbs: 15,
        fat: 4,
        fiber: 2,
        confidence: 60,
      },
    };

    let bestMatch = null;
    let highestConfidence = 0;
    let suggestions = [];

    // Find best matching food category
    for (const [food, nutrition] of Object.entries(foodCategories)) {
      if (combined.includes(food)) {
        if (nutrition.confidence > highestConfidence) {
          bestMatch = nutrition;
          highestConfidence = nutrition.confidence;
        }
        suggestions.push(
          `${food.charAt(0).toUpperCase() + food.slice(1)}: ~${
            nutrition.calories
          } cal/100g`
        );
      }
    }

    // Default estimation if no match found
    if (!bestMatch) {
      bestMatch = {
        calories: 200,
        protein: 12,
        carbs: 25,
        fat: 8,
        fiber: 3,
        confidence: 40,
      };
      suggestions.push('General meal estimate - please adjust as needed');
    }

    // Apply meal type multiplier and typical serving size (200g)
    const servingSize = 200; // grams
    const finalNutrition = {
      calories: Math.round(
        (bestMatch.calories * servingSize * multiplier) / 100
      ),
      protein:
        Math.round(
          ((bestMatch.protein * servingSize * multiplier) / 100) * 10
        ) / 10,
      carbs:
        Math.round(((bestMatch.carbs * servingSize * multiplier) / 100) * 10) /
        10,
      fat:
        Math.round(((bestMatch.fat * servingSize * multiplier) / 100) * 10) /
        10,
      fiber:
        Math.round(((bestMatch.fiber * servingSize * multiplier) / 100) * 10) /
        10,
      confidence: bestMatch.confidence,
    };

    // Generate enhanced description
    let enhancedDescription = description;
    if (suggestions.length > 0) {
      enhancedDescription +=
        (enhancedDescription ? ' | ' : '') +
        `Estimated based on: ${suggestions.slice(0, 3).join(', ')}`;
    }

    // Generate helpful suggestions
    const suggestionText = [
      `Estimated nutrition for ${mealName} (${mealType})`,
      suggestions.length > 0
        ? suggestions.slice(0, 2).join(', ')
        : 'General meal estimate',
      'Please review and adjust values as needed',
      finalNutrition.confidence < 60
        ? 'Low confidence - consider adding more details'
        : '',
    ]
      .filter(Boolean)
      .join('. ');

    return {
      ...finalNutrition,
      enhancedDescription,
      suggestions: suggestionText,
    };
  };

  // Get meal/diet products
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useGetProductsQuery({
    keyword: searchTerm,
    pageNumber: 1,
    isMealDiet: true,
  });

  // Theme colors
  const amoledColors = {
    background: isDarkMode ? '#000000' : '#ffffff',
    cardBg: isDarkMode ? '#0D0D0D' : '#ffffff',
    text: isDarkMode ? '#E2E8F0' : '#1A202C',
    textSecondary: isDarkMode ? '#94A3B8' : '#4A5568',
    textMuted: isDarkMode ? '#64748B' : '#6B7280',
    accent: isDarkMode ? '#A855F7' : '#6E44B2',
    accentHover: isDarkMode ? '#9333EA' : '#5E3A98',
    border: isDarkMode ? '#1E1E1E' : '#E2E8F0',
    headerBg: isDarkMode ? '#111111' : '#F8FAFC',
    success: isDarkMode ? '#34D399' : '#10B981',
    warning: isDarkMode ? '#FBBF24' : '#F59E0B',
    danger: isDarkMode ? '#F87171' : '#EF4444',
  };

  const cardStyle = {
    backgroundColor: amoledColors.cardBg,
    color: amoledColors.text,
    borderRadius: isMobile ? '12px' : '16px',
    overflow: 'hidden',
    boxShadow: isDarkMode
      ? '0 8px 32px rgba(0, 0, 0, 0.8), 0 4px 16px rgba(0, 0, 0, 0.6)'
      : '0 8px 32px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
    border: `1px solid ${amoledColors.border}`,
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    marginBottom: isMobile ? '1rem' : '1.5rem',
  };

  // Listen for theme changes and window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          setIsDarkMode(
            document.documentElement.getAttribute('data-theme') === 'dark'
          );
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle product selection
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setFormData({
      ...formData,
      mealType: product.mealType?.[0] || 'other',
    });
    setShowProductModal(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeTab === 'custom-meal' && !customMealData.name.trim()) {
      errorToast('Please enter a custom meal name');
      return;
    }

    if (activeTab === 'upload-meal' && !uploadMealData.name.trim()) {
      errorToast('Please enter a meal name for the uploaded image');
      return;
    }

    if (activeTab === 'upload-meal' && !uploadMealData.image.trim()) {
      errorToast('Please upload an image for your meal');
      return;
    }

    if (activeTab === 'meal-products' && !selectedProduct) {
      errorToast('Please select a meal product');
      return;
    }

    try {
      const entryData = {
        productId:
          activeTab === 'custom-meal' || activeTab === 'upload-meal'
            ? null
            : selectedProduct._id,
        collectionId,
        ...formData,
        isCustomMeal:
          activeTab === 'custom-meal' || activeTab === 'upload-meal',
        customMealName:
          activeTab === 'custom-meal'
            ? customMealData.name
            : activeTab === 'upload-meal'
            ? uploadMealData.name
            : undefined,
        customMealDescription:
          activeTab === 'upload-meal' ? uploadMealData.description : undefined,
        customNutrition:
          activeTab === 'custom-meal'
            ? {
                calories: Number(customMealData.calories),
                protein: Number(customMealData.protein),
                carbs: Number(customMealData.carbs),
                fat: Number(customMealData.fat),
                fiber: Number(customMealData.fiber),
              }
            : activeTab === 'upload-meal'
            ? {
                calories: Number(uploadMealData.calories),
                protein: Number(uploadMealData.protein),
                carbs: Number(uploadMealData.carbs),
                fat: Number(uploadMealData.fat),
                fiber: Number(uploadMealData.fiber),
              }
            : undefined,
        image: activeTab === 'upload-meal' ? uploadMealData.image : undefined,
      };

      console.log('Submitting diet entry:', entryData);

      await createDietEntry(entryData).unwrap();

      successToast(
        activeTab === 'custom-meal'
          ? 'Custom meal logged successfully!'
          : activeTab === 'upload-meal'
          ? 'Meal with image logged successfully!'
          : `${selectedProduct.name} logged successfully!`
      );

      navigate('/diet-dashboard');
    } catch (error) {
      errorToast(error?.data?.message || 'Failed to log meal');
    }
  };

  // Add new item
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { quantity: 1, unit: 'serving', notes: '' }],
    });
  };

  // Remove item
  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  // Update item
  const updateItem = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData({ ...formData, items: updatedItems });
  };

  // Handle image upload for upload meal tab
  // Analyze nutrition with AI
  const handleAiAnalysis = async () => {
    if (!uploadMealData.image) {
      errorToast('Please upload an image first');
      return;
    }

    if (!uploadMealData.name.trim()) {
      errorToast('Please enter a meal name first');
      return;
    }

    setIsAiAnalyzing(true);

    try {
      // Convert image URL to base64 if it's a Cloudinary URL
      let imageBase64 = uploadMealData.image;
      let shouldUseEstimation = false;

      if (uploadMealData.image.includes('cloudinary.com')) {
        try {
          // For Cloudinary URLs, we need to fetch and convert to base64
          const response = await fetch(uploadMealData.image);

          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }

          const blob = await response.blob();

          // Check file size and compress if necessary
          const fileSizeMB = blob.size / (1024 * 1024);
          console.log(`Original image size: ${fileSizeMB.toFixed(2)}MB`);

          if (fileSizeMB > 10) {
            // Use estimation instead of failing
            shouldUseEstimation = true;
            console.log('Image too large for AI analysis, using estimation');
          } else {
            // Compress image if larger than 5MB
            if (fileSizeMB > 5) {
              console.log('Compressing large image...');
              imageBase64 = await compressImage(uploadMealData.image, 5, 0.7);
              console.log('Large image compressed successfully');
            } else if (fileSizeMB > 2) {
              console.log('Compressing image...');
              imageBase64 = await compressImage(uploadMealData.image, 2, 0.8);
              console.log('Image compressed successfully');
            } else {
              imageBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
              });
            }
          }
        } catch (fetchError) {
          console.warn(
            'Failed to process Cloudinary image, using estimation:',
            fetchError
          );
          shouldUseEstimation = true;
        }
      }

      // Try AI analysis first, fallback to estimation if it fails
      let analysisResult = null;

      if (!shouldUseEstimation) {
        try {
          const analysisData = {
            imageBase64,
            mealName: uploadMealData.name,
            description: uploadMealData.description,
            mealType: formData.mealType,
            quantity: formData.items[0]?.quantity || 1,
            userComments: formData.comments,
          };

          analysisResult = await analyzeNutrition(analysisData).unwrap();
        } catch (aiError) {
          console.warn('AI analysis failed, using estimation:', aiError);
          shouldUseEstimation = true;
        }
      }

      // Use AI results if successful, otherwise use smart estimation
      if (analysisResult?.success && analysisResult?.data) {
        // Update the upload meal data with AI analysis
        setUploadMealData((prev) => ({
          ...prev,
          calories: analysisResult.data.calories || 0,
          protein: analysisResult.data.protein || 0,
          carbs: analysisResult.data.carbs || 0,
          fat: analysisResult.data.fat || 0,
          fiber: analysisResult.data.fiber || 0,
          description:
            analysisResult.data.enhancedDescription || prev.description,
        }));

        // Update form comments with health suggestions if available
        if (analysisResult.data.healthComments) {
          setFormData((prev) => ({
            ...prev,
            comments: analysisResult.data.healthComments,
          }));
        }

        const healthScore = analysisResult.data.mealContext?.healthScore || 5;
        const scoreText =
          healthScore >= 8
            ? 'Excellent!'
            : healthScore >= 6
            ? 'Good!'
            : healthScore >= 4
            ? 'Average'
            : 'Could be improved';

        successToast(
          `AI analysis complete! Health Score: ${healthScore}/10 (${scoreText}). Weight: ~${
            analysisResult.data.estimatedWeight || 'N/A'
          }g`
        );
      } else {
        // Smart estimation based on meal name and type
        const estimation = getSmartNutritionEstimation(
          uploadMealData.name,
          formData.mealType,
          uploadMealData.description
        );

        setUploadMealData((prev) => ({
          ...prev,
          calories: estimation.calories,
          protein: estimation.protein,
          carbs: estimation.carbs,
          fat: estimation.fat,
          fiber: estimation.fiber,
          description: estimation.enhancedDescription || prev.description,
        }));

        setFormData((prev) => ({
          ...prev,
          comments: estimation.suggestions,
        }));

        successToast(
          `Estimated nutrition based on "${uploadMealData.name}". ${estimation.confidence}% confidence. You can adjust values if needed.`
        );
      }
    } catch (error) {
      console.error('Complete analysis failure:', error);

      // Final fallback - always provide some estimation
      const fallbackEstimation = getSmartNutritionEstimation(
        uploadMealData.name,
        formData.mealType,
        uploadMealData.description
      );

      setUploadMealData((prev) => ({
        ...prev,
        calories: fallbackEstimation.calories,
        protein: fallbackEstimation.protein,
        carbs: fallbackEstimation.carbs,
        fat: fallbackEstimation.fat,
        fiber: fallbackEstimation.fiber,
      }));

      successToast(
        `Used estimated nutrition for "${uploadMealData.name}". Please review and adjust the values as needed.`
      );
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Calculate estimated nutrition
  const calculateEstimatedNutrition = () => {
    if (!selectedProduct?.nutrition) return null;

    const totalMultiplier = formData.items.reduce((sum, item) => {
      let unitMultiplier = 1;
      if (item.unit === 'grams' && selectedProduct.nutrition.servingWeight) {
        unitMultiplier =
          item.quantity / selectedProduct.nutrition.servingWeight;
      } else {
        unitMultiplier = item.quantity;
      }
      return sum + unitMultiplier;
    }, 0);

    return {
      calories: Math.round(
        selectedProduct.nutrition.calories * totalMultiplier
      ),
      protein:
        Math.round(selectedProduct.nutrition.protein * totalMultiplier * 10) /
        10,
      carbs:
        Math.round(selectedProduct.nutrition.carbs * totalMultiplier * 10) / 10,
      fat:
        Math.round(selectedProduct.nutrition.fat * totalMultiplier * 10) / 10,
      fiber:
        Math.round(selectedProduct.nutrition.fiber * totalMultiplier * 10) / 10,
    };
  };

  const estimatedNutrition = calculateEstimatedNutrition();

  return (
    <Container className={isMobile ? 'px-1' : 'px-2'}>
      <Meta title='Log a Meal - Diet Tracker' />

      {/* Header */}
      <Row className='mb-3'>
        <Col>
          <div
            style={{
              ...cardStyle,
              marginBottom: '1rem',
            }}
          >
            <div
              style={{ padding: window.innerWidth < 768 ? '1rem' : '1.5rem' }}
            >
              <div className='d-flex align-items-center justify-content-between mb-2'>
                <div className='d-flex align-items-center'>
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${amoledColors.accent}, ${amoledColors.accentHover})`,
                      borderRadius: '12px',
                      padding: window.innerWidth < 768 ? '0.5rem' : '0.75rem',
                      marginRight: window.innerWidth < 768 ? '0.75rem' : '1rem',
                    }}
                  >
                    <FaUtensils
                      style={{
                        color: 'white',
                        fontSize: window.innerWidth < 768 ? '1rem' : '1.25rem',
                      }}
                    />
                  </div>
                  <div>
                    <h2
                      style={{
                        color: amoledColors.text,
                        margin: 0,
                        fontSize:
                          window.innerWidth < 480
                            ? '1.1rem'
                            : window.innerWidth < 768
                            ? '1.25rem'
                            : '1.5rem',
                      }}
                    >
                      Log a Meal
                    </h2>
                    {window.innerWidth >= 480 && (
                      <p
                        style={{
                          color: amoledColors.textMuted,
                          margin: 0,
                          fontSize:
                            window.innerWidth < 768 ? '0.8rem' : '0.9rem',
                        }}
                      >
                        Track your nutrition and build healthy habits
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant='outline-secondary'
                  size={window.innerWidth < 768 ? 'sm' : 'md'}
                  onClick={() => navigate('/diet-dashboard')}
                  style={{
                    borderColor: amoledColors.border,
                    color: amoledColors.textMuted,
                  }}
                >
                  <FaTimes className={window.innerWidth < 768 ? '' : 'me-2'} />
                  {window.innerWidth >= 768 && 'Cancel'}
                </Button>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <Form onSubmit={handleSubmit}>
        <Row className='g-2 g-md-3'>
          {/* Left Column - Food Selection */}
          <Col lg={8} xl={7}>
            <Card
              style={{
                ...cardStyle,
                marginBottom: window.innerWidth < 768 ? '1rem' : '1.5rem',
              }}
            >
              <Card.Header
                style={{
                  backgroundColor: amoledColors.headerBg,
                  borderBottom: `1px solid ${amoledColors.border}`,
                  padding:
                    window.innerWidth < 768 ? '0.75rem 1rem' : '1rem 1.5rem',
                }}
              >
                <h5
                  style={{
                    color: amoledColors.text,
                    margin: 0,
                    fontSize: window.innerWidth < 768 ? '1rem' : '1.125rem',
                  }}
                >
                  Select Food
                </h5>
              </Card.Header>
              <Card.Body
                style={{
                  padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
                }}
              >
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className={window.innerWidth < 768 ? 'mb-3' : 'mb-4'}
                  variant='pills'
                  style={{
                    '--bs-nav-link-padding-x':
                      window.innerWidth < 768 ? '0.5rem' : '0.75rem',
                    '--bs-nav-link-padding-y':
                      window.innerWidth < 768 ? '0.4rem' : '0.5rem',
                    '--bs-nav-link-font-size':
                      window.innerWidth < 768 ? '0.8rem' : '0.875rem',
                    '--bs-nav-link-font-weight': '600',
                    '--bs-nav-link-border-radius': '8px',
                    '--bs-nav-pills-border-radius': '8px',
                    '--bs-nav-link-color': amoledColors.textMuted,
                    '--bs-nav-pills-link-active-color': '#ffffff',
                    '--bs-nav-pills-link-active-bg': `linear-gradient(135deg, ${amoledColors.accent}, ${amoledColors.accentHover})`,
                    '--bs-nav-link-hover-color': amoledColors.text,
                    gap: window.innerWidth < 768 ? '0.25rem' : '0.5rem',
                  }}
                >
                  {/* Add custom CSS for mobile responsiveness */}
                  <style>
                    {`
                      .nav-pills {
                        display: flex !important;
                        flex-wrap: wrap !important;
                        overflow-x: hidden !important;
                        scrollbar-width: none !important;
                        -ms-overflow-style: none !important;
                        gap: ${
                          window.innerWidth < 768 ? '0.25rem' : '0.5rem'
                        } !important;
                        padding: 0.2rem !important;
                        background: ${
                          isDarkMode
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.03)'
                        } !important;
                        border-radius: 12px !important;
                        border: 1px solid ${amoledColors.border} !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                      }

                      .nav-pills::-webkit-scrollbar {
                        display: none !important;
                      }

                      .nav-pills .nav-item {
                        flex: 1 1 auto !important;
                        min-width: 0 !important;
                        max-width: ${
                          window.innerWidth < 768 ? '33.333%' : 'none'
                        } !important;
                      }

                      .nav-pills .nav-link {
                        padding: ${
                          window.innerWidth < 768
                            ? '0.4rem 0.3rem'
                            : '0.5rem 0.75rem'
                        } !important;
                        font-size: ${
                          window.innerWidth < 768 ? '0.75rem' : '0.875rem'
                        } !important;
                        font-weight: 600 !important;
                        border-radius: 8px !important;
                        white-space: nowrap !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                        color: ${amoledColors.textMuted} !important;
                        background: transparent !important;
                        border: 1px solid transparent !important;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                        position: relative !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        text-align: center !important;
                        min-height: ${
                          window.innerWidth < 768 ? '36px' : '40px'
                        } !important;
                        line-height: 1.2 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                      }

                      .nav-pills .nav-link:hover {
                        color: ${amoledColors.text} !important;
                        background: ${
                          isDarkMode
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.05)'
                        } !important;
                        border-color: ${amoledColors.border} !important;
                        transform: translateY(-1px) !important;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
                      }

                      .nav-pills .nav-link.active {
                        color: #ffffff !important;
                        background: linear-gradient(135deg, ${
                          amoledColors.accent
                        }, ${amoledColors.accentHover}) !important;
                        border-color: ${amoledColors.accent} !important;
                        box-shadow: 0 2px 8px ${
                          amoledColors.accent
                        }40 !important;
                        transform: translateY(-1px) !important;
                      }

                      .nav-pills .nav-link.active::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
                        border-radius: 8px;
                        pointer-events: none;
                      }

                      .nav-pills .nav-link svg {
                        margin-right: 0 !important;
                        font-size: ${
                          window.innerWidth < 768 ? '0.85rem' : '0.95rem'
                        } !important;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
                        opacity: 0.85;
                      }

                      .nav-pills .nav-link:hover svg {
                        transform: scale(1.1) !important;
                        opacity: 1;
                        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
                      }

                      .nav-pills .nav-link.active svg {
                        transform: scale(1.05) !important;
                        opacity: 1;
                        filter: drop-shadow(0 1px 3px rgba(0,0,0,0.2));
                        color: #ffffff !important;
                      }

                      @media (max-width: 576px) {
                        .nav-pills {
                          padding: 0.15rem !important;
                          gap: 0.2rem !important;
                        }

                        .nav-pills .nav-item {
                          flex: 1 1 33.333% !important;
                          max-width: 33.333% !important;
                        }

                        .nav-pills .nav-link {
                          font-size: 0.7rem !important;
                          padding: 0.3rem 0.2rem !important;
                          min-height: 32px !important;
                          gap: 0.25rem !important;
                        }

                        .nav-pills .nav-link svg {
                          font-size: 0.75rem !important;
                          margin-right: 0 !important;
                        }
                      }
                    `}
                  </style>
                  <Tab
                    eventKey='meal-products'
                    title={
                      <span
                        style={{
                          fontSize: 'inherit',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <FaAppleAlt
                          style={{
                            fontSize: '1rem',
                            color: 'inherit',
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                          }}
                        />
                        <span>
                          {window.innerWidth >= 480 ? 'Meals' : 'Meals'}
                        </span>
                      </span>
                    }
                  >
                    <div className={window.innerWidth < 768 ? 'mb-2' : 'mb-3'}>
                      <Form.Group>
                        <div className='position-relative'>
                          <FaSearch
                            style={{
                              position: 'absolute',
                              left: '0.75rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: amoledColors.textMuted,
                              zIndex: 2,
                              fontSize:
                                window.innerWidth < 768 ? '0.85rem' : '1rem',
                            }}
                          />
                          <Form.Control
                            type='text'
                            placeholder={
                              window.innerWidth < 768
                                ? 'Search meals...'
                                : 'Search for meal products...'
                            }
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                              paddingLeft: '2.5rem',
                              backgroundColor: amoledColors.cardBg,
                              borderColor: amoledColors.border,
                              color: amoledColors.text,
                              fontSize:
                                window.innerWidth < 768 ? '0.9rem' : '1rem',
                              padding:
                                window.innerWidth < 768
                                  ? '0.5rem 0.75rem 0.5rem 2.5rem'
                                  : '0.75rem 1rem 0.75rem 2.5rem',
                            }}
                          />
                        </div>
                      </Form.Group>
                    </div>

                    {selectedProduct ? (
                      <div
                        style={{
                          padding: window.innerWidth < 768 ? '0.75rem' : '1rem',
                          backgroundColor: isDarkMode
                            ? 'rgba(168, 85, 247, 0.1)'
                            : 'rgba(110, 68, 178, 0.1)',
                          borderRadius: '12px',
                          border: `2px solid ${amoledColors.accent}`,
                          marginBottom:
                            window.innerWidth < 768 ? '0.75rem' : '1rem',
                        }}
                      >
                        <div className='d-flex align-items-center'>
                          <img
                            src={selectedProduct.image}
                            alt={selectedProduct.name}
                            style={{
                              width: window.innerWidth < 768 ? '50px' : '60px',
                              height: window.innerWidth < 768 ? '50px' : '60px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              marginRight:
                                window.innerWidth < 768 ? '0.75rem' : '1rem',
                            }}
                          />
                          <div className='flex-grow-1'>
                            <h6
                              style={{
                                color: amoledColors.text,
                                margin: 0,
                                fontSize:
                                  window.innerWidth < 768 ? '0.9rem' : '1rem',
                              }}
                            >
                              {selectedProduct.name}
                            </h6>
                            <div className='d-flex flex-wrap gap-1 mt-1'>
                              {selectedProduct.mealType?.map((type, index) => (
                                <Badge
                                  key={index}
                                  bg='secondary'
                                  style={{
                                    fontSize:
                                      window.innerWidth < 768
                                        ? '0.6rem'
                                        : '0.7rem',
                                  }}
                                >
                                  {type}
                                </Badge>
                              ))}
                            </div>
                            {selectedProduct.nutrition && (
                              <div
                                className={`d-flex gap-${
                                  window.innerWidth < 768 ? '2' : '3'
                                } mt-2`}
                                style={{
                                  fontSize:
                                    window.innerWidth < 768
                                      ? '0.7rem'
                                      : '0.8rem',
                                  color: amoledColors.textMuted,
                                }}
                              >
                                <span>
                                  <FaFire
                                    className='me-1'
                                    style={{ color: amoledColors.warning }}
                                  />
                                  {selectedProduct.nutrition.calories} cal
                                </span>
                                <span>
                                  P: {selectedProduct.nutrition.protein}g
                                </span>
                                <span>
                                  C: {selectedProduct.nutrition.carbs}g
                                </span>
                                <span>F: {selectedProduct.nutrition.fat}g</span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant='outline-danger'
                            size='sm'
                            onClick={() => setSelectedProduct(null)}
                          >
                            <FaTimes />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`text-center py-${
                          window.innerWidth < 768 ? '3' : '4'
                        }`}
                      >
                        <FaSearch
                          size={window.innerWidth < 768 ? 24 : 32}
                          style={{
                            color: amoledColors.textMuted,
                            marginBottom:
                              window.innerWidth < 768 ? '0.75rem' : '1rem',
                          }}
                        />
                        <p
                          style={{
                            color: amoledColors.textMuted,
                            fontSize:
                              window.innerWidth < 768 ? '0.85rem' : '1rem',
                            marginBottom:
                              window.innerWidth < 768 ? '0.75rem' : '1rem',
                          }}
                        >
                          {searchTerm
                            ? 'No meal products found'
                            : 'Start typing to search for meal products'}
                        </p>
                        <Button
                          variant='outline-primary'
                          size={window.innerWidth < 768 ? 'sm' : 'md'}
                          onClick={() => setShowProductModal(true)}
                          style={{
                            borderColor: amoledColors.accent,
                            color: amoledColors.accent,
                          }}
                        >
                          <FaSearch className='me-2' />
                          Browse Meals
                        </Button>
                      </div>
                    )}
                  </Tab>

                  <Tab
                    eventKey='custom-meal'
                    title={
                      <span
                        style={{
                          fontSize: 'inherit',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <FaPlus
                          style={{
                            fontSize: '0.9rem',
                            color: 'inherit',
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                          }}
                        />
                        <span>
                          {window.innerWidth >= 480 ? 'Custom' : 'Custom'}
                        </span>
                      </span>
                    }
                  >
                    {/* Meal Name - Full Width */}
                    <Row className='g-2 mb-3'>
                      <Col xs={12}>
                        <Form.Group
                          className={window.innerWidth < 768 ? 'mb-2' : 'mb-3'}
                        >
                          <Form.Label
                            style={{
                              color: amoledColors.text,
                              fontSize:
                                window.innerWidth < 768 ? '0.9rem' : '1rem',
                            }}
                          >
                            Meal Name
                          </Form.Label>
                          <Form.Control
                            type='text'
                            placeholder='e.g., Homemade Pasta'
                            value={customMealData.name}
                            onChange={(e) =>
                              setCustomMealData({
                                ...customMealData,
                                name: e.target.value,
                              })
                            }
                            style={{
                              backgroundColor: amoledColors.cardBg,
                              borderColor: amoledColors.border,
                              color: amoledColors.text,
                              fontSize:
                                window.innerWidth < 768 ? '0.9rem' : '1rem',
                              padding:
                                window.innerWidth < 768
                                  ? '0.5rem 0.75rem'
                                  : '0.75rem',
                            }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Nutrition Fields - Compact Grid */}
                    <Row className='g-2'>
                      <Col xs={6} md={3}>
                        <Form.Group
                          className={window.innerWidth < 768 ? 'mb-1' : 'mb-2'}
                        >
                          <Form.Label
                            style={{
                              color: amoledColors.text,
                              fontSize:
                                window.innerWidth < 768 ? '0.8rem' : '0.9rem',
                              marginBottom:
                                window.innerWidth < 768 ? '0.25rem' : '0.5rem',
                            }}
                          >
                            Calories
                          </Form.Label>
                          <Form.Control
                            type='number'
                            placeholder='0'
                            value={customMealData.calories}
                            onChange={(e) =>
                              setCustomMealData({
                                ...customMealData,
                                calories: e.target.value,
                              })
                            }
                            style={{
                              backgroundColor: amoledColors.cardBg,
                              borderColor: amoledColors.border,
                              color: amoledColors.text,
                              fontSize:
                                window.innerWidth < 768 ? '0.85rem' : '0.9rem',
                              padding:
                                window.innerWidth < 768
                                  ? '0.4rem 0.6rem'
                                  : '0.6rem',
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={6} md={3}>
                        <Form.Group
                          className={window.innerWidth < 768 ? 'mb-1' : 'mb-2'}
                        >
                          <Form.Label
                            style={{
                              color: amoledColors.text,
                              fontSize:
                                window.innerWidth < 768 ? '0.8rem' : '0.9rem',
                              marginBottom:
                                window.innerWidth < 768 ? '0.25rem' : '0.5rem',
                            }}
                          >
                            Protein (g)
                          </Form.Label>
                          <Form.Control
                            type='number'
                            step='0.1'
                            placeholder='0'
                            value={customMealData.protein}
                            onChange={(e) =>
                              setCustomMealData({
                                ...customMealData,
                                protein: e.target.value,
                              })
                            }
                            style={{
                              backgroundColor: amoledColors.cardBg,
                              borderColor: amoledColors.border,
                              color: amoledColors.text,
                              fontSize:
                                window.innerWidth < 768 ? '0.85rem' : '0.9rem',
                              padding:
                                window.innerWidth < 768
                                  ? '0.4rem 0.6rem'
                                  : '0.6rem',
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={6} md={3}>
                        <Form.Group
                          className={window.innerWidth < 768 ? 'mb-1' : 'mb-2'}
                        >
                          <Form.Label
                            style={{
                              color: amoledColors.text,
                              fontSize:
                                window.innerWidth < 768 ? '0.8rem' : '0.9rem',
                              marginBottom:
                                window.innerWidth < 768 ? '0.25rem' : '0.5rem',
                            }}
                          >
                            Carbs (g)
                          </Form.Label>
                          <Form.Control
                            type='number'
                            step='0.1'
                            placeholder='0'
                            value={customMealData.carbs}
                            onChange={(e) =>
                              setCustomMealData({
                                ...customMealData,
                                carbs: e.target.value,
                              })
                            }
                            style={{
                              backgroundColor: amoledColors.cardBg,
                              borderColor: amoledColors.border,
                              color: amoledColors.text,
                              fontSize:
                                window.innerWidth < 768 ? '0.85rem' : '0.9rem',
                              padding:
                                window.innerWidth < 768
                                  ? '0.4rem 0.6rem'
                                  : '0.6rem',
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={6} md={3}>
                        <Form.Group
                          className={window.innerWidth < 768 ? 'mb-1' : 'mb-2'}
                        >
                          <Form.Label
                            style={{
                              color: amoledColors.text,
                              fontSize:
                                window.innerWidth < 768 ? '0.8rem' : '0.9rem',
                              marginBottom:
                                window.innerWidth < 768 ? '0.25rem' : '0.5rem',
                            }}
                          >
                            Fat (g)
                          </Form.Label>
                          <Form.Control
                            type='number'
                            step='0.1'
                            placeholder='0'
                            value={customMealData.fat}
                            onChange={(e) =>
                              setCustomMealData({
                                ...customMealData,
                                fat: e.target.value,
                              })
                            }
                            style={{
                              backgroundColor: amoledColors.cardBg,
                              borderColor: amoledColors.border,
                              color: amoledColors.text,
                              fontSize:
                                window.innerWidth < 768 ? '0.85rem' : '0.9rem',
                              padding:
                                window.innerWidth < 768
                                  ? '0.4rem 0.6rem'
                                  : '0.6rem',
                            }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Fiber Field - Separate Row for Better Layout */}
                    <Row className='g-2'>
                      <Col xs={6} md={3}>
                        <Form.Group
                          className={window.innerWidth < 768 ? 'mb-1' : 'mb-2'}
                        >
                          <Form.Label
                            style={{
                              color: amoledColors.text,
                              fontSize:
                                window.innerWidth < 768 ? '0.8rem' : '0.9rem',
                              marginBottom:
                                window.innerWidth < 768 ? '0.25rem' : '0.5rem',
                            }}
                          >
                            Fiber (g)
                          </Form.Label>
                          <Form.Control
                            type='number'
                            step='0.1'
                            placeholder='0'
                            value={customMealData.fiber}
                            onChange={(e) =>
                              setCustomMealData({
                                ...customMealData,
                                fiber: e.target.value,
                              })
                            }
                            style={{
                              backgroundColor: amoledColors.cardBg,
                              borderColor: amoledColors.border,
                              color: amoledColors.text,
                              fontSize:
                                window.innerWidth < 768 ? '0.85rem' : '0.9rem',
                              padding:
                                window.innerWidth < 768
                                  ? '0.4rem 0.6rem'
                                  : '0.6rem',
                            }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Tab>

                  {/* Upload Meal Image Tab - Only show if user has the feature flag enabled */}
                  {(() => {
                    console.log('🔍 Debug - userInfo:', userInfo);
                    console.log(
                      '🔍 Debug - featureFlags:',
                      userInfo?.featureFlags
                    );
                    console.log(
                      '🔍 Debug - uploadMealImage flag:',
                      userInfo?.featureFlags?.uploadMealImage
                    );
                    return userInfo?.featureFlags?.uploadMealImage;
                  })() && (
                    <Tab
                      eventKey='upload-meal'
                      title={
                        <span
                          style={{
                            fontSize: 'inherit',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <FaImage
                            style={{
                              fontSize: '0.9rem',
                              color: 'inherit',
                              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                            }}
                          />
                          <span>
                            {window.innerWidth >= 480 ? 'Upload' : 'Upload'}
                          </span>
                        </span>
                      }
                    >
                      {/* AI Analysis Section - Enhanced */}
                      <div className='mb-4'>
                        <div
                          style={{
                            background: `linear-gradient(135deg, ${
                              isDarkMode
                                ? 'rgba(168, 85, 247, 0.08)'
                                : 'rgba(110, 68, 178, 0.08)'
                            }, ${
                              isDarkMode
                                ? 'rgba(99, 102, 241, 0.05)'
                                : 'rgba(67, 56, 202, 0.05)'
                            })`,
                            borderRadius: '12px',
                            border: `1px solid ${
                              isDarkMode
                                ? 'rgba(168, 85, 247, 0.2)'
                                : 'rgba(110, 68, 178, 0.2)'
                            }`,
                            padding:
                              window.innerWidth < 480
                                ? '0.75rem'
                                : window.innerWidth < 768
                                ? '1rem'
                                : '1.25rem',
                            position: 'relative',
                            overflow: 'hidden',
                            width: '100%',
                          }}
                        >
                          {/* Background accent */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '-50%',
                              right: '-20%',
                              width: '200px',
                              height: '200px',
                              background: `radial-gradient(circle, ${amoledColors.accent}15, transparent 70%)`,
                              borderRadius: '50%',
                              pointerEvents: 'none',
                            }}
                          />

                          {/* Header */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom:
                                window.innerWidth < 480
                                  ? '0.5rem'
                                  : window.innerWidth < 768
                                  ? '0.75rem'
                                  : '1rem',
                              position: 'relative',
                              zIndex: 1,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <div
                                style={{
                                  background: `linear-gradient(135deg, ${amoledColors.accent}, ${amoledColors.accentHover})`,
                                  borderRadius: '8px',
                                  padding:
                                    window.innerWidth < 480
                                      ? '0.375rem'
                                      : '0.5rem',
                                  marginRight:
                                    window.innerWidth < 480
                                      ? '0.5rem'
                                      : '0.75rem',
                                  boxShadow: `0 2px 8px ${amoledColors.accent}25`,
                                }}
                              >
                                <FaFire
                                  style={{
                                    color: 'white',
                                    fontSize:
                                      window.innerWidth < 480
                                        ? '0.875rem'
                                        : window.innerWidth < 768
                                        ? '1rem'
                                        : '1.125rem',
                                  }}
                                />
                              </div>
                              <div style={{ textAlign: 'left' }}>
                                <h5
                                  style={{
                                    color: amoledColors.text,
                                    margin: 0,
                                    fontSize:
                                      window.innerWidth < 480
                                        ? '0.9rem'
                                        : window.innerWidth < 768
                                        ? '1rem'
                                        : '1.1rem',
                                    fontWeight: '700',
                                  }}
                                >
                                  AI Nutrition Analysis
                                </h5>
                                {window.innerWidth >= 768 && (
                                  <p
                                    style={{
                                      color: amoledColors.textMuted,
                                      margin: 0,
                                      fontSize: '0.8rem',
                                      lineHeight: '1.3',
                                    }}
                                  >
                                    Get instant AI-powered nutrition insights
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Status indicators moved to top bar */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap:
                                  window.innerWidth < 480
                                    ? '0.5rem'
                                    : '0.75rem',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding:
                                    window.innerWidth < 480
                                      ? '0.25rem 0.5rem'
                                      : '0.375rem 0.625rem',
                                  backgroundColor: uploadMealData.image
                                    ? 'rgba(34, 197, 94, 0.15)'
                                    : 'rgba(251, 146, 60, 0.15)',
                                  borderRadius: '16px',
                                  border: `1px solid ${
                                    uploadMealData.image
                                      ? 'rgba(34, 197, 94, 0.3)'
                                      : 'rgba(251, 146, 60, 0.3)'
                                  }`,
                                }}
                              >
                                <div
                                  style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: uploadMealData.image
                                      ? '#22c55e'
                                      : '#fb923c',
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize:
                                      window.innerWidth < 480
                                        ? '0.65rem'
                                        : '0.7rem',
                                    fontWeight: '600',
                                    color: uploadMealData.image
                                      ? '#22c55e'
                                      : '#fb923c',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {window.innerWidth < 480 ? 'Img' : 'Image'}{' '}
                                  {uploadMealData.image ? '' : ''}
                                </span>
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding:
                                    window.innerWidth < 480
                                      ? '0.25rem 0.5rem'
                                      : '0.375rem 0.625rem',
                                  backgroundColor: uploadMealData.name.trim()
                                    ? 'rgba(34, 197, 94, 0.15)'
                                    : 'rgba(251, 146, 60, 0.15)',
                                  borderRadius: '16px',
                                  border: `1px solid ${
                                    uploadMealData.name.trim()
                                      ? 'rgba(34, 197, 94, 0.3)'
                                      : 'rgba(251, 146, 60, 0.3)'
                                  }`,
                                }}
                              >
                                <div
                                  style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: uploadMealData.name.trim()
                                      ? '#22c55e'
                                      : '#fb923c',
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize:
                                      window.innerWidth < 480
                                        ? '0.65rem'
                                        : '0.7rem',
                                    fontWeight: '600',
                                    color: uploadMealData.name.trim()
                                      ? '#22c55e'
                                      : '#fb923c',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  Name {uploadMealData.name.trim() ? '' : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* AI Analysis Button - More compact */}
                          <Button
                            onClick={handleAiAnalysis}
                            disabled={
                              isAiAnalyzing ||
                              !uploadMealData.image ||
                              !uploadMealData.name.trim()
                            }
                            style={{
                              width: '100%',
                              background:
                                uploadMealData.image &&
                                uploadMealData.name.trim()
                                  ? `linear-gradient(135deg, ${amoledColors.accent}, ${amoledColors.accentHover})`
                                  : 'transparent',
                              border: `1px solid ${
                                uploadMealData.image &&
                                uploadMealData.name.trim()
                                  ? amoledColors.accent
                                  : amoledColors.border
                              }`,
                              color:
                                uploadMealData.image &&
                                uploadMealData.name.trim()
                                  ? 'white'
                                  : amoledColors.textMuted,
                              padding:
                                window.innerWidth < 480
                                  ? '0.5rem 0.75rem'
                                  : window.innerWidth < 768
                                  ? '0.625rem 1rem'
                                  : '0.75rem 1rem',
                              fontSize:
                                window.innerWidth < 480
                                  ? '0.8rem'
                                  : window.innerWidth < 768
                                  ? '0.85rem'
                                  : '0.9rem',
                              fontWeight: '600',
                              borderRadius: '8px',
                              boxShadow:
                                uploadMealData.image &&
                                uploadMealData.name.trim()
                                  ? `0 2px 8px ${amoledColors.accent}25`
                                  : 'none',
                              transition: 'all 0.3s ease',
                              position: 'relative',
                              zIndex: 1,
                            }}
                          >
                            {isAiAnalyzing ? (
                              <>
                                <span
                                  className='spinner-border spinner-border-sm me-2'
                                  role='status'
                                  aria-hidden='true'
                                  style={{
                                    width: '0.875rem',
                                    height: '0.875rem',
                                  }}
                                />
                                {window.innerWidth < 480
                                  ? 'AI...'
                                  : window.innerWidth < 768
                                  ? 'Analyzing...'
                                  : 'Analyzing...'}
                              </>
                            ) : (
                              <>
                                <FaFire className='me-2' />
                                {uploadMealData.image &&
                                uploadMealData.name.trim()
                                  ? window.innerWidth < 480
                                    ? 'Analyze with AI'
                                    : 'Analyze Nutrition with AI'
                                  : window.innerWidth < 480
                                  ? 'Complete Above'
                                  : 'Complete Requirements Above'}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Image Upload Section */}
                      <Row className='g-2 mb-3'>
                        <Col xs={12}>
                          <Form.Group
                            className={
                              window.innerWidth < 768 ? 'mb-2' : 'mb-3'
                            }
                          >
                            <Form.Label
                              style={{
                                color: amoledColors.text,
                                fontSize:
                                  window.innerWidth < 768 ? '0.9rem' : '1rem',
                              }}
                            >
                              Meal Image
                            </Form.Label>

                            {/* Compact Image Upload Section */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap:
                                  window.innerWidth < 768 ? '0.75rem' : '1rem',
                                padding:
                                  window.innerWidth < 768 ? '0.75rem' : '1rem',
                                backgroundColor: amoledColors.cardBg,
                                border: `1px solid ${amoledColors.border}`,
                                borderRadius: '8px',
                              }}
                            >
                              {/* Small Image Icon */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width:
                                    window.innerWidth < 768 ? '40px' : '48px',
                                  height:
                                    window.innerWidth < 768 ? '40px' : '48px',
                                  backgroundColor: isDarkMode
                                    ? '#222222'
                                    : '#f8f9fa',
                                  borderRadius: '8px',
                                  border: `1px solid ${amoledColors.border}`,
                                  flexShrink: 0,
                                }}
                              >
                                {uploadMealData.image ? (
                                  <img
                                    src={uploadMealData.image}
                                    alt='Meal'
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      borderRadius: '6px',
                                    }}
                                  />
                                ) : (
                                  <FaImage
                                    size={window.innerWidth < 768 ? 16 : 20}
                                    color={amoledColors.textMuted}
                                  />
                                )}
                              </div>

                              {/* Horizontal Button Layout */}
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '0.5rem',
                                  flex: 1,
                                }}
                              >
                                <Button
                                  onClick={() =>
                                    document
                                      .getElementById('upload-meal-file-input')
                                      ?.click()
                                  }
                                  style={{
                                    backgroundColor: amoledColors.accent,
                                    border: 'none',
                                    padding:
                                      window.innerWidth < 768
                                        ? '0.4rem 0.75rem'
                                        : '0.5rem 1rem',
                                    borderRadius: '6px',
                                    color: '#ffffff',
                                    fontSize:
                                      window.innerWidth < 768
                                        ? '0.8rem'
                                        : '0.85rem',
                                    flex: 1,
                                  }}
                                  size='sm'
                                >
                                  <FaCloudUploadAlt className='me-1' />
                                  Upload
                                </Button>

                                <Button
                                  onClick={() =>
                                    document
                                      .getElementById(
                                        'upload-meal-camera-input'
                                      )
                                      ?.click()
                                  }
                                  style={{
                                    backgroundColor: '#28a745',
                                    border: 'none',
                                    padding:
                                      window.innerWidth < 768
                                        ? '0.4rem 0.75rem'
                                        : '0.5rem 1rem',
                                    borderRadius: '6px',
                                    color: '#ffffff',
                                    fontSize:
                                      window.innerWidth < 768
                                        ? '0.8rem'
                                        : '0.85rem',
                                    flex: 1,
                                  }}
                                  size='sm'
                                >
                                  <FaCamera className='me-1' />
                                  Camera
                                </Button>
                              </div>

                              {/* Remove button if image exists */}
                              {uploadMealData.image && (
                                <Button
                                  variant='outline-danger'
                                  size='sm'
                                  onClick={() =>
                                    setUploadMealData({
                                      ...uploadMealData,
                                      image: '',
                                    })
                                  }
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                  }}
                                >
                                  <FaTimes />
                                </Button>
                              )}
                            </div>

                            {/* Hidden file inputs */}
                            <input
                              id='upload-meal-file-input'
                              type='file'
                              accept='image/*'
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Create a temporary object URL for preview
                                  const tempUrl = URL.createObjectURL(file);
                                  setUploadMealData({
                                    ...uploadMealData,
                                    image: tempUrl,
                                  });
                                  // TODO: Implement actual upload to Cloudinary here
                                  // For now, we're just showing the preview
                                }
                              }}
                            />

                            <input
                              id='upload-meal-camera-input'
                              type='file'
                              accept='image/*'
                              capture='environment'
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Create a temporary object URL for preview
                                  const tempUrl = URL.createObjectURL(file);
                                  setUploadMealData({
                                    ...uploadMealData,
                                    image: tempUrl,
                                  });
                                  // TODO: Implement actual upload to Cloudinary here
                                  // For now, we're just showing the preview
                                }
                              }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Meal Name and Description */}
                      <Row className='g-2 mb-3'>
                        <Col xs={12} md={6}>
                          <Form.Group
                            className={
                              window.innerWidth < 768 ? 'mb-2' : 'mb-3'
                            }
                          >
                            <Form.Label
                              style={{
                                color: amoledColors.text,
                                fontSize:
                                  window.innerWidth < 768 ? '0.9rem' : '1rem',
                              }}
                            >
                              Meal Name
                            </Form.Label>
                            <Form.Control
                              type='text'
                              placeholder='e.g., My Delicious Meal'
                              value={uploadMealData.name}
                              onChange={(e) =>
                                setUploadMealData({
                                  ...uploadMealData,
                                  name: e.target.value,
                                })
                              }
                              style={{
                                backgroundColor: amoledColors.cardBg,
                                borderColor: amoledColors.border,
                                color: amoledColors.text,
                                fontSize:
                                  window.innerWidth < 768 ? '0.9rem' : '1rem',
                                padding:
                                  window.innerWidth < 768
                                    ? '0.5rem 0.75rem'
                                    : '0.75rem',
                              }}
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Group
                            className={
                              window.innerWidth < 768 ? 'mb-2' : 'mb-3'
                            }
                          >
                            <Form.Label
                              style={{
                                color: amoledColors.text,
                                fontSize:
                                  window.innerWidth < 768 ? '0.9rem' : '1rem',
                              }}
                            >
                              Description
                            </Form.Label>
                            <Form.Control
                              as='textarea'
                              rows={window.innerWidth < 768 ? 2 : 3}
                              placeholder='Describe your meal ingredients, cooking method, or any notes...'
                              value={uploadMealData.description}
                              onChange={(e) =>
                                setUploadMealData({
                                  ...uploadMealData,
                                  description: e.target.value,
                                })
                              }
                              style={{
                                backgroundColor: amoledColors.cardBg,
                                borderColor: amoledColors.border,
                                color: amoledColors.text,
                                fontSize:
                                  window.innerWidth < 768 ? '0.9rem' : '1rem',
                                padding:
                                  window.innerWidth < 768
                                    ? '0.5rem 0.75rem'
                                    : '0.75rem',
                              }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Nutrition Fields - Compact Grid */}
                      <Row className='g-2 mb-3'>
                        <Col xs={6} md={3}>
                          <Form.Group
                            className={
                              window.innerWidth < 768 ? 'mb-1' : 'mb-2'
                            }
                          >
                            <Form.Label
                              style={{
                                color: amoledColors.text,
                                fontSize:
                                  window.innerWidth < 768 ? '0.8rem' : '0.9rem',
                                marginBottom:
                                  window.innerWidth < 768
                                    ? '0.25rem'
                                    : '0.5rem',
                              }}
                            >
                              Calories
                            </Form.Label>
                            <Form.Control
                              type='number'
                              placeholder='0'
                              value={uploadMealData.calories}
                              onChange={(e) =>
                                setUploadMealData({
                                  ...uploadMealData,
                                  calories: e.target.value,
                                })
                              }
                              style={{
                                backgroundColor: amoledColors.cardBg,
                                borderColor: amoledColors.border,
                                color: amoledColors.text,
                                fontSize:
                                  window.innerWidth < 768
                                    ? '0.85rem'
                                    : '0.9rem',
                                padding:
                                  window.innerWidth < 768
                                    ? '0.4rem 0.6rem'
                                    : '0.6rem',
                              }}
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={6} md={3}>
                          <Form.Group
                            className={
                              window.innerWidth < 768 ? 'mb-1' : 'mb-2'
                            }
                          >
                            <Form.Label
                              style={{
                                color: amoledColors.text,
                                fontSize:
                                  window.innerWidth < 768 ? '0.8rem' : '0.9rem',
                                marginBottom:
                                  window.innerWidth < 768
                                    ? '0.25rem'
                                    : '0.5rem',
                              }}
                            >
                              Protein (g)
                            </Form.Label>
                            <Form.Control
                              type='number'
                              step='0.1'
                              placeholder='0'
                              value={uploadMealData.protein}
                              onChange={(e) =>
                                setUploadMealData({
                                  ...uploadMealData,
                                  protein: e.target.value,
                                })
                              }
                              style={{
                                backgroundColor: amoledColors.cardBg,
                                borderColor: amoledColors.border,
                                color: amoledColors.text,
                                fontSize:
                                  window.innerWidth < 768
                                    ? '0.85rem'
                                    : '0.9rem',
                                padding:
                                  window.innerWidth < 768
                                    ? '0.4rem 0.6rem'
                                    : '0.6rem',
                              }}
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={6} md={3}>
                          <Form.Group
                            className={
                              window.innerWidth < 768 ? 'mb-1' : 'mb-2'
                            }
                          >
                            <Form.Label
                              style={{
                                color: amoledColors.text,
                                fontSize:
                                  window.innerWidth < 768 ? '0.8rem' : '0.9rem',
                                marginBottom:
                                  window.innerWidth < 768
                                    ? '0.25rem'
                                    : '0.5rem',
                              }}
                            >
                              Carbs (g)
                            </Form.Label>
                            <Form.Control
                              type='number'
                              step='0.1'
                              placeholder='0'
                              value={uploadMealData.carbs}
                              onChange={(e) =>
                                setUploadMealData({
                                  ...uploadMealData,
                                  carbs: e.target.value,
                                })
                              }
                              style={{
                                backgroundColor: amoledColors.cardBg,
                                borderColor: amoledColors.border,
                                color: amoledColors.text,
                                fontSize:
                                  window.innerWidth < 768
                                    ? '0.85rem'
                                    : '0.9rem',
                                padding:
                                  window.innerWidth < 768
                                    ? '0.4rem 0.6rem'
                                    : '0.6rem',
                              }}
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={6} md={3}>
                          <Form.Group
                            className={
                              window.innerWidth < 768 ? 'mb-1' : 'mb-2'
                            }
                          >
                            <Form.Label
                              style={{
                                color: amoledColors.text,
                                fontSize:
                                  window.innerWidth < 768 ? '0.8rem' : '0.9rem',
                                marginBottom:
                                  window.innerWidth < 768
                                    ? '0.25rem'
                                    : '0.5rem',
                              }}
                            >
                              Fat (g)
                            </Form.Label>
                            <Form.Control
                              type='number'
                              step='0.1'
                              placeholder='0'
                              value={uploadMealData.fat}
                              onChange={(e) =>
                                setUploadMealData({
                                  ...uploadMealData,
                                  fat: e.target.value,
                                })
                              }
                              style={{
                                backgroundColor: amoledColors.cardBg,
                                borderColor: amoledColors.border,
                                color: amoledColors.text,
                                fontSize:
                                  window.innerWidth < 768
                                    ? '0.85rem'
                                    : '0.9rem',
                                padding:
                                  window.innerWidth < 768
                                    ? '0.4rem 0.6rem'
                                    : '0.6rem',
                              }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Fiber Field and Image Upload */}
                      <Row className='g-2'>
                        <Col xs={6} md={3}>
                          <Form.Group
                            className={
                              window.innerWidth < 768 ? 'mb-1' : 'mb-2'
                            }
                          >
                            <Form.Label
                              style={{
                                color: amoledColors.text,
                                fontSize:
                                  window.innerWidth < 768 ? '0.8rem' : '0.9rem',
                                marginBottom:
                                  window.innerWidth < 768
                                    ? '0.25rem'
                                    : '0.5rem',
                              }}
                            >
                              Fiber (g)
                            </Form.Label>
                            <Form.Control
                              type='number'
                              step='0.1'
                              placeholder='0'
                              value={uploadMealData.fiber}
                              onChange={(e) =>
                                setUploadMealData({
                                  ...uploadMealData,
                                  fiber: e.target.value,
                                })
                              }
                              style={{
                                backgroundColor: amoledColors.cardBg,
                                borderColor: amoledColors.border,
                                color: amoledColors.text,
                                fontSize:
                                  window.innerWidth < 768
                                    ? '0.85rem'
                                    : '0.9rem',
                                padding:
                                  window.innerWidth < 768
                                    ? '0.4rem 0.6rem'
                                    : '0.6rem',
                              }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Tab>
                  )}
                </Tabs>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column - Meal Details */}
          <Col lg={4} xl={5}>
            <Card
              style={{
                ...cardStyle,
                marginBottom: window.innerWidth < 768 ? '1rem' : '1.5rem',
              }}
            >
              <Card.Header
                style={{
                  backgroundColor: amoledColors.headerBg,
                  borderBottom: `1px solid ${amoledColors.border}`,
                  padding:
                    window.innerWidth < 768 ? '0.75rem 1rem' : '1rem 1.5rem',
                }}
              >
                <h5
                  style={{
                    color: amoledColors.text,
                    margin: 0,
                    fontSize: window.innerWidth < 768 ? '1rem' : '1.125rem',
                  }}
                >
                  Meal Details
                </h5>
              </Card.Header>
              <Card.Body
                style={{
                  padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
                }}
              >
                {/* Date & Time */}
                <Form.Group
                  className={window.innerWidth < 768 ? 'mb-2' : 'mb-3'}
                >
                  <Form.Label
                    style={{
                      color: amoledColors.text,
                      fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem',
                      marginBottom:
                        window.innerWidth < 768 ? '0.25rem' : '0.5rem',
                    }}
                  >
                    Date & Time
                  </Form.Label>
                  <Form.Control
                    type='datetime-local'
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    style={{
                      backgroundColor: amoledColors.cardBg,
                      borderColor: amoledColors.border,
                      color: amoledColors.text,
                      fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem',
                      padding:
                        window.innerWidth < 768 ? '0.5rem 0.75rem' : '0.75rem',
                    }}
                  />
                </Form.Group>

                {/* Meal Type */}
                <Form.Group
                  className={window.innerWidth < 768 ? 'mb-2' : 'mb-3'}
                >
                  <Form.Label
                    style={{
                      color: amoledColors.text,
                      fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem',
                      marginBottom:
                        window.innerWidth < 768 ? '0.25rem' : '0.5rem',
                    }}
                  >
                    Meal Type
                  </Form.Label>
                  <Form.Select
                    value={formData.mealType}
                    onChange={(e) =>
                      setFormData({ ...formData, mealType: e.target.value })
                    }
                    style={{
                      backgroundColor: amoledColors.cardBg,
                      borderColor: amoledColors.border,
                      color: amoledColors.text,
                      fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem',
                      padding:
                        window.innerWidth < 768 ? '0.5rem 0.75rem' : '0.75rem',
                    }}
                  >
                    <option value='breakfast'>Breakfast</option>
                    <option value='lunch'>Lunch</option>
                    <option value='dinner'>Dinner</option>
                    <option value='snack'>Snack</option>
                    <option value='other'>Other</option>
                  </Form.Select>
                </Form.Group>

                {/* Quantities */}
                <Form.Group
                  className={window.innerWidth < 768 ? 'mb-2' : 'mb-3'}
                >
                  <Form.Label
                    style={{
                      color: amoledColors.text,
                      fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem',
                      marginBottom:
                        window.innerWidth < 768 ? '0.25rem' : '0.5rem',
                    }}
                  >
                    Quantities
                  </Form.Label>
                  {formData.items.map((item, index) => (
                    <div
                      key={index}
                      className={`d-flex gap-${
                        window.innerWidth < 768 ? '1' : '2'
                      } mb-2`}
                    >
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
                          flex:
                            window.innerWidth < 768 ? '0 0 70px' : '0 0 80px',
                          fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem',
                          padding:
                            window.innerWidth < 768
                              ? '0.4rem 0.5rem'
                              : '0.5rem 0.75rem',
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
                          fontSize:
                            window.innerWidth < 768 ? '0.85rem' : '1rem',
                          padding:
                            window.innerWidth < 768
                              ? '0.4rem 0.5rem'
                              : '0.5rem 0.75rem',
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
                      {formData.items.length > 1 && (
                        <Button
                          variant='outline-danger'
                          size='sm'
                          onClick={() => removeItem(index)}
                          style={{
                            flex: '0 0 auto',
                            padding:
                              window.innerWidth < 768
                                ? '0.25rem 0.5rem'
                                : '0.375rem 0.75rem',
                          }}
                        >
                          <FaTimes />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant='outline-primary'
                    size='sm'
                    onClick={addItem}
                    style={{
                      borderColor: amoledColors.accent,
                      color: amoledColors.accent,
                      fontSize: window.innerWidth < 768 ? '0.8rem' : '0.875rem',
                      padding:
                        window.innerWidth < 768
                          ? '0.25rem 0.5rem'
                          : '0.375rem 0.75rem',
                    }}
                  >
                    <FaPlus className='me-1' />
                    Add Quantity
                  </Button>
                </Form.Group>

                {/* Feeling */}
                <Form.Group
                  className={window.innerWidth < 768 ? 'mb-2' : 'mb-3'}
                >
                  <Form.Label
                    style={{
                      color: amoledColors.text,
                      fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem',
                      marginBottom:
                        window.innerWidth < 768 ? '0.25rem' : '0.5rem',
                    }}
                  >
                    How did you feel?
                  </Form.Label>
                  <Form.Select
                    value={formData.feeling}
                    onChange={(e) =>
                      setFormData({ ...formData, feeling: e.target.value })
                    }
                    style={{
                      backgroundColor: amoledColors.cardBg,
                      borderColor: amoledColors.border,
                      color: amoledColors.text,
                      fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem',
                      padding:
                        window.innerWidth < 768 ? '0.5rem 0.75rem' : '0.75rem',
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
                <Form.Group
                  className={window.innerWidth < 768 ? 'mb-2' : 'mb-3'}
                >
                  <Form.Label
                    style={{
                      color: amoledColors.text,
                      fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem',
                      marginBottom:
                        window.innerWidth < 768 ? '0.25rem' : '0.5rem',
                    }}
                  >
                    Energy Level After
                  </Form.Label>
                  <Form.Select
                    value={formData.energyLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, energyLevel: e.target.value })
                    }
                    style={{
                      backgroundColor: amoledColors.cardBg,
                      borderColor: amoledColors.border,
                      color: amoledColors.text,
                      fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem',
                      padding:
                        window.innerWidth < 768 ? '0.5rem 0.75rem' : '0.75rem',
                    }}
                  >
                    <option value='high'>High Energy</option>
                    <option value='medium'>Medium Energy</option>
                    <option value='low'>Low Energy</option>
                  </Form.Select>
                </Form.Group>

                {/* Comments */}
                <Form.Group
                  className={window.innerWidth < 768 ? 'mb-3' : 'mb-4'}
                >
                  <Form.Label
                    style={{
                      color: amoledColors.text,
                      fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem',
                      marginBottom:
                        window.innerWidth < 768 ? '0.25rem' : '0.5rem',
                    }}
                  >
                    Comments (Optional)
                  </Form.Label>
                  <Form.Control
                    as='textarea'
                    rows={window.innerWidth < 768 ? 2 : 3}
                    placeholder='How was the meal? Any notes...'
                    value={formData.comments}
                    onChange={(e) =>
                      setFormData({ ...formData, comments: e.target.value })
                    }
                    style={{
                      backgroundColor: amoledColors.cardBg,
                      borderColor: amoledColors.border,
                      color: amoledColors.text,
                      fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem',
                      padding:
                        window.innerWidth < 768 ? '0.5rem 0.75rem' : '0.75rem',
                    }}
                  />
                </Form.Group>

                {/* Estimated Nutrition */}
                {(estimatedNutrition ||
                  activeTab === 'custom-meal' ||
                  activeTab === 'upload-meal') && (
                  <div
                    style={{
                      padding: window.innerWidth < 768 ? '0.75rem' : '1rem',
                      backgroundColor: isDarkMode
                        ? 'rgba(52, 211, 153, 0.1)'
                        : 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '8px',
                      marginBottom:
                        window.innerWidth < 768 ? '0.75rem' : '1rem',
                    }}
                  >
                    <h6
                      style={{
                        color: amoledColors.text,
                        marginBottom: '0.5rem',
                        fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem',
                      }}
                    >
                      Estimated Nutrition
                    </h6>
                    <div
                      style={{
                        fontSize:
                          window.innerWidth < 768 ? '0.8rem' : '0.85rem',
                        color: amoledColors.textMuted,
                        lineHeight: window.innerWidth < 768 ? '1.3' : '1.4',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: window.innerWidth < 768 ? '0.5rem' : '0.75rem',
                        alignItems: 'center',
                      }}
                    >
                      {activeTab === 'custom-meal' ? (
                        <>
                          <span>
                            <FaFire
                              className='me-1'
                              style={{ color: amoledColors.warning }}
                            />
                            {customMealData.calories} cal
                          </span>
                          <span>P: {customMealData.protein}g</span>
                          <span>C: {customMealData.carbs}g</span>
                          <span>F: {customMealData.fat}g</span>
                          <span>Fiber: {customMealData.fiber}g</span>
                        </>
                      ) : activeTab === 'upload-meal' ? (
                        <>
                          <span>
                            <FaFire
                              className='me-1'
                              style={{ color: amoledColors.warning }}
                            />
                            {uploadMealData.calories} cal
                          </span>
                          <span>P: {uploadMealData.protein}g</span>
                          <span>C: {uploadMealData.carbs}g</span>
                          <span>F: {uploadMealData.fat}g</span>
                          <span>Fiber: {uploadMealData.fiber}g</span>
                        </>
                      ) : (
                        <>
                          <span>
                            <FaFire
                              className='me-1'
                              style={{ color: amoledColors.warning }}
                            />
                            {estimatedNutrition.calories} cal
                          </span>
                          <span>P: {estimatedNutrition.protein}g</span>
                          <span>C: {estimatedNutrition.carbs}g</span>
                          <span>F: {estimatedNutrition.fat}g</span>
                          <span>Fiber: {estimatedNutrition.fiber}g</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type='submit'
                  disabled={
                    isCreating ||
                    (activeTab === 'meal-products' && !selectedProduct) ||
                    (activeTab === 'custom-meal' &&
                      !customMealData.name.trim()) ||
                    (activeTab === 'upload-meal' &&
                      (!uploadMealData.name.trim() ||
                        !uploadMealData.image.trim()))
                  }
                  style={{
                    width: '100%',
                    backgroundColor: amoledColors.accent,
                    borderColor: amoledColors.accent,
                    padding: window.innerWidth < 768 ? '0.65rem' : '0.75rem',
                    fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem',
                  }}
                >
                  {isCreating ? (
                    <>
                      <Loader size={window.innerWidth < 768 ? 14 : 16} />
                      <span className='ms-2'>
                        {window.innerWidth < 768
                          ? 'Logging...'
                          : 'Logging Meal...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <FaSave className='me-2' />
                      Log Meal
                    </>
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Product Selection Modal */}
      <Modal
        show={showProductModal}
        onHide={() => setShowProductModal(false)}
        size={window.innerWidth < 768 ? 'md' : 'lg'}
        centered
        fullscreen={window.innerWidth < 576 ? 'sm-down' : false}
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: amoledColors.cardBg,
            borderColor: amoledColors.border,
            padding: window.innerWidth < 768 ? '0.75rem 1rem' : '1rem 1.5rem',
          }}
        >
          <Modal.Title
            style={{
              color: amoledColors.text,
              fontSize: window.innerWidth < 768 ? '1.1rem' : '1.25rem',
            }}
          >
            Select Meal Product
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundColor: amoledColors.cardBg,
            maxHeight: window.innerWidth < 768 ? '70vh' : '60vh',
            overflowY: 'auto',
            padding: window.innerWidth < 768 ? '0.75rem' : '1rem',
          }}
        >
          {isLoadingProducts ? (
            <div className='text-center py-4'>
              <Loader />
            </div>
          ) : productsError ? (
            <Message variant='danger'>Failed to load products</Message>
          ) : (
            <ListGroup variant='flush'>
              {productsData?.products?.map((product) => (
                <ListGroup.Item
                  key={product._id}
                  style={{
                    backgroundColor: amoledColors.cardBg,
                    borderColor: amoledColors.border,
                    cursor: 'pointer',
                    padding: window.innerWidth < 768 ? '0.75rem' : '1rem',
                  }}
                  onClick={() => handleProductSelect(product)}
                >
                  <div className='d-flex align-items-center'>
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: window.innerWidth < 768 ? '40px' : '50px',
                        height: window.innerWidth < 768 ? '40px' : '50px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        marginRight:
                          window.innerWidth < 768 ? '0.75rem' : '1rem',
                      }}
                    />
                    <div className='flex-grow-1'>
                      <h6
                        style={{
                          color: amoledColors.text,
                          margin: 0,
                          fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem',
                        }}
                      >
                        {product.name}
                      </h6>
                      <div className='d-flex flex-wrap gap-1 mt-1'>
                        {product.mealType?.map((type, index) => (
                          <Badge
                            key={index}
                            bg='secondary'
                            style={{
                              fontSize:
                                window.innerWidth < 768 ? '0.6rem' : '0.65rem',
                            }}
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                      {product.nutrition && (
                        <div
                          className={`d-flex gap-${
                            window.innerWidth < 768 ? '1' : '2'
                          } mt-1`}
                          style={{
                            fontSize:
                              window.innerWidth < 768 ? '0.7rem' : '0.75rem',
                            color: amoledColors.textMuted,
                            flexWrap:
                              window.innerWidth < 768 ? 'wrap' : 'nowrap',
                          }}
                        >
                          <span>{product.nutrition.calories} cal</span>
                          <span>P: {product.nutrition.protein}g</span>
                          <span>C: {product.nutrition.carbs}g</span>
                          <span>F: {product.nutrition.fat}g</span>
                        </div>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AddDietEntryScreen;
