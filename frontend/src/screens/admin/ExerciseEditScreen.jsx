import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import FormContainer from '../../components/FormContainer';
import ProductImageUploader from '../../components/ProductImageUploader';
import { showSuccessToast, showErrorToast } from '../../utils/toastConfig';
import {
    useGetExerciseDetailsQuery,
    useUpdateExerciseMutation,
    useCreateExerciseMutation,
} from '../../slices/exercisesApiSlice';

const ExerciseEditScreen = () => {
    const { id: exerciseId } = useParams();
    const isNewExercise = exerciseId === 'new';

    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [youtubeVideo, setYoutubeVideo] = useState('');
    const [isMealDiet, setIsMealDiet] = useState(false);

    const {
        data: exercise,
        isLoading,
        refetch,
        error,
    } = useGetExerciseDetailsQuery(exerciseId, {
        skip: isNewExercise,
    });

    const [updateExercise, { isLoading: loadingUpdate }] =
        useUpdateExerciseMutation();

    const [createExercise, { isLoading: loadingCreate }] =
        useCreateExerciseMutation();

    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            if (isNewExercise) {
                const result = await createExercise({
                    name,
                    image,
                    category,
                    description,
                    youtubeVideo,
                    isMealDiet,
                }).unwrap();
                if (result) {
                    showSuccessToast('Exercise created');
                }
            } else {
                await updateExercise({
                    exerciseId,
                    name,
                    image,
                    category,
                    description,
                    youtubeVideo,
                    isMealDiet,
                }).unwrap();
                showSuccessToast('Exercise updated');
                refetch();
            }

            // Check if we should return to a collection edit page
            const returnToCollectionId = localStorage.getItem('returnToCollectionId');
            if (returnToCollectionId) {
                localStorage.removeItem('returnToCollectionId');
                navigate(`/admin/collection/${returnToCollectionId}/edit`);
            } else {
                navigate('/admin/exerciselist');
            }
        } catch (err) {
            showErrorToast(err?.data?.message || err.error);
        }
    };

    useEffect(() => {
        if (!isNewExercise && exercise) {
            setName(exercise.name);
            setImage(exercise.image);
            setCategory(exercise.category);
            setDescription(exercise.description);
            setYoutubeVideo(exercise.youtubeVideo || '');
            setIsMealDiet(exercise.isMealDiet || false);
        }
    }, [exercise, isNewExercise]);

    // Handle image upload from ProductImageUploader component
    const handleImageUploaded = (imageUrl) => {
        setImage(imageUrl);
    };

    // Determine if we're returning to a collection after edit
    const isReturningToCollection = localStorage.getItem('returnToCollectionId');

    return (
        <>
            <Link to={isReturningToCollection ? `/admin/collection/${isReturningToCollection}/edit` : '/admin/exerciselist'} className='btn btn-light my-3'>
                Go Back
            </Link>
            <FormContainer>
                <h1>{isNewExercise ? 'Create Exercise' : 'Edit Exercise'}</h1>
                {(loadingUpdate || loadingCreate) && <Loader />}
                {!isNewExercise && isLoading ? (
                    <Loader />
                ) : error ? (
                    <Message variant='danger'>{error.data.message}</Message>
                ) : (
                    <Form onSubmit={submitHandler}>
                        <Form.Group controlId='name'>
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type='name'
                                placeholder='Enter exercise name'
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
                                label='Is Meal/Diet Exercise'
                                checked={isMealDiet}
                                onChange={(e) => setIsMealDiet(e.target.checked)}
                            ></Form.Check>
                            <Form.Text className="text-muted">
                                Check this if the exercise is related to meal plans or diet programs
                            </Form.Text>
                        </Form.Group>

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

                        <Button type='submit' variant='primary' style={{ marginTop: '1rem' }}>
                            {isNewExercise ? 'Create' : 'Update'}
                        </Button>
                    </Form>
                )}
            </FormContainer>
        </>
    );
};

export default ExerciseEditScreen; 