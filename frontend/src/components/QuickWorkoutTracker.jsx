import React, { useState } from 'react';
import { FaDumbbell, FaHistory, FaPlus, FaArrowRight } from 'react-icons/fa';
import { Card, Button, Tabs, Tab, Badge, Collapse } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useGetWorkoutEntriesByProductQuery } from '../slices/workoutApiSlice';
import { format } from 'date-fns';
import WorkoutEntryForm from './WorkoutEntryForm';

const QuickExerciseTracker = ({ productId, collectionId, isDarkMode }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('history');
  const accentColor = '#6e44b2';

  const { data: exerciseEntries, isLoading } = useGetWorkoutEntriesByProductQuery(
    productId,
    { skip: !expanded || activeTab !== 'history' }
  );

  // Sort entries by date and take the most recent 3
  const recentEntries = exerciseEntries
    ? [...exerciseEntries]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3)
    : [];

  // Function to get feeling badge styling
  const getFeelingStyling = (feeling) => {
    switch (feeling) {
      case 'easy':
        return {
          bg: 'success',
          text: 'Easy'
        };
      case 'moderate':
        return {
          bg: 'primary',
          text: 'Moderate'
        };
      case 'hard':
        return {
          bg: 'warning',
          text: 'Hard'
        };
      case 'extreme':
        return {
          bg: 'danger',
          text: 'Extreme'
        };
      default:
        return {
          bg: 'secondary',
          text: 'Unknown'
        };
    }
  };

  // Allow rendering even if collectionId is missing, but log a warning
  if (!collectionId) {
    console.warn('Collection ID is missing. History will still be available but logging new exercises may be limited.');
  }

  // Ensure productId is available
  if (!productId) {
    return null;
  }

  return (
    <div className="quick-exercise-tracker mt-3">
      <Button
        className="w-100 d-flex align-items-center justify-content-between"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        style={{
          backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
          color: isDarkMode ? '#f8fafc' : '#334155',
          borderColor: isDarkMode ? '#475569' : '#cbd5e1',
          boxShadow: 'none'
        }}
      >
        <div className="d-flex align-items-center">
          <FaDumbbell style={{ color: accentColor, marginRight: '0.5rem' }} />
          <span>Exercise Tracking</span>
        </div>
        <Badge
          bg={isDarkMode ? 'dark' : 'light'}
          text={isDarkMode ? 'light' : 'dark'}
          style={{ backgroundColor: accentColor, color: 'white' }}
        >
          {expanded ? 'Hide' : 'Show'}
        </Badge>
      </Button>

      <Collapse in={expanded}>
        <Card
          className="mt-2"
          style={{
            backgroundColor: isDarkMode ? '#1e293b' : '#fff',
            borderColor: isDarkMode ? '#475569' : '#e2e8f0',
          }}
        >
          <Card.Body className="p-3">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-3 small"
              style={{
                borderBottom: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`
              }}
            >
              <Tab
                eventKey="history"
                title={
                  <span>
                    <FaHistory className="me-1" /> History
                  </span>
                }
              >
                {isLoading ? (
                  <p className="text-center my-2">Loading...</p>
                ) : recentEntries.length > 0 ? (
                  <>
                    {recentEntries.map((entry) => (
                      <div
                        key={entry._id}
                        className="exercise-entry-card mb-2 p-2"
                        style={{
                          backgroundColor: isDarkMode ? '#334155' : '#f8fafc',
                          borderRadius: '0.375rem'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small style={{ fontWeight: 600, color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                            {format(new Date(entry.date), 'MMM d, yyyy • h:mm a')}
                          </small>
                          <Badge
                            bg={getFeelingStyling(entry.feeling).bg}
                            size="sm"
                          >
                            {getFeelingStyling(entry.feeling).text}
                          </Badge>
                        </div>
                        <div className="d-flex flex-wrap">
                          {entry.sets.map((set, idx) => (
                            <div
                              key={idx}
                              className="me-2 mb-1 px-2 py-1"
                              style={{
                                backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                color: isDarkMode ? '#e2e8f0' : '#334155'
                              }}
                            >
                              {set.weight}kg × {set.reps}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {exerciseEntries && exerciseEntries.length > 3 && (
                      <div className="text-center mt-2">
                        <Link
                          to={`/product/${productId}`}
                          className="view-product-link"
                          style={{
                            color: accentColor,
                            textDecoration: 'none',
                            fontWeight: '500',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'color 0.2s ease'
                          }}
                        >
                          View Exercise <FaArrowRight size={12} />
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center my-2 text-muted" style={{ fontSize: '0.875rem' }}>
                    No exercise history found. Start tracking your progress!
                  </p>
                )}
              </Tab>

              <Tab
                eventKey="log"
                title={
                  <span>
                    <FaPlus className="me-1" /> Log Exercise
                  </span>
                }
              >
                <WorkoutEntryForm
                  productId={productId}
                  collectionId={collectionId}
                  compact={true}
                  onEntryAdded={() => setActiveTab('history')}
                />
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </Collapse>
    </div>
  );
};

export default QuickExerciseTracker;
