import React from 'react';
import { Button } from 'react-bootstrap';

const PromptPresets = ({ onSelectPrompt }) => {
  const promptPresets = [
    {
      title: "Comprehensive Health Assessment",
      prompt: "Analyze my overall fitness journey, including strengths, weaknesses, and specific recommendations for improvement. Look at patterns across all my tracked data and provide actionable insights."
    },
    {
      title: "Workout Optimization",
      prompt: "Review my workout data and suggest improvements to my training program. Identify potential plateaus, recommend exercise variations, and optimize my progression strategy."
    },
    {
      title: "Nutrition Analysis",
      prompt: "Analyze my eating patterns and nutritional intake. Provide recommendations for better macro balance, meal timing, and dietary improvements to support my fitness goals."
    },
    {
      title: "Recovery & Sleep Optimization", 
      prompt: "Examine my sleep patterns and recovery metrics. How does my sleep quality correlate with my workout performance and overall progress?"
    },
    {
      title: "Progress Plateau Analysis",
      prompt: "I feel like I've hit a plateau in my progress. Analyze my data to identify what might be holding me back and provide specific strategies to break through."
    },
    {
      title: "Weekly Progress Review",
      prompt: "Provide a comprehensive review of my progress over the past week. What went well, what needs improvement, and what should I focus on for the coming week?"
    },
    {
      title: "Goal Achievement Strategy",
      prompt: "Based on my current data and patterns, create a personalized strategy to help me achieve my fitness goals more effectively."
    },
    {
      title: "Habit Formation Analysis",
      prompt: "Analyze my consistency patterns across workouts, nutrition, and sleep. What habits am I building well and where do I need to improve my consistency?"
    }
  ];

  return (
    <>
      <style>{`
        .prompt-presets-container {
          margin-bottom: 1rem;
        }
        
        .prompt-presets-header {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
        }
        
        .prompt-presets-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .prompt-preset-btn {
          background: rgba(99, 102, 241, 0.1) !important;
          border: 1px solid rgba(99, 102, 241, 0.3) !important;
          color: #a5b4fc !important;
          font-size: 0.8rem !important;
          padding: 0.4rem 0.75rem !important;
          border-radius: 8px !important;
          transition: all 0.2s ease !important;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          max-width: 180px;
          font-weight: 500;
        }
        
        .prompt-preset-btn:hover {
          background: rgba(99, 102, 241, 0.2) !important;
          border-color: rgba(99, 102, 241, 0.5) !important;
          color: #ffffff !important;
          transform: translateY(-1px);
        }
        
        .prompt-preset-btn:active {
          transform: translateY(0);
        }
        
        /* Responsive Design for Mobile */
        @media (max-width: 768px) {
          .prompt-presets-header {
            font-size: 0.85rem;
            margin-bottom: 0.5rem;
          }
          
          .prompt-presets-grid {
            gap: 0.375rem;
          }
          
          .prompt-preset-btn {
            font-size: 0.75rem !important;
            padding: 0.35rem 0.6rem !important;
            max-width: 150px;
            border-radius: 6px !important;
          }
        }
        
        @media (max-width: 576px) {
          .prompt-presets-container {
            margin-bottom: 0.75rem;
          }
          
          .prompt-presets-header {
            font-size: 0.8rem;
            margin-bottom: 0.375rem;
          }
          
          .prompt-presets-grid {
            gap: 0.25rem;
          }
          
          .prompt-preset-btn {
            font-size: 0.7rem !important;
            padding: 0.3rem 0.5rem !important;
            max-width: 130px;
            border-radius: 5px !important;
          }
        }
        
        @media (max-width: 480px) {
          .prompt-presets-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.25rem;
          }
          
          .prompt-preset-btn {
            font-size: 0.65rem !important;
            padding: 0.25rem 0.4rem !important;
            max-width: none;
            width: 100%;
            justify-self: stretch;
          }
        }
        
        @media (max-width: 360px) {
          .prompt-presets-header {
            font-size: 0.75rem;
            margin-bottom: 0.25rem;
          }
          
          .prompt-preset-btn {
            font-size: 0.6rem !important;
            padding: 0.2rem 0.35rem !important;
          }
        }
      `}</style>
      
      <div className="prompt-presets-container">
        <div className="prompt-presets-header">
          Quick Start Prompts:
        </div>
        <div className="prompt-presets-grid">
          {promptPresets.map((preset, index) => (
            <Button
              key={index}
              variant="outline-primary"
              className="prompt-preset-btn"
              onClick={() => onSelectPrompt(preset.prompt)}
              title={preset.title} // Tooltip for truncated text
            >
              {preset.title}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

export default PromptPresets;
