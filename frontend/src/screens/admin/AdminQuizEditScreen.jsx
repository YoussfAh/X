import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Button,
  Form,
  Card,
  ListGroup,
  FormControl,
  Container,
  Row,
  Col,
  Tab,
  Nav,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import {
  useGetQuizByIdQuery,
  useUpdateQuizMutation,
} from '../../slices/quizApiSlice';
import { useGetAdminCollectionsQuery } from '../../slices/collectionsApiSlice';

const AdminQuizEditScreen = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();

  const {
    data: quizData,
    isLoading: isLoadingQuiz,
    error: quizError,
    refetch,
  } = useGetQuizByIdQuery(quizId);
  const { data: collectionsData, isLoading: isLoadingCollections } =
    useGetAdminCollectionsQuery({ skipPagination: true });
  const [updateQuiz, { isLoading: isUpdating }] = useUpdateQuizMutation();

  const collections = useMemo(
    () => collectionsData?.collections || [],
    [collectionsData]
  );

  const [name, setName] = useState('');
  const [questions, setQuestions] = useState([]);
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [assignmentRules, setAssignmentRules] = useState([]);
  const [assignmentDelaySeconds, setAssignmentDelaySeconds] = useState(0);
  const [triggerType, setTriggerType] = useState('TIME_INTERVAL');
  const [triggerDelayDays, setTriggerDelayDays] = useState(0);
  const [triggerDelayAmount, setTriggerDelayAmount] = useState(0);
  const [triggerDelayUnit, setTriggerDelayUnit] = useState('days');
  const [triggerStartFrom, setTriggerStartFrom] = useState('REGISTRATION');
  const [timeFrameHandling, setTimeFrameHandling] = useState('RESPECT_TIMEFRAME');
  const [respectUserTimeFrame, setRespectUserTimeFrame] = useState(true);
  const [homePageMessage, setHomePageMessage] = useState('');
  const [completionMessage, setCompletionMessage] = useState('');

  useEffect(() => {
    if (quizData) {
      setName(quizData.name || '');
      // Map backend fields to frontend state
      const mappedQuestions = (quizData.questions || []).map((q) => ({
        ...q,
        question: q.questionText || q.question || '', // Map 'questionText' to 'question'
        questionType: q.type || q.questionType || 'multiple-choice', // Map 'type' to 'questionType'
      }));
      setQuestions(mappedQuestions);
      setBackgroundUrl(quizData.backgroundUrl || '');
      setIsActive(quizData.isActive || false);
      setAssignmentRules(quizData.assignmentRules || []);
      setAssignmentDelaySeconds(quizData.assignmentDelaySeconds || 0);
      setTriggerType(quizData.triggerType || 'TIME_INTERVAL');
      setTriggerDelayDays(quizData.triggerDelayDays || 0);
      setTriggerDelayAmount(quizData.triggerDelayAmount || 0);
      setTriggerDelayUnit(quizData.triggerDelayUnit || 'days');
      setTriggerStartFrom(quizData.triggerStartFrom || 'REGISTRATION');
      setTimeFrameHandling(quizData.timeFrameHandling || 'RESPECT_TIMEFRAME');
      setRespectUserTimeFrame(quizData.respectUserTimeFrame !== false);
      setHomePageMessage(quizData.homePageMessage || '');
      setCompletionMessage(quizData.completionMessage || '');
    }
  }, [quizData]);

  const handleQuestionChange = (questionIndex, field, value) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question, qIndex) => {
        if (qIndex === questionIndex) {
          const newQuestion = { ...question, [field]: value };
          if (field === 'questionType') {
            if (value === 'text' || value === 'informational') {
              newQuestion.options = [];
            } else if (
              (value === 'multiple-choice' || value === 'true-false') &&
              (!newQuestion.options || newQuestion.options.length === 0)
            ) {
              newQuestion.options = [
                {
                  text: '',
                  assignCollection: null,
                  _id: `temp_opt_${Date.now()}`,
                },
              ];
            }
          }
          return newQuestion;
        }
        return question;
      })
    );
  };

  const addQuestionHandler = () => {
    setQuestions((prevQuestions) => [
      ...prevQuestions,
      {
        _id: `temp_${Date.now()}`,
        question: '', // Using 'question' for frontend state
        questionType: 'multiple-choice', // Using 'questionType' for frontend state
        options: [
          { text: '', assignCollection: null, _id: `temp_opt_${Date.now()}` },
        ],
      },
    ]);
  };

  const removeQuestionHandler = (questionIndex) => {
    setQuestions((prevQuestions) =>
      prevQuestions.filter((_, index) => index !== questionIndex)
    );
  };

  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question, qIndex) => {
        if (qIndex === questionIndex) {
          const newOptions = question.options.map((option, oIndex) => {
            if (oIndex === optionIndex) {
              return {
                ...option,
                [field]:
                  field === 'assignCollection' && value === '' ? null : value,
              };
            }
            return option;
          });
          return { ...question, options: newOptions };
        }
        return question;
      })
    );
  };

  const addOptionHandler = (questionIndex) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question, qIndex) => {
        if (qIndex === questionIndex) {
          const newOptions = [
            ...question.options,
            { text: '', assignCollection: null, _id: `temp_opt_${Date.now()}` },
          ];
          return { ...question, options: newOptions };
        }
        return question;
      })
    );
  };

  const removeOptionHandler = (questionIndex, optionIndex) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question, qIndex) => {
        if (qIndex === questionIndex) {
          const newOptions = question.options.filter(
            (_, oIndex) => oIndex !== optionIndex
          );
          return { ...question, options: newOptions };
        }
        return question;
      })
    );
  };

  const addRuleHandler = () => {
    setAssignmentRules((prevRules) => [
      ...prevRules,
      {
        conditions: [],
        assignCollection: null,
        _id: `temp_rule_${Date.now()}`,
      },
    ]);
  };

  const removeRuleHandler = (ruleIndex) => {
    setAssignmentRules((prevRules) =>
      prevRules.filter((_, index) => index !== ruleIndex)
    );
  };

  const handleRuleChange = (ruleIndex, field, value) => {
    setAssignmentRules((prevRules) =>
      prevRules.map((rule, rIndex) => {
        if (rIndex === ruleIndex) {
          return {
            ...rule,
            [field]:
              field === 'assignCollection' && value === '' ? null : value,
          };
        }
        return rule;
      })
    );
  };

  const addConditionHandler = (ruleIndex) => {
    setAssignmentRules((prevRules) =>
      prevRules.map((rule, rIndex) => {
        if (rIndex === ruleIndex) {
          const firstPageWithOptions = questions.find(
            (q) =>
              (q.questionType === 'multiple-choice' ||
                q.questionType === 'true-false') &&
              q.options &&
              q.options.length > 0
          );
          const newCondition = {
            questionId: firstPageWithOptions?._id || '',
            optionId:
              firstPageWithOptions && firstPageWithOptions.options.length > 0
                ? firstPageWithOptions.options[0]._id
                : '',
          };
          return { ...rule, conditions: [...rule.conditions, newCondition] };
        }
        return rule;
      })
    );
  };

  const removeConditionHandler = (ruleIndex, conditionIndex) => {
    setAssignmentRules((prevRules) =>
      prevRules.map((rule, rIndex) => {
        if (rIndex === ruleIndex) {
          const newConditions = rule.conditions.filter(
            (_, cIndex) => cIndex !== conditionIndex
          );
          return { ...rule, conditions: newConditions };
        }
        return rule;
      })
    );
  };

  const handleConditionChange = (ruleIndex, conditionIndex, field, value) => {
    setAssignmentRules((prevRules) =>
      prevRules.map((rule, rIndex) => {
        if (rIndex === ruleIndex) {
          const newConditions = rule.conditions.map((cond, cIndex) => {
            if (cIndex === conditionIndex) {
              const newCond = { ...cond, [field]: value };
              // When changing a question, reset the selected option
              if (field === 'questionId') {
                newCond.optionId = '';  // Reset to empty instead of auto-selecting first option
              }
              return newCond;
            }
            return cond;
          });
          return { ...rule, conditions: newConditions };
        }
        return rule;
      })
    );
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    // Validate that all questions have text
    const emptyQuestions = questions.filter(
      (q) => !q.question || q.question.trim() === ''
    );
    if (emptyQuestions.length > 0) {
      toast.error(
        'All questions must have text. Please fill in all question fields.'
      );
      return;
    }

    // Validate that all multiple-choice/true-false questions have at least one option with text
    const questionsWithOptions = questions.filter(
      (q) =>
        q.questionType === 'multiple-choice' || q.questionType === 'true-false'
    );
    for (let q of questionsWithOptions) {
      if (
        !q.options ||
        q.options.length === 0 ||
        !q.options.some((opt) => opt.text && opt.text.trim() !== '')
      ) {
        toast.error(
          `Question "${q.question}" must have at least one option with text.`
        );
        return;
      }
    }

    // Clean up assignment rules before submitting
    const cleanedRules = assignmentRules
      .map((rule) => {
        const cleanedRule = {
          conditions: rule.conditions.filter((c) => c.questionId && c.optionId),
          assignCollection: rule.assignCollection?._id || rule.assignCollection,
        };

        // Include _id only if it exists and is not a temporary ID
        if (rule._id && !rule._id.toString().startsWith('temp_')) {
          cleanedRule._id = rule._id;
        }

        return cleanedRule;
      })
      .filter((rule) => rule.assignCollection && rule.conditions.length > 0);

    // Clean up questions to match backend schema
    const cleanedQuestions = questions
      .map((question) => {
        const cleanedQuestion = {
          questionText: question.question?.trim() || '', // Map 'question' to 'questionText' and trim
          type: question.questionType || 'multiple-choice', // Map 'questionType' to 'type'
          options: (question.options || []).map((option) => {
            const cleanedOption = {
              text: option.text?.trim() || '',
              assignCollection:
                option.assignCollection?._id || option.assignCollection || null,
            };

            // Include _id only if it exists and is not a temporary ID
            if (option._id && !option._id.toString().startsWith('temp_')) {
              cleanedOption._id = option._id;
            }

            return cleanedOption;
          }),
        };

        // Include _id only if it exists and is not a temporary ID
        if (question._id && !question._id.toString().startsWith('temp_')) {
          cleanedQuestion._id = question._id;
        }

        return cleanedQuestion;
      })
      .filter((q) => q.questionText); // Remove questions without text

    const updatedQuiz = {
      _id: quizId,
      name,
      questions: cleanedQuestions,
      backgroundUrl,
      isActive,
      assignmentRules: cleanedRules,
      assignmentDelaySeconds,
      triggerType,
      triggerDelayDays,
      triggerDelayAmount,
      triggerDelayUnit,
      triggerStartFrom,
      timeFrameHandling,
      respectUserTimeFrame,
      homePageMessage,
      completionMessage,
    };

    console.log('--- Sending Quiz Update Payload ---');
    console.log(JSON.stringify(updatedQuiz, null, 2));

    try {
      await updateQuiz(updatedQuiz).unwrap();
      toast.success('Quiz updated successfully');
      refetch();
    } catch (err) {
      console.error('QUIZ UPDATE FAILED:', err);

      // Enhanced error handling
      let errorMessage = 'An unexpected error occurred';

      if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.data?.error) {
        errorMessage = err.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error) {
        errorMessage = err.error;
      }

      // If it's a validation error, provide more specific guidance
      if (
        errorMessage.includes('questionText') ||
        errorMessage.includes('required')
      ) {
        errorMessage =
          'Please ensure all questions have text and all required fields are filled.';
      }

      toast.error(errorMessage);
      console.error('Full error details:', err);
    }
  };

  return (
    <>
      <Link to='/admin/quizlist' className='btn btn-light my-3'>
        Go Back
      </Link>

      {isUpdating && <Loader />}
      {isLoadingQuiz || isLoadingCollections ? (
        <Loader />
      ) : quizError ? (
        <Message variant='danger'>
          {quizError.data?.message || quizError.error}
        </Message>
      ) : (
        <Container fluid>
          <Form onSubmit={submitHandler}>
            <Row className='align-items-center mb-3'>
              <Col>
                <h1>Edit Quiz</h1>
              </Col>
              <Col className='text-end'>
                <Button type='submit' variant='primary' disabled={isUpdating}>
                  Update Quiz
                </Button>
              </Col>
            </Row>

            <Row>
              <Col md={8}>
                <Tab.Container defaultActiveKey='questions'>
                  <Nav variant='tabs' className='mb-3'>
                    <Nav.Item>
                      <Nav.Link eventKey='questions'>Questions</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey='rules'>Assignment Rules</Nav.Link>
                    </Nav.Item>
                  </Nav>
                  <Tab.Content>
                    <Tab.Pane eventKey='questions'>
                      <div className='d-flex justify-content-between align-items-center mb-3'>
                        <h2>Questions</h2>
                        <Button onClick={addQuestionHandler} variant='primary'>
                          Add Question
                        </Button>
                      </div>
                      {questions.map((question, questionIndex) => (
                        <Card
                          key={question._id || `q-${questionIndex}`}
                          className='mb-3'
                        >
                          <Card.Header>
                            <Row className='align-items-center'>
                              <Col>
                                <strong>Question {questionIndex + 1}</strong>
                              </Col>
                              <Col className='text-end'>
                                <Button
                                  variant='danger'
                                  size='sm'
                                  onClick={() =>
                                    removeQuestionHandler(questionIndex)
                                  }
                                >
                                  Remove
                                </Button>
                              </Col>
                            </Row>
                          </Card.Header>
                          <Card.Body>
                            <Form.Group
                              controlId={`question-${questionIndex}`}
                              className='flex-grow-1'
                            >
                              <Form.Control
                                as='textarea'
                                rows={2}
                                placeholder='Enter question text'
                                value={question.question}
                                onChange={(e) =>
                                  handleQuestionChange(
                                    questionIndex,
                                    'question',
                                    e.target.value
                                  )
                                }
                              ></Form.Control>
                            </Form.Group>
                            <Form.Group
                              controlId={`questionType-${questionIndex}`}
                              className='mb-3'
                            >
                              <Form.Label>Question Type</Form.Label>
                              <Form.Control
                                as='select'
                                value={question.questionType}
                                onChange={(e) =>
                                  handleQuestionChange(
                                    questionIndex,
                                    'questionType',
                                    e.target.value
                                  )
                                }
                              >
                                <option value='multiple-choice'>
                                  Multiple Choice
                                </option>
                                <option value='true-false'>True/False</option>
                                <option value='text'>Text</option>
                                <option value='informational'>
                                  Informational
                                </option>
                              </Form.Control>
                            </Form.Group>
                            {(question.questionType === 'multiple-choice' ||
                              question.questionType === 'true-false') && (
                              <ListGroup variant='flush'>
                                <div className='d-flex justify-content-between align-items-center mt-3'>
                                  <h5>Options</h5>
                                  <Button
                                    variant='secondary'
                                    size='sm'
                                    onClick={() =>
                                      addOptionHandler(questionIndex)
                                    }
                                  >
                                    Add Option
                                  </Button>
                                </div>
                                {question.options.map((option, optionIndex) => (
                                  <ListGroup.Item
                                    key={option._id || `opt-${optionIndex}`}
                                    className='ps-0 border-0'
                                  >
                                    <Row className='align-items-end'>
                                      <Col md={5}>
                                        <Form.Group
                                          controlId={`option-${questionIndex}-${optionIndex}-text`}
                                          className='flex-grow-1'
                                        >
                                          <Form.Control
                                            type='text'
                                            placeholder={`Option ${
                                              optionIndex + 1
                                            }`}
                                            value={option.text}
                                            onChange={(e) =>
                                              handleOptionChange(
                                                questionIndex,
                                                optionIndex,
                                                'text',
                                                e.target.value
                                              )
                                            }
                                          ></Form.Control>
                                        </Form.Group>
                                      </Col>
                                      <Col md={5}>
                                        <Form.Group
                                          controlId={`assignCollection-${questionIndex}-${optionIndex}`}
                                          className='mb-0'
                                        >
                                          <Form.Label>
                                            Assign Collection
                                          </Form.Label>
                                          <Form.Control
                                            as='select'
                                            value={
                                              option.assignCollection?._id ||
                                              option.assignCollection ||
                                              ''
                                            }
                                            onChange={(e) =>
                                              handleOptionChange(
                                                questionIndex,
                                                optionIndex,
                                                'assignCollection',
                                                e.target.value
                                              )
                                            }
                                          >
                                            <option value=''>None</option>
                                            {collections.map((collection) => (
                                              <option
                                                key={collection._id}
                                                value={collection._id}
                                              >
                                                {collection.name}
                                              </option>
                                            ))}
                                          </Form.Control>
                                        </Form.Group>
                                      </Col>
                                      <Col md={2} className='text-end'>
                                        <Button
                                          variant='outline-danger'
                                          size='sm'
                                          onClick={() =>
                                            removeOptionHandler(
                                              questionIndex,
                                              optionIndex
                                            )
                                          }
                                        >
                                          Remove
                                        </Button>
                                      </Col>
                                    </Row>
                                  </ListGroup.Item>
                                ))}
                              </ListGroup>
                            )}
                          </Card.Body>
                        </Card>
                      ))}
                    </Tab.Pane>
                    <Tab.Pane eventKey='rules'>
                      <div className='d-flex justify-content-between align-items-center mb-3'>
                        <h2>Assignment Rules</h2>
                        <Button onClick={addRuleHandler} variant='primary'>
                          Add Rule
                        </Button>
                      </div>
                      {assignmentRules.map((rule, ruleIndex) => (
                        <Card
                          key={rule._id || `rule-${ruleIndex}`}
                          className='mb-3'
                        >
                          <Card.Header>
                            <Row className='align-items-center'>
                              <Col>
                                <strong>Rule {ruleIndex + 1}</strong>
                              </Col>
                              <Col className='text-end'>
                                <Button
                                  variant='danger'
                                  size='sm'
                                  onClick={() => removeRuleHandler(ruleIndex)}
                                >
                                  Remove Rule
                                </Button>
                              </Col>
                            </Row>
                          </Card.Header>
                          <Card.Body>
                            <h5>Conditions (ALL must be met)</h5>
                            {rule.conditions.map(
                              (condition, conditionIndex) => (
                                <Row
                                  key={`cond-${conditionIndex}`}
                                  className='mb-2 align-items-center'
                                >
                                  <Col md={5}>
                                    <Form.Group
                                      controlId={`rule-${ruleIndex}-cond-${conditionIndex}-question`}
                                    >
                                      <Form.Label>Question</Form.Label>
                                      <Form.Control
                                        as='select'
                                        value={condition.questionId}
                                        onChange={(e) =>
                                          handleConditionChange(
                                            ruleIndex,
                                            conditionIndex,
                                            'questionId',
                                            e.target.value
                                          )
                                        }
                                      >
                                        <option value=''>
                                          Select a question
                                        </option>
                                        {questions
                                          .filter(
                                            (q) =>
                                              q.questionType ===
                                                'multiple-choice' ||
                                              q.questionType === 'true-false'
                                          )
                                          .map((q) => (
                                            <option key={q._id} value={q._id}>
                                              {q.question}
                                            </option>
                                          ))}
                                      </Form.Control>
                                    </Form.Group>
                                  </Col>
                                  <Col md={5}>
                                    <Form.Group
                                      controlId={`rule-${ruleIndex}-cond-${conditionIndex}-option`}
                                    >
                                      <Form.Label>Option</Form.Label>
                                      <Form.Control
                                        as='select'
                                        value={condition.optionId}
                                        onChange={(e) =>
                                          handleConditionChange(
                                            ruleIndex,
                                            conditionIndex,
                                            'optionId',
                                            e.target.value
                                          )
                                        }
                                        disabled={!condition.questionId}
                                      >
                                        <option value=''>
                                          Select an option
                                        </option>
                                        {questions
                                          .find(
                                            (q) =>
                                              q._id === condition.questionId
                                          )
                                          ?.options.map((opt) => (
                                            <option
                                              key={opt._id}
                                              value={opt._id}
                                            >
                                              {opt.text}
                                            </option>
                                          ))}
                                      </Form.Control>
                                    </Form.Group>
                                  </Col>
                                  <Col md={2} className='text-end'>
                                    <Button
                                      variant='outline-danger'
                                      size='sm'
                                      onClick={() =>
                                        removeConditionHandler(
                                          ruleIndex,
                                          conditionIndex
                                        )
                                      }
                                    >
                                      Remove
                                    </Button>
                                  </Col>
                                </Row>
                              )
                            )}
                            <Button
                              variant='secondary'
                              size='sm'
                              onClick={() => addConditionHandler(ruleIndex)}
                              className='mt-2'
                            >
                              Add Condition
                            </Button>
                            <hr />
                            <h5>Action</h5>
                            <Form.Group
                              controlId={`rule-${ruleIndex}-collection`}
                            >
                              <Form.Label>Assign Collection</Form.Label>
                              <Form.Control
                                as='select'
                                value={
                                  rule.assignCollection?._id ||
                                  rule.assignCollection ||
                                  ''
                                }
                                onChange={(e) =>
                                  handleRuleChange(
                                    ruleIndex,
                                    'assignCollection',
                                    e.target.value
                                  )
                                }
                              >
                                <option value=''>Select a collection</option>
                                {collections.map((coll) => (
                                  <option key={coll._id} value={coll._id}>
                                    {coll.name}
                                  </option>
                                ))}
                              </Form.Control>
                            </Form.Group>
                          </Card.Body>
                        </Card>
                      ))}
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </Col>
              <Col md={4}>
                <Card>
                  <Card.Header as='h4'>Settings</Card.Header>
                  <Card.Body>
                    <Form.Group controlId='name' className='my-2'>
                      <Form.Label>Quiz Name</Form.Label>
                      <Form.Control
                        type='text'
                        placeholder='Enter quiz name'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      ></Form.Control>
                    </Form.Group>
                    <Form.Group controlId='backgroundUrl' className='my-2'>
                      <Form.Label>Background Image URL</Form.Label>
                      <Form.Control
                        type='text'
                        placeholder='http://...'
                        value={backgroundUrl}
                        onChange={(e) => setBackgroundUrl(e.target.value)}
                      ></Form.Control>
                    </Form.Group>
                    <Form.Group controlId='isActive' className='my-2'>
                      <Form.Check
                        type='switch'
                        label='Active (quiz is available)'
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      ></Form.Check>
                    </Form.Group>
                    <hr />
                    <h4>Scheduling</h4>
                    <Form.Group controlId='triggerType' className='mb-3'>
                      <Form.Label>Trigger Type</Form.Label>
                      <Form.Control
                        as='select'
                        value={triggerType}
                        onChange={(e) => setTriggerType(e.target.value)}
                      >
                        <option value='TIME_INTERVAL'>Time Interval</option>
                        <option value='ADMIN_ASSIGNMENT'>
                          Admin Assignment
                        </option>
                      </Form.Control>
                    </Form.Group>
                    
                    {triggerType === 'TIME_INTERVAL' && (
                      <>
                        <Row>
                          <Col md={6}>
                            <Form.Group controlId='triggerDelayAmount' className='mb-3'>
                              <Form.Label>Trigger Delay Amount</Form.Label>
                              <Form.Control
                                type='number'
                                min='0'
                                value={triggerDelayAmount}
                                onChange={(e) =>
                                  setTriggerDelayAmount(Number(e.target.value) || 0)
                                }
                                placeholder='Enter delay amount'
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group controlId='triggerDelayUnit' className='mb-3'>
                              <Form.Label>Time Unit</Form.Label>
                              <Form.Control
                                as='select'
                                value={triggerDelayUnit}
                                onChange={(e) => setTriggerDelayUnit(e.target.value)}
                              >
                                <option value='seconds'>Seconds</option>
                                <option value='minutes'>Minutes</option>
                                <option value='hours'>Hours</option>
                                <option value='days'>Days</option>
                                <option value='weeks'>Weeks</option>
                              </Form.Control>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Form.Group controlId='triggerStartFrom' className='mb-3'>
                          <Form.Label>Start Counting From</Form.Label>
                          <Form.Control
                            as='select'
                            value={triggerStartFrom}
                            onChange={(e) => setTriggerStartFrom(e.target.value)}
                          >
                            <option value='REGISTRATION'>User Registration</option>
                            <option value='FIRST_QUIZ'>First Quiz Taken</option>
                            <option value='LAST_QUIZ'>Last Quiz Taken</option>
                          </Form.Control>
                          <Form.Text className='text-muted'>
                            Choose the reference point for when the delay starts counting.
                          </Form.Text>
                        </Form.Group>

                        <Form.Group controlId='timeFrameHandling' className='mb-3'>
                          <Form.Label>Time Frame Handling</Form.Label>
                          <Form.Control
                            as='select'
                            value={timeFrameHandling}
                            onChange={(e) => setTimeFrameHandling(e.target.value)}
                          >
                            <option value='RESPECT_TIMEFRAME'>
                              Only users within their time frame
                            </option>
                            <option value='ALL_USERS'>
                              All users regardless of time frame
                            </option>
                            <option value='OUTSIDE_TIMEFRAME_ONLY'>
                              Only users outside/without time frame
                            </option>
                          </Form.Control>
                          <Form.Text className='text-muted'>
                            Control how user time frames affect quiz assignment.
                          </Form.Text>
                        </Form.Group>

                        {/* Legacy field for backward compatibility */}
                        <Form.Group controlId='triggerDelayDays' className='mb-3' style={{display: 'none'}}>
                          <Form.Control
                            type='number'
                            value={triggerDelayDays}
                            onChange={(e) =>
                              setTriggerDelayDays(Number(e.target.value) || 0)
                            }
                          />
                        </Form.Group>
                      </>
                    )}

                    {/* Only show legacy respectUserTimeFrame for ADMIN_ASSIGNMENT quizzes */}
                    {triggerType === 'ADMIN_ASSIGNMENT' && (
                      <Form.Group
                        controlId='respectUserTimeFrame'
                        className='mb-3'
                      >
                        <Form.Check
                          type='checkbox'
                          label='Respect User Time Frame'
                          checked={respectUserTimeFrame}
                          onChange={(e) =>
                            setRespectUserTimeFrame(e.target.checked)
                          }
                        />
                        <Form.Text className='text-muted'>
                          For Admin Assignment quizzes, control whether user time frames are respected.
                        </Form.Text>
                      </Form.Group>
                    )}
                    <hr />
                    <h4>Messaging</h4>
                    <Form.Group controlId='homePageMessage' className='my-2'>
                      <Form.Label>Home Page Message</Form.Label>
                      <Form.Control
                        as='textarea'
                        rows={3}
                        value={homePageMessage}
                        onChange={(e) => setHomePageMessage(e.target.value)}
                      ></Form.Control>
                      <Form.Text>
                        Message shown to user when quiz is pending.
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group controlId='completionMessage' className='my-2'>
                      <Form.Label>Quiz Completion Message</Form.Label>
                      <Form.Control
                        as='textarea'
                        rows={3}
                        placeholder='Thank you for completing the quiz! Your responses have been saved and your profile is being updated.'
                        value={completionMessage}
                        onChange={(e) => setCompletionMessage(e.target.value)}
                      ></Form.Control>
                      <Form.Text>
                        Message shown to user immediately after completing the quiz.
                      </Form.Text>
                    </Form.Group>
                    <hr />
                    <h4>Global Assignment Delay</h4>
                    <Form.Group controlId='assignmentDelaySeconds'>
                      <Form.Label>Delay (in seconds)</Form.Label>
                      <Form.Text className='d-block mb-2'>
                        This delay applies to ALL collections assigned by the
                        quiz (from options or rules). Set to 0 for immediate
                        assignment.
                      </Form.Text>
                      <Form.Control
                        type='number'
                        min='0'
                        value={assignmentDelaySeconds}
                        onChange={(e) =>
                          setAssignmentDelaySeconds(Number(e.target.value))
                        }
                      ></Form.Control>
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Form>
        </Container>
      )}
    </>
  );
};

export default AdminQuizEditScreen;
