import React, { useState, useEffect } from 'react';
import { Table, Button, Row, Col, Badge } from 'react-bootstrap';
import {
    FaEdit,
    FaPlus,
    FaTrash,
    FaBox,
    FaImage,
    FaSearch,
    FaSort,
} from 'react-icons/fa';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import Paginate from '../../components/Paginate';
import ContentLoader from '../../components/animations/ContentLoader';
import PageTransition from '../../components/animations/PageTransition';
import StaggeredList from '../../components/animations/StaggeredList';
import {
    useGetExercisesQuery,
    useDeleteExerciseMutation,
    useCreateExerciseMutation,
} from '../../slices/exercisesApiSlice';
import { showSuccessToast, showErrorToast } from '../../utils/toastConfig';
import '../../assets/styles/admin.css';

const ExerciseListScreen = () => {
    const navigate = useNavigate();
    const { pageNumber = 1 } = useParams();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );

    // Detect screen size
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

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset to first page when search term changes
    useEffect(() => {
        if (debouncedSearchTerm !== '') {
            navigate('/admin/exerciselist/1');
        }
    }, [debouncedSearchTerm, navigate]);

    const { data, isLoading, error, refetch } = useGetExercisesQuery({
        keyword: debouncedSearchTerm,
        pageNumber: Number(pageNumber),
    });

    const [deleteExercise, { isLoading: loadingDelete }] =
        useDeleteExerciseMutation();

    const [createExercise, { isLoading: loadingCreate }] =
        useCreateExerciseMutation();

    const deleteHandler = async (id, exerciseName) => {
        if (window.confirm(`Are you sure you want to delete "${exerciseName}"?`)) {
            try {
                await deleteExercise(id);
                refetch();
                showSuccessToast(`"${exerciseName}" deleted successfully`);
            } catch (err) {
                showErrorToast(err?.data?.message || err.error);
            }
        }
    };

    const createExerciseHandler = async () => {
        if (window.confirm('Are you sure you want to create a new exercise?')) {
            try {
                await createExercise();
                refetch();
                showSuccessToast('Exercise created successfully');
            } catch (err) {
                showErrorToast(err?.data?.message || err.error);
            }
        }
    };

    if (isLoading) return <ContentLoader />;
    if (error) return <Message variant='danger'>{error?.data?.message || error.error}</Message>;

    return (
        <PageTransition>
            <Row className='align-items-center'>
                <Col>
                    <h1>Exercises</h1>
                </Col>
                <Col className='text-end'>
                    <Button className='my-3' onClick={createExerciseHandler} disabled={loadingCreate}>
                        <FaPlus /> Create Exercise
                    </Button>
                </Col>
            </Row>

            {/* Search */}
            <Row className='mb-3'>
                <Col md={6}>
                    <div className='position-relative'>
                        <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                        <input
                            type='text'
                            placeholder='Search exercises...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '35px' }}
                            className='form-control'
                        />
                    </div>
                </Col>
            </Row>

            {!isMobile ? (
                <Table striped bordered hover responsive className='table-sm'>
                    <thead>
                        <tr>
                            <th>Exercise Name</th>
                            <th>Image</th>
                            <th>Category</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.exercises?.map((exercise) => (
                            <tr key={exercise._id}>
                                <td>
                                    <Link to={`/exercise/${exercise._id}`} style={{ fontWeight: '600' }}>
                                        {exercise.name}
                                    </Link>
                                </td>
                                <td>
                                    {exercise.image ? (
                                        <img
                                            src={exercise.image}
                                            alt={exercise.name}
                                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                        />
                                    ) : (
                                        <FaImage size={24} color='#6c757d' />
                                    )}
                                </td>
                                <td>
                                    {exercise.category && (
                                        <Badge bg='secondary'>{exercise.category}</Badge>
                                    )}
                                </td>
                                <td>{new Date(exercise.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <div className='d-flex gap-2'>
                                        <Link to={`/admin/exercise/${exercise._id}/edit`}>
                                            <Button variant='light' size='sm'>
                                                <FaEdit />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant='danger'
                                            size='sm'
                                            onClick={() => deleteHandler(exercise._id, exercise.name)}
                                            disabled={loadingDelete}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : (
                <StaggeredList>
                    {data?.exercises?.map((exercise, index) => (
                        <div key={exercise._id} className="card mb-3">
                            <div className="card-body">
                                <Row className='align-items-center'>
                                    <Col xs={3}>
                                        {exercise.image ? (
                                            <img
                                                src={exercise.image}
                                                alt={exercise.name}
                                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                                            />
                                        ) : (
                                            <FaImage size={30} color='#6c757d' />
                                        )}
                                    </Col>
                                    <Col xs={9}>
                                        <h6 className="mb-1">{exercise.name}</h6>
                                        {exercise.category && (
                                            <Badge bg='secondary' className="mb-2">{exercise.category}</Badge>
                                        )}
                                        <div className='d-flex gap-2'>
                                            <Link to={`/admin/exercise/${exercise._id}/edit`}>
                                                <Button variant='light' size='sm'>
                                                    <FaEdit />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant='danger'
                                                size='sm'
                                                onClick={() => deleteHandler(exercise._id, exercise.name)}
                                                disabled={loadingDelete}
                                            >
                                                <FaTrash />
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    ))}
                </StaggeredList>
            )}

            {/* Pagination */}
            {data?.pages > 1 && (
                <Paginate
                    pages={data.pages}
                    page={data.page}
                    isAdmin={true}
                    keyword={debouncedSearchTerm}
                    route='exerciselist'
                />
            )}
        </PageTransition>
    );
};

export default ExerciseListScreen; 