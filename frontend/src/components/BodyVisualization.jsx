import React from 'react';

const BodyVisualization = ({ 
  muscleGroups = [], 
  size = 'large', 
  showLabels = true, 
  title = 'Muscles Worked',
  isDarkMode = false 
}) => {
  console.log('🎯 BodyVisualization received muscle groups:', muscleGroups);
  
  // Container styling
  const containerStyle = {
    background: isDarkMode ? 
      'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' : 
      'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    borderRadius: '16px',
    padding: '1.5rem',
    border: isDarkMode ? 
      '1px solid rgba(255, 255, 255, 0.1)' : 
      '1px solid rgba(0, 0, 0, 0.05)',
    boxShadow: isDarkMode 
      ? '0 8px 32px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.05) inset' 
      : '0 8px 32px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.8) inset',
    minHeight: '140px',
    position: 'relative',
    overflow: 'hidden'
  };

  const titleStyle = {
    color: isDarkMode ? '#ffffff' : '#1f2937',
    fontSize: '1rem',
    fontWeight: '700',
    marginBottom: '1rem',
    textAlign: 'center',
    textShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.1)',
    letterSpacing: '0.025em'
  };

  // Muscle group icons
  const getMuscleIcon = (group) => {
    const icons = {
      'chest': '🫀',
      'back': '🦴', 
      'shoulders': '🤷',
      'arms': '💪',
      'biceps': '💪',
      'triceps': '🦾',
      'forearms': '✊',
      'core': '🔥',
      'abs': '⚡',
      'obliques': '🌀',
      'legs': '🦵',
      'quadriceps': '🦵',
      'hamstrings': '🦵',
      'glutes': '🍑',
      'calves': '🦶',
      'full body': '🏋️'
    };
    return icons[group?.toLowerCase()] || '💪';
  };

  return (
    <div style={containerStyle}>
      {showLabels && (
        <div style={titleStyle}>
          {title} {muscleGroups.length > 0 && `(${muscleGroups.length})`}
        </div>
      )}
      
      {muscleGroups.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80px',
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          fontSize: '0.9rem',
          textAlign: 'center',
          background: isDarkMode ? 
            'rgba(255, 255, 255, 0.02)' : 
            'rgba(0, 0, 0, 0.02)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: isDarkMode ? 
            '1px dashed rgba(255, 255, 255, 0.1)' : 
            '1px dashed rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '0.75rem',
            filter: 'grayscale(50%) opacity(0.7)'
          }}>💪</div>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            No muscle data available
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            opacity: 0.7,
            fontStyle: 'italic'
          }}>
            Muscle groups will appear here after workouts
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {/* Muscle groups list */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            justifyContent: 'center'
          }}>
            {muscleGroups.map((group, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  padding: '0.6rem 1rem',
                  borderRadius: '25px',
                  background: isDarkMode ? 
                    'linear-gradient(135deg, #374151 0%, #4b5563 100%)' : 
                    'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  color: isDarkMode ? '#ffffff' : '#1f2937',
                  border: isDarkMode ? 
                    '1px solid rgba(255, 255, 255, 0.1)' : 
                    '1px solid rgba(0, 0, 0, 0.1)',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  boxShadow: isDarkMode ?
                    '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' :
                    '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'default'
                }}
              >
                                 <span style={{ 
                   fontSize: '1.3rem',
                   filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                 }}>
                   {getMuscleIcon(group)}
                 </span>
                {group}
              </div>
            ))}
          </div>
          
          {/* Summary */}
          <div style={{
            textAlign: 'center',
            fontSize: '0.8rem',
            color: isDarkMode ? '#d1d5db' : '#4b5563',
            fontWeight: '600',
            marginTop: '1rem',
            padding: '0.75rem',
            background: isDarkMode ? 
              'rgba(255, 255, 255, 0.05)' : 
              'rgba(0, 0, 0, 0.03)',
            borderRadius: '12px',
            border: isDarkMode ? 
              '1px solid rgba(255, 255, 255, 0.05)' : 
              '1px solid rgba(0, 0, 0, 0.05)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {muscleGroups.length === 1 
              ? '🎯 Focused Workout' 
              : muscleGroups.length <= 3 
                ? '🔥 Targeted Training'
                : '💪 Full Body Workout'
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default BodyVisualization; 