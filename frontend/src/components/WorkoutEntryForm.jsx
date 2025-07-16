import { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Badge } from 'react-bootstrap';
import { FaPlus, FaTrash, FaDumbbell } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAddWorkoutEntryMutation, useUpdateWorkoutEntryMutation } from '../slices/workoutApiSlice';
import Loader from './Loader';
import Message from './Message';
import { showErrorToast } from '../utils/toastConfig';

const WorkoutEntryForm = ({ 
  productId, 
  collectionId, 
  entryToEdit, 
  onEntryAdded, 
  compact, 
  isDarkMode 
}) => {
  const [sets, setSets] = useState([{ weight: '', reps: '' }]);
  const [feeling, setFeeling] = useState('moderate');
  const [comments, setComments] = useState('');
  const [hoveredDelete, setHoveredDelete] = useState(null);

  const [addWorkoutEntry, { isLoading: isLoadingAdd }] = useAddWorkoutEntryMutation();
  const [updateWorkoutEntry, { isLoading: isLoadingUpdate }] = useUpdateWorkoutEntryMutation();
  
  // Theme colors to match DietEntryForm
  const themeColors = {
    accent: isDarkMode ? '#A855F7' : '#6E44B2',
    cardBg: isDarkMode ? '#0D0D0D' : '#ffffff',
    text: isDarkMode ? '#E2E8F0' : '#1A202C',
    textSecondary: isDarkMode ? '#94A3B8' : '#4A5568',
    border: isDarkMode ? '#2d3748' : '#e2e8f0',
    inputBg: isDarkMode ? '#121212' : '#F9FAFB',
  };

  const inputStyle = {
    backgroundColor: themeColors.inputBg,
    color: themeColors.text,
    border: `1px solid ${isDarkMode ? '#232323' : themeColors.border}`,
    borderRadius: '8px',
    padding: '0.6rem 0.75rem',
    fontSize: '0.9rem',
    width: '100%',
    transition: 'all 0.2s ease',
  };

  const compactInputStyle = {
    ...inputStyle,
    textAlign: 'center',
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
  
  useEffect(() => {
    if (entryToEdit) {
      setSets(entryToEdit.sets.map(set => ({
        weight: set.weight,
        reps: set.reps
      })));
      setFeeling(entryToEdit.feeling);
      setComments(entryToEdit.comments || '');
    } else {
      // Reset form when not editing
      setSets([{ weight: '', reps: '' }]);
      setFeeling('moderate');
      setComments('');
    }
  }, [entryToEdit]);

  const handleSetChange = (index, field, value) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const addSet = () => {
    setSets([...sets, { weight: '', reps: '' }]);
  };

  const removeSet = (index) => {
    if (sets.length > 1) {
      const newSets = sets.filter((_, i) => i !== index);
      setSets(newSets);
    }
  };

  const validateForm = () => {
    const invalidSet = sets.findIndex(set => !set.weight || !set.reps || isNaN(set.weight) || isNaN(set.reps) || set.weight <= 0 || set.reps <= 0);
    if (invalidSet >= 0) {
      showErrorToast(`Please enter a valid weight and reps for set #${invalidSet + 1}.`);
      return false;
    }
    return true;
  };

  const handleFocus = (e) => e.target.select();

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const workoutData = {
        productId,
        collectionId,
        sets: sets.map(set => ({
          weight: Number(set.weight),
          reps: Number(set.reps)
        })),
        feeling,
        comments
      };

      if (entryToEdit) {
        await updateWorkoutEntry({ id: entryToEdit._id, ...workoutData }).unwrap();
      } else {
        await addWorkoutEntry(workoutData).unwrap();
      }
      
      if (onEntryAdded) onEntryAdded();
    } catch (err) {
      showErrorToast(err?.data?.message || 'Could not save exercise.');
    }
  };

  if (!productId) return <Message variant='info'>Exercise not specified.</Message>;

  return (
    <div style={{ color: themeColors.text }}>
      <Form onSubmit={submitHandler}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 style={{ margin: 0, fontSize: '1.1rem' }}>
            {entryToEdit ? 'Edit Log' : 'Log Your Sets'}
          </h5>
          <Button
            size="sm"
            onClick={addSet}
            style={{
              background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.accent}cc)`,
              color: '#ffffff',
              border: 'none',
              borderRadius: '16px',
              padding: '6px 14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <FaPlus /> Add Set
          </Button>
        </div>

        {sets.map((set, index) => {
          const showDelete = sets.length > 1;
          return (
          <Row key={index} className="g-2 mb-2 align-items-center" style={{width:'100%'}}>
            <Col xs={1} className="text-center">
              <strong style={{ color: themeColors.textSecondary, fontSize: '0.8rem' }}>{index + 1}</strong>
            </Col>
            <Col xs={showDelete ? 4 : 5}>
              <Form.Control 
                type="number"
                placeholder="Weight"
                value={set.weight}
                onChange={e => handleSetChange(index, 'weight', e.target.value)}
                onFocus={handleFocus}
                style={compactInputStyle}
                size="sm"
              />
            </Col>
            <Col xs={showDelete ? 5 : 6}>
              <Form.Control
                type="number"
                placeholder="Reps"
                value={set.reps}
                onChange={e => handleSetChange(index, 'reps', e.target.value)}
                onFocus={handleFocus}
                style={compactInputStyle}
                size="sm"
              />
            </Col>
            {showDelete && (
              <Col xs={2} className="text-center">
                <Button
                  variant="link"
                  onClick={() => removeSet(index)}
                  style={{
                    ...deleteButtonStyle,
                    ...(hoveredDelete === index ? deleteButtonHoverStyle : {})
                  }}
                  onMouseEnter={() => setHoveredDelete(index)}
                  onMouseLeave={() => setHoveredDelete(null)}
                >
                  <FaTrash />
                </Button>
              </Col>
            )}
          </Row>
          );
        })}
        
        <Form.Group className="my-3">
          <Form.Label style={{ fontSize: '0.85rem', marginBottom: '0.3rem', color: themeColors.textSecondary }}>
            How did it feel?
          </Form.Label>
          <div className="d-flex flex-wrap gap-1 mt-1">
            {[
              { value: 'easy', label: 'Easy', bg: 'success' },
              { value: 'moderate', label: 'Moderate', bg: 'info' },
              { value: 'hard', label: 'Hard', bg: 'warning' },
              { value: 'extreme', label: 'Max Effort', bg: 'danger' },
            ].map((f) => (
              <Badge
                key={f.value}
                bg={feeling === f.value ? f.bg : 'outline-secondary'}
                className="p-2 cursor-pointer"
                style={{
                  cursor: 'pointer',
                  opacity: feeling === f.value ? 1 : 0.8,
                  fontSize: '0.75rem',
                  flexGrow: 1,
                  textAlign: 'center',
                }}
                onClick={() => setFeeling(f.value)}
              >
                {f.label}
              </Badge>
            ))}
          </div>
        </Form.Group>
        
        <Form.Group className="my-3">
          <Form.Control
            as="textarea"
            rows={1}
            placeholder="Comments (optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            style={{...inputStyle, minHeight: '45px', height: '45px', fontSize: '0.9rem'}}
          />
        </Form.Group>

        <div className="d-grid">
          <Button type="submit" disabled={isLoadingAdd || isLoadingUpdate} style={{
            background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.accent}dd)`,
            border: 'none',
            borderRadius: '8px',
            padding: '0.6rem',
          }}>
            {isLoadingAdd || isLoadingUpdate ? <Loader /> : (entryToEdit ? 'Update Entry' : 'Log Workout')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default WorkoutEntryForm;
