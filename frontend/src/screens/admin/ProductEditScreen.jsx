import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import FormContainer from '../../components/FormContainer';
import ProductImageUploader from '../../components/ProductImageUploader';
import { showSuccessToast, showErrorToast } from '../../utils/toastConfig';
import {
    useGetProductDetailsQuery,
    useUpdateProductMutation,
    useCreateProductMutation,
} from '../../slices/productsApiSlice';

const ProductEditScreen = () => {
    const { id: productId } = useParams();
    const isNewProduct = productId === 'new';

    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [youtubeVideo, setYoutubeVideo] = useState('');
    const [isMealDiet, setIsMealDiet] = useState(false);
    const [isViewOnly, setIsViewOnly] = useState(false);
    
    // New workout-specific fields
    const [muscleGroups, setMuscleGroups] = useState([]);
    const [primaryMuscleGroup, setPrimaryMuscleGroup] = useState('');
    const [exerciseType, setExerciseType] = useState('strength');
    const [difficulty, setDifficulty] = useState('intermediate');
    const [equipmentNeeded, setEquipmentNeeded] = useState([]);
    const [instructions, setInstructions] = useState([]);
    const [safetyTips, setSafetyTips] = useState([]);
    const [isCompound, setIsCompound] = useState(false);
    const [isIsolation, setIsIsolation] = useState(false);

    // Nutrition fields for diet/meal products
    const [nutrition, setNutrition] = useState({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        servingSize: '',
        servingWeight: 0
    });
    const [mealType, setMealType] = useState([]);
    const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
    const [preparationTime, setPreparationTime] = useState(0);
    const [ingredients, setIngredients] = useState([]);

    const {
        data: product,
        isLoading,
        refetch,
        error,
    } = useGetProductDetailsQuery(productId, {
        skip: isNewProduct,
    });

    const [updateProduct, { isLoading: loadingUpdate }] =
        useUpdateProductMutation();

    const [createProduct, { isLoading: loadingCreate }] =
        useCreateProductMutation();

    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            if (isNewProduct) {
                const result = await createProduct({
                    name,
                    price: 0, // Set a default value for the backend
                    image,
                    brand: 'N/A', // Set a default value for the backend
                    category,
                    description,
                    youtubeVideo,
                    isMealDiet,
                    isViewOnly,
                    ...(isMealDiet && {
                        nutrition,
                        mealType,
                        dietaryRestrictions,
                        preparationTime,
                        ingredients
                    }),
                    muscleGroups,
                    primaryMuscleGroup,
                    exerciseType,
                    difficulty,
                    equipmentNeeded,
                    instructions,
                    safetyTips,
                    isCompound,
                    isIsolation,
                }).unwrap();
                if (result) {
                    showSuccessToast('Unit created');
                }
            } else {
                await updateProduct({
                    productId,
                    name,
                    price: product.price, // Keep the existing price
                    image,
                    brand: product.brand, // Keep the existing brand
                    category,
                    description,
                    youtubeVideo,
                    isMealDiet,
                    isViewOnly,
                    ...(isMealDiet && {
                        nutrition,
                        mealType,
                        dietaryRestrictions,
                        preparationTime,
                        ingredients
                    }),
                    muscleGroups,
                    primaryMuscleGroup,
                    exerciseType,
                    difficulty,
                    equipmentNeeded,
                    instructions,
                    safetyTips,
                    isCompound,
                    isIsolation,
                }).unwrap();
                showSuccessToast('Unit updated');
                refetch();
            }

            // Check if we should return to a collection edit page
            const returnToCollectionId = localStorage.getItem('returnToCollectionId');
            if (returnToCollectionId) {
                localStorage.removeItem('returnToCollectionId');
                navigate(`/admin/collection/${returnToCollectionId}/edit`);
            } else {
                navigate('/admin/productlist');
            }
        } catch (err) {
            showErrorToast(err?.data?.message || err.error);
        }
    };

    useEffect(() => {
        if (!isNewProduct && product) {
            setName(product.name);
            setImage(product.image);
            setCategory(product.category);
            setDescription(product.description);
            setYoutubeVideo(product.youtubeVideo || '');
            setIsMealDiet(product.isMealDiet || false);
            setIsViewOnly(product.isViewOnly || false);
            
            // Load nutrition fields for diet/meal products
            if (product.nutrition) {
                setNutrition(product.nutrition);
            }
            setMealType(product.mealType || []);
            setDietaryRestrictions(product.dietaryRestrictions || []);
            setPreparationTime(product.preparationTime || 0);
            setIngredients(product.ingredients || []);
            
            // Load workout-specific fields
            setMuscleGroups(product.muscleGroups || []);
            setPrimaryMuscleGroup(product.primaryMuscleGroup || '');
            setExerciseType(product.exerciseType || 'strength');
            setDifficulty(product.difficulty || 'intermediate');
            setEquipmentNeeded(product.equipmentNeeded || []);
            setInstructions(product.instructions || []);
            setSafetyTips(product.safetyTips || []);
            setIsCompound(product.isCompound || false);
            setIsIsolation(product.isIsolation || false);
        }
    }, [product, isNewProduct]);

    // Handle image upload from ProductImageUploader component
    const handleImageUploaded = (imageUrl) => {
        setImage(imageUrl);
    };

    // Determine if we're returning to a collection after edit
    const isReturningToCollection = localStorage.getItem('returnToCollectionId');

    return (
        <>
            <Link to={isReturningToCollection ? `/admin/collection/${isReturningToCollection}/edit` : '/admin/productlist'} className='btn btn-light my-3'>
                Go Back
            </Link>
            <FormContainer>
                <h1>{isNewProduct ? 'Create Unit' : 'Edit Unit'}</h1>
                {(loadingUpdate || loadingCreate) && <Loader />}
                {!isNewProduct && isLoading ? (
                    <Loader />
                ) : error ? (
                    <Message variant='danger'>{error.data.message}</Message>
                ) : (
                    <Form onSubmit={submitHandler}>
                        <Form.Group controlId='name'>
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type='name'
                                placeholder='Enter name'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            ></Form.Control>
                        </Form.Group>

                        <Form.Group controlId='image' className="mt-2">
                            <Form.Label>Image</Form.Label>
                            <Form.Control
                                type='text'
                                placeholder='Enter image url'
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                required
                            ></Form.Control>
                            {/* New direct Cloudinary uploader */}
                            <ProductImageUploader
                                onImageUploaded={handleImageUploaded}
                                currentImage={image}
                            />
                        </Form.Group>

                        <Form.Group controlId='category' className="mt-2">
                            <Form.Label>Category</Form.Label>
                            <Form.Control
                                type='text'
                                placeholder='Enter category'
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                            ></Form.Control>
                        </Form.Group>

                        <Form.Group controlId='isMealDiet' className="mt-3">
                            <Form.Check
                                type='checkbox'
                                label='Is Meal/Diet Unit'
                                checked={isMealDiet}
                                onChange={(e) => setIsMealDiet(e.target.checked)}
                            ></Form.Check>
                            <Form.Text className="text-muted">
                                Check this if the unit is related to meal plans or diet programs
                            </Form.Text>
                        </Form.Group>

                        <Form.Group controlId='isViewOnly' className="mt-3">
                            <Form.Check
                                type='checkbox'
                                label='View Mode Only (No Tracking)'
                                checked={isViewOnly}
                                onChange={(e) => setIsViewOnly(e.target.checked)}
                            ></Form.Check>
                            <Form.Text className="text-muted">
                                Check this to display the unit for viewing only, without any tracking features
                            </Form.Text>
                        </Form.Group>

                        {/* Nutrition Information - Only show for diet/meal products */}
                        {isMealDiet && (
                            <>
                                <hr className="mt-4 mb-3" />
                                <h5>Nutrition Information</h5>
                                
                                <div className="row">
                                    <div className="col-md-6">
                                        <Form.Group controlId='calories' className="mt-3">
                                            <Form.Label>Calories per serving</Form.Label>
                                            <Form.Control
                                                type='number'
                                                placeholder='Enter calories'
                                                value={nutrition.calories}
                                                onChange={(e) => setNutrition({...nutrition, calories: parseFloat(e.target.value) || 0})}
                                            />
                                        </Form.Group>
                                    </div>
                                    <div className="col-md-6">
                                        <Form.Group controlId='servingSize' className="mt-3">
                                            <Form.Label>Serving Size</Form.Label>
                                            <Form.Control
                                                type='text'
                                                placeholder='e.g., 1 cup, 100g'
                                                value={nutrition.servingSize}
                                                onChange={(e) => setNutrition({...nutrition, servingSize: e.target.value})}
                                            />
                                        </Form.Group>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-4">
                                        <Form.Group controlId='protein' className="mt-3">
                                            <Form.Label>Protein (g)</Form.Label>
                                            <Form.Control
                                                type='number'
                                                step='0.1'
                                                placeholder='Protein'
                                                value={nutrition.protein}
                                                onChange={(e) => setNutrition({...nutrition, protein: parseFloat(e.target.value) || 0})}
                                            />
                                        </Form.Group>
                                    </div>
                                    <div className="col-md-4">
                                        <Form.Group controlId='carbs' className="mt-3">
                                            <Form.Label>Carbs (g)</Form.Label>
                                            <Form.Control
                                                type='number'
                                                step='0.1'
                                                placeholder='Carbs'
                                                value={nutrition.carbs}
                                                onChange={(e) => setNutrition({...nutrition, carbs: parseFloat(e.target.value) || 0})}
                                            />
                                        </Form.Group>
                                    </div>
                                    <div className="col-md-4">
                                        <Form.Group controlId='fat' className="mt-3">
                                            <Form.Label>Fat (g)</Form.Label>
                                            <Form.Control
                                                type='number'
                                                step='0.1'
                                                placeholder='Fat'
                                                value={nutrition.fat}
                                                onChange={(e) => setNutrition({...nutrition, fat: parseFloat(e.target.value) || 0})}
                                            />
                                        </Form.Group>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-4">
                                        <Form.Group controlId='fiber' className="mt-3">
                                            <Form.Label>Fiber (g)</Form.Label>
                                            <Form.Control
                                                type='number'
                                                step='0.1'
                                                placeholder='Fiber'
                                                value={nutrition.fiber}
                                                onChange={(e) => setNutrition({...nutrition, fiber: parseFloat(e.target.value) || 0})}
                                            />
                                        </Form.Group>
                                    </div>
                                    <div className="col-md-4">
                                        <Form.Group controlId='sugar' className="mt-3">
                                            <Form.Label>Sugar (g)</Form.Label>
                                            <Form.Control
                                                type='number'
                                                step='0.1'
                                                placeholder='Sugar'
                                                value={nutrition.sugar}
                                                onChange={(e) => setNutrition({...nutrition, sugar: parseFloat(e.target.value) || 0})}
                                            />
                                        </Form.Group>
                                    </div>
                                    <div className="col-md-4">
                                        <Form.Group controlId='sodium' className="mt-3">
                                            <Form.Label>Sodium (mg)</Form.Label>
                                            <Form.Control
                                                type='number'
                                                step='0.1'
                                                placeholder='Sodium'
                                                value={nutrition.sodium}
                                                onChange={(e) => setNutrition({...nutrition, sodium: parseFloat(e.target.value) || 0})}
                                            />
                                        </Form.Group>
                                    </div>
                                </div>

                                <Form.Group controlId='mealType' className="mt-3">
                                    <Form.Label>Meal Types</Form.Label>
                                    <div>
                                        {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
                                            <Form.Check
                                                key={type}
                                                inline
                                                type='checkbox'
                                                label={type.charAt(0).toUpperCase() + type.slice(1)}
                                                checked={mealType.includes(type)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setMealType([...mealType, type]);
                                                    } else {
                                                        setMealType(mealType.filter(t => t !== type));
                                                    }
                                                }}
                                            />
                                        ))}
                                    </div>
                                </Form.Group>

                                <Form.Group controlId='preparationTime' className="mt-3">
                                    <Form.Label>Preparation Time (minutes)</Form.Label>
                                    <Form.Control
                                        type='number'
                                        placeholder='Enter preparation time'
                                        value={preparationTime}
                                        onChange={(e) => setPreparationTime(parseInt(e.target.value) || 0)}
                                    />
                                </Form.Group>
                            </>
                        )}

                        <Form.Group controlId='description' className="mt-2">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as='textarea'
                                rows={3}
                                placeholder='Enter description'
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            ></Form.Control>
                            <Form.Text className="text-muted">
                                To add a link in description, use format: [visible text](url) - example: [Google](https://google.com)
                            </Form.Text>
                        </Form.Group>

                        <Form.Group controlId='youtubeVideo' className="mt-2">
                            <Form.Label>YouTube Video URL</Form.Label>
                            <Form.Control
                                type='text'
                                placeholder='Enter YouTube video URL (optional)'
                                value={youtubeVideo}
                                onChange={(e) => setYoutubeVideo(e.target.value)}
                            ></Form.Control>
                            <Form.Text className="text-muted">
                                Enter YouTube URL (e.g., https://www.youtube.com/watch?v=12345 or https://youtu.be/12345).
                                This field is optional.
                            </Form.Text>
                        </Form.Group>

                        {/* Simplified Exercise Details - Only Primary Muscle Group */}
                        {!isMealDiet && !isViewOnly && (
                            <>
                                <hr className="mt-4 mb-3" />
                                <h5>Exercise Details</h5>
                                
                                <Form.Group controlId='primaryMuscleGroup' className="mt-3">
                                    <Form.Label>Primary Muscle Group</Form.Label>
                                    <Form.Select
                                        value={primaryMuscleGroup}
                                        onChange={(e) => {
                                            setPrimaryMuscleGroup(e.target.value);
                                            // Automatically set muscle groups array to include primary muscle group
                                            if (e.target.value) {
                                                setMuscleGroups([e.target.value]);
                                            }
                                        }}
                                        required
                                    >
                                        <option value="">Select primary muscle group</option>
                                        <option value="chest">Chest</option>
                                        <option value="back">Back</option>
                                        <option value="shoulders">Shoulders</option>
                                        <option value="arms">Arms</option>
                                        <option value="biceps">Biceps</option>
                                        <option value="triceps">Triceps</option>
                                        <option value="forearms">Forearms</option>
                                        <option value="core">Core</option>
                                        <option value="abs">Abs</option>
                                        <option value="obliques">Obliques</option>
                                        <option value="legs">Legs</option>
                                        <option value="quadriceps">Quadriceps</option>
                                        <option value="hamstrings">Hamstrings</option>
                                        <option value="glutes">Glutes</option>
                                        <option value="calves">Calves</option>
                                        <option value="full-body">Full Body</option>
                                    </Form.Select>
                                    <Form.Text className="text-muted">
                                        This will determine which muscle group lights up when the exercise is performed
                                    </Form.Text>
                                </Form.Group>
                            </>
                        )}
                        

                        <Button
                            type='submit'
                            variant='primary'
                            style={{ marginTop: '1rem' }}
                        >
                            {isNewProduct ? 'Create' : 'Update'}
                        </Button>
                    </Form>
                )}
            </FormContainer>
        </>
    );
};

export default ProductEditScreen;
