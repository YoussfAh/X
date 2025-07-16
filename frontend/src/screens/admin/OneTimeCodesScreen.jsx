import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Modal,
  InputGroup,
  Badge,
  Tab,
  Tabs,
  Alert,
  Nav,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';
import {
  FaPlus,
  FaTrash,
  FaCopy,
  FaDownload,
  FaKey,
  FaLock,
  FaUniversalAccess,
  FaStar,
  FaCalendarAlt,
  FaShieldAlt,
  FaLayerGroup,
  FaCheck,
  FaExclamationTriangle,
  FaFilter,
  FaHistory,
  FaInfoCircle,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Link, useParams } from 'react-router-dom';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { formatDistanceToNow } from 'date-fns';
import { CSVLink } from 'react-csv';
import {
  useGetOneTimeCodesByCollectionQuery,
  useGenerateOneTimeCodeMutation,
  useGenerateBatchCodesMutation,
  useDeleteOneTimeCodeMutation,
  useGenerateUniversalCodeMutation,
  useGenerateBatchUniversalCodesMutation,
  useGetUniversalCodesQuery,
} from '../../slices/oneTimeCodesApiSlice';
import { useGetAdminCollectionsQuery, useUpdateCollectionMutation } from '../../slices/collectionsApiSlice';
import '../../assets/styles/admin.css';
import { showSuccessToast, showErrorToast } from '../../utils/toastConfig';
// Import animation components
import AnimatedScreenWrapper from '../../components/animations/AnimatedScreenWrapper';
import FadeIn from '../../components/animations/FadeIn';
import StaggeredList from '../../components/animations/StaggeredList';

const OneTimeCodesScreen = () => {
  const { collectionId } = useParams();

  const [activeTab, setActiveTab] = useState('collection-codes');
  const [generateModal, setGenerateModal] = useState(false);
  const [universalModal, setUniversalModal] = useState(false);
  const [expiryDays, setExpiryDays] = useState(30);
  const [universalExpiryDays, setUniversalExpiryDays] = useState(90); // Default to longer expiry for universal codes
  const [universalQuantity, setUniversalQuantity] = useState(10); // New state for universal batch quantity
  const [quantity, setQuantity] = useState(10);
  // New state variables for max uses
  const [maxUses, setMaxUses] = useState(1); // Max uses for collection codes
  const [universalMaxUses, setUniversalMaxUses] = useState(1); // Max uses for universal codes
  const [selectedCollection, setSelectedCollection] = useState(
    collectionId || ''
  );
  const [filteredCollections, setFilteredCollections] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [collectionFilter, setCollectionFilter] = useState('');
  const [showProtectedOnly, setShowProtectedOnly] = useState(true);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get collections for the dropdown - updated to fetch all collections with skipPagination
  const {
    data: collections,
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useGetAdminCollectionsQuery({ skipPagination: true });

  // Add mutation to update collection
  const [updateCollection] = useUpdateCollectionMutation();

  useEffect(() => {
    if (collections) {
      // Extract collections from data structure properly
      const collectionData = collections?.collections || [];

      // Set filtered collections
      setFilteredCollections(collectionData);

      // If there's a collectionId from params and it's not in list, reset selection
      if (
        collectionId &&
        !collectionData.some((c) => c._id === collectionId)
      ) {
        setSelectedCollection('');
      }
    }
  }, [collections, collectionId]);

  // Get codes for the selected collection
  const {
    data: codes,
    isLoading: codesLoading,
    error: codesError,
    refetch,
  } = useGetOneTimeCodesByCollectionQuery(selectedCollection, {
    skip: !selectedCollection,
  });

  // Get universal codes
  const {
    data: universalCodes,
    isLoading: universalCodesLoading,
    error: universalCodesError,
    refetch: refetchUniversalCodes,
  } = useGetUniversalCodesQuery();

  // Filter out used universal codes to match behavior of regular codes
  const activeUniversalCodes =
    universalCodes?.filter((code) => !code.isUsed) || [];

  // Mutations
  const [generateCode, { isLoading: isGenerating }] =
    useGenerateOneTimeCodeMutation();
  const [generateBatchCodes, { isLoading: isGeneratingBatch }] =
    useGenerateBatchCodesMutation();
  const [generateUniversalCode, { isLoading: isGeneratingUniversal }] =
    useGenerateUniversalCodeMutation();
  const [generateBatchUniversalCodes, { isLoading: isGeneratingBatchUniversal }] =
    useGenerateBatchUniversalCodesMutation();
  const [deleteCode, { isLoading: isDeleting }] =
    useDeleteOneTimeCodeMutation();

  // CSV Export Data
  const [csvData, setCsvData] = useState([]);
  const [universalCsvData, setUniversalCsvData] = useState([]);

  useEffect(() => {
    if (codes && codes.length > 0) {
      // Prepare data for CSV export
      const data = [
        ['Code', 'Collection', 'Max Uses', 'Current Uses', 'Remaining Uses', 'Expires At'],
        ...codes.map((code) => [
          code.code,
          code.collectionName,
          code.maxUses || 1,
          code.currentUses || 0,
          (code.maxUses || 1) - (code.currentUses || 0),
          new Date(code.expiresAt).toLocaleDateString(),
        ]),
      ];
      setCsvData(data);
    }
  }, [codes]);

  useEffect(() => {
    if (universalCodes && universalCodes.length > 0) {
      // Prepare data for universal codes CSV export
      const data = [
        ['Code', 'Type', 'Max Uses', 'Current Uses', 'Remaining Uses', 'Expires At', 'Status'],
        ...universalCodes.map((code) => [
          code.code,
          'Universal Access',
          code.maxUses || 1,
          code.currentUses || 0,
          (code.maxUses || 1) - (code.currentUses || 0),
          new Date(code.expiresAt).toLocaleDateString(),
          (code.currentUses >= code.maxUses) ? 'Exhausted' : 'Available',
        ]),
      ];
      setUniversalCsvData(data);
    }
  }, [universalCodes]);

  // Enable requiresCode for a collection if needed and generate code
  const enableCollectionProtection = async () => {
    if (!selectedCollection) return;

    // Use the filteredCollections directly to access the collection data
    const selectedCollectionData = filteredCollections?.find(c => c._id === selectedCollection);

    if (selectedCollectionData && !selectedCollectionData.requiresCode) {
      try {
        await updateCollection({
          collectionId: selectedCollection,
          requiresCode: true,
          name: selectedCollectionData.name,
          description: selectedCollectionData.description,
          image: selectedCollectionData.image,
        }).unwrap();
        showSuccessToast('Collection protection enabled');
      } catch (err) {
        showErrorToast('Failed to enable protection: ' + (err?.data?.message || err.message));
        return false;
      }
    }
    return true;
  };

  const handleGenerateSingle = async () => {
    if (!selectedCollection) {
      showErrorToast('Please select a collection');
      return;
    }

    // Enable protection if not already enabled
    const protectionEnabled = await enableCollectionProtection();
    if (!protectionEnabled) return;

    try {
      const result = await generateCode({
        collectionId: selectedCollection,
        expiryDays,
        maxUses,
      }).unwrap();

      showSuccessToast('Access code generated successfully');
      setGenerateModal(false);
      refetch();
    } catch (err) {
      showErrorToast(err?.data?.message || err.message);
    }
  };

  const handleGenerateBatch = async () => {
    if (!selectedCollection) {
      showErrorToast('Please select a collection');
      return;
    }

    if (quantity < 1 || quantity > 100) {
      showErrorToast('Quantity must be between 1 and 100');
      return;
    }

    // Enable protection if not already enabled
    const protectionEnabled = await enableCollectionProtection();
    if (!protectionEnabled) return;

    try {
      const result = await generateBatchCodes({
        collectionId: selectedCollection,
        quantity,
        expiryDays,
        maxUses,
      }).unwrap();

      showSuccessToast(`Generated ${result.count} access codes`);
      setGenerateModal(false);
      refetch();
    } catch (err) {
      showErrorToast(err?.data?.message || err.message);
    }
  };

  const handleGenerateUniversalCode = async () => {
    try {
      const result = await generateUniversalCode({
        expiryDays: universalExpiryDays,
        maxUses: universalMaxUses,
      }).unwrap();

      showSuccessToast('Universal access code generated successfully');
      setUniversalModal(false);
      refetchUniversalCodes();
    } catch (err) {
      showErrorToast(err?.data?.message || err.message);
    }
  };

  // New function to handle batch generation of universal codes
  const handleGenerateBatchUniversalCodes = async () => {
    if (universalQuantity < 1 || universalQuantity > 100) {
      showErrorToast('Quantity must be between 1 and 100');
      return;
    }

    try {
      const result = await generateBatchUniversalCodes({
        quantity: universalQuantity,
        expiryDays: universalExpiryDays,
        maxUses: universalMaxUses,
      }).unwrap();

      showSuccessToast(`Generated ${result.count} universal access codes`);
      setUniversalModal(false);
      refetchUniversalCodes();
    } catch (err) {
      showErrorToast(err?.data?.message || err.message);
    }
  };

  const handleDeleteCode = async (codeId) => {
    if (window.confirm('Are you sure you want to delete this code?')) {
      try {
        await deleteCode(codeId).unwrap();
        showSuccessToast('Code deleted successfully');
        refetch();
        refetchUniversalCodes();
      } catch (err) {
        showErrorToast(err?.data?.message || err.message);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSuccessToast('Code copied to clipboard');
  };

  // Render code card for mobile view
  const renderCodeCard = (code, isUniversal = false) => (
    <div className='admin-mobile-card' key={code._id}>
      <div className='card-title'>
        {isUniversal ? (
          <div className='d-flex align-items-center'>
            <FaStar className='me-2 text-warning' /> Universal Access Code
          </div>
        ) : (
          <div className='d-flex align-items-center'>
            <FaKey className='me-2' /> Access Code
          </div>
        )}
      </div>

      <div className='card-row'>
        <div className='card-label'>CODE</div>
        <div className='card-value'>
          <Badge
            bg={isUniversal ? 'warning' : 'dark'}
            className='code-badge'
            text={isUniversal ? 'dark' : 'light'}
          >
            {isUniversal && <FaStar className='me-1' />}
            {code.code}
          </Badge>
        </div>
      </div>

      {!isUniversal && (
        <div className='card-row'>
          <div className='card-label'>COLLECTION</div>
          <div className='card-value'>{code.collectionName}</div>
        </div>
      )}

      <div className='card-row'>
        <div className='card-label'>
          <FaHistory className='me-2' /> USAGE
        </div>
        <div className='card-value'>
          <Badge
            bg={(code.currentUses || 0) >= (code.maxUses || 1) ? 'danger' : 'success'}
            pill
            className='mb-1'
          >
            {code.currentUses || 0} / {code.maxUses || 1} uses
          </Badge>
          <br />
          <small className='text-muted'>
            {((code.maxUses || 1) - (code.currentUses || 0))} remaining
          </small>
        </div>
      </div>

      <div className='card-row'>
        <div className='card-label'>
          <FaCalendarAlt className='me-2' /> EXPIRES
        </div>
        <div className='card-value'>
          {new Date(code.expiresAt).toLocaleDateString()}
          <br />
          <small className='text-muted'>
            {formatDistanceToNow(new Date(code.expiresAt), {
              addSuffix: true,
            })}
          </small>
        </div>
      </div>

      <div className='card-row'>
        <div className='card-label'>
          <FaHistory className='me-2' /> CREATED
        </div>
        <div className='card-value'>
          {new Date(code.createdAt).toLocaleDateString()}
        </div>
      </div>

      {isUniversal && (
        <div className='card-row'>
          <div className='card-label'>STATUS</div>
          <div className='card-value'>
            {(code.currentUses || 0) >= (code.maxUses || 1) ? (
              <Badge bg='secondary' pill className='admin-badge'>
                <FaCheck className='me-1' /> Exhausted
              </Badge>
            ) : (
              <Badge bg='success' pill className='admin-badge'>
                Available
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className='card-actions'>
        <Button
          className='admin-btn admin-btn-sm'
          variant='outline-secondary'
          onClick={() => copyToClipboard(code.code)}
        >
          <FaCopy className='me-1' /> Copy Code
        </Button>

        {((code.currentUses || 0) < (code.maxUses || 1)) && (
          <Button
            className='admin-btn admin-btn-sm'
            variant='danger'
            onClick={() => handleDeleteCode(code._id)}
          >
            <FaTrash className='me-1' /> Delete
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <AnimatedScreenWrapper isLoading={collectionsLoading || codesLoading || universalCodesLoading}
      error={collectionsError?.data?.message || codesError?.data?.message || universalCodesError?.data?.message}>
      <div className='admin-container'>
        <FadeIn>
          <div className='admin-header'>
            <h1>
              <FaKey className='me-2' />
              Access Code Management
            </h1>
            <div>
              {activeTab === 'collection-codes' ? (
                <Button
                  variant='success'
                  className='admin-btn admin-btn-primary'
                  onClick={() => setGenerateModal(true)}
                  disabled={!selectedCollection}
                >
                  <FaPlus className='me-1' /> Generate Codes
                </Button>
              ) : (
                <Button
                  variant='warning'
                  className='admin-btn admin-btn-primary'
                  onClick={() => setUniversalModal(true)}
                >
                  <FaPlus className='me-1' /> Generate Universal Code
                </Button>
              )}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <Nav
            variant='tabs'
            className='mb-4 admin-tabs'
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
          >
            <Nav.Item>
              <Nav.Link
                eventKey='collection-codes'
                className='d-flex align-items-center'
              >
                <FaShieldAlt className='me-2' /> Collection-Specific Codes
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey='universal-codes'
                className='d-flex align-items-center'
              >
                <FaUniversalAccess className='me-2' /> Universal Codes
                <FaStar className='ms-1 text-warning' />
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </FadeIn>

        {activeTab === 'collection-codes' && (
          <FadeIn direction="up" delay={150}>
            <Card className='admin-card mb-4'>
              <Card.Header>
                <div className='d-flex flex-wrap align-items-center justify-content-between'>
                  <h5 className='mb-0'>
                    <FaLayerGroup className='me-2 text-primary' /> Select
                    Collection to Manage Access Codes
                  </h5>
                  {codes && codes.length > 0 && (
                    <CSVLink
                      data={csvData}
                      filename={`access-codes-${new Date().toLocaleDateString()}.csv`}
                      className='btn btn-primary admin-btn admin-btn-sm mt-2 mt-sm-0'
                    >
                      <FaDownload className='me-1' /> Export Codes
                    </CSVLink>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col lg={8}>
                    <Form.Group className='admin-form-group'>
                      <Form.Label>Select Collection</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <FaLock />
                        </InputGroup.Text>
                        <Form.Control
                          type='text'
                          placeholder='Search collections...'
                          value={collectionFilter}
                          onChange={(e) => setCollectionFilter(e.target.value)}
                          className='admin-form-control'
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col lg={4}>
                    <Form.Group className='admin-form-group'>
                      <Form.Label>&nbsp;</Form.Label>
                      <Form.Check
                        type='checkbox'
                        id='showProtectedOnly'
                        label='Show protected collections only'
                        checked={showProtectedOnly}
                        onChange={(e) => setShowProtectedOnly(e.target.checked)}
                        className='mt-2'
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mt-3">
                  <Col>
                    <Form.Group className='admin-form-group'>
                      <Form.Label>Collections</Form.Label>
                      <Form.Control
                        as='select'
                        size="lg"
                        value={selectedCollection}
                        onChange={(e) => setSelectedCollection(e.target.value)}
                        className='admin-form-control admin-select'
                        style={{ maxHeight: '200px' }}
                      >
                        <option value=''>
                          -- Select a collection --
                        </option>
                        {collections?.collections?.filter(collection => {
                          // Apply name filter
                          const nameMatches = !collectionFilter ||
                            collection.name.toLowerCase().includes(collectionFilter.toLowerCase());

                          // Apply protected filter
                          const protectionMatches = !showProtectedOnly || collection.requiresCode;

                          return nameMatches && protectionMatches;
                        }).map((collection) => (
                          <option key={collection._id} value={collection._id}>
                            {collection.name}
                            {collection.requiresCode ? ' 🔒 (Protected)' : ''}
                          </option>
                        ))}
                      </Form.Control>
                      <Form.Text className="text-muted">
                        {collectionFilter && collections?.collections && (
                          <>Showing {collections.collections.filter(c =>
                            c.name.toLowerCase().includes(collectionFilter.toLowerCase()) &&
                            (!showProtectedOnly || c.requiresCode)
                          ).length} of {collections.collections.length} collections</>
                        )}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {selectedCollection && filteredCollections?.find(c => c._id === selectedCollection && !c.requiresCode) && (
                  <Alert variant='info' className='d-flex align-items-center mt-3'>
                    <FaInfoCircle className='me-2' size='1.2em' />
                    <div>
                      <strong>This collection is not currently protected.</strong> When you generate an access code,
                      protection will be automatically enabled for this collection.
                    </div>
                  </Alert>
                )}

                {filteredCollections?.length === 0 && !collectionsLoading && (
                  <Alert variant='info' className='d-flex align-items-center'>
                    <FaInfoCircle className='me-2' size='1.2em' />
                    <div>
                      <strong>No collections found.</strong> You need to create collections first.
                      <div className='mt-2'>
                        <Link
                          to='/admin/collections'
                          className='btn btn-primary admin-btn admin-btn-sm'
                        >
                          <FaLayerGroup className='me-1' /> Manage Collections
                        </Link>
                      </div>
                    </div>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </FadeIn>
        )}

        {selectedCollection && !codesLoading && !codesError && activeTab === 'collection-codes' && (
          <FadeIn direction="up" delay={200}>
            <Card className='admin-card'>
              <Card.Header>
                <h5 className='mb-0 d-flex align-items-center'>
                  <FaKey className='me-2 text-primary' />
                  Active One-Time Codes
                  {codes && (
                    <Badge bg='primary' className='ms-2 admin-badge'>
                      {codes.length}
                    </Badge>
                  )}
                </h5>
              </Card.Header>

              <Card.Body>
                {codes?.length === 0 ? (
                  <Alert variant='info'>
                    <FaInfoCircle className='me-2' /> No active one-time codes
                    found for this collection. Generate some codes using the
                    button above.
                  </Alert>
                ) : !isMobile ? (
                  // Desktop view
                  <StaggeredList baseDelay={50} staggerDelay={30}>
                    <Table hover responsive className='admin-table'>
                      <thead>
                        <tr>
                          <th>CODE</th>
                          <th>COLLECTION</th>
                          <th>USAGE</th>
                          <th>EXPIRES</th>
                          <th>CREATED</th>
                          <th>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {codes?.map((code) => (
                          <tr key={code._id}>
                            <td>
                              <Badge bg='dark' className='code-badge'>
                                {code.code}
                              </Badge>
                            </td>
                            <td>{code.collectionName}</td>
                            <td>
                              <div className='d-flex flex-column'>
                                <Badge
                                  bg={(code.currentUses || 0) >= (code.maxUses || 1) ? 'danger' : 'success'}
                                  pill
                                  className='mb-1'
                                >
                                  {code.currentUses || 0} / {code.maxUses || 1} uses
                                </Badge>
                                <small className='text-muted'>
                                  {((code.maxUses || 1) - (code.currentUses || 0))} remaining
                                </small>
                              </div>
                            </td>
                            <td>
                              {new Date(code.expiresAt).toLocaleDateString()}
                              <span className='d-block text-muted small'>
                                {formatDistanceToNow(new Date(code.expiresAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </td>
                            <td>
                              {new Date(code.createdAt).toLocaleDateString()}
                            </td>
                            <td className='admin-actions'>
                              <OverlayTrigger
                                placement='top'
                                overlay={<Tooltip>Copy to clipboard</Tooltip>}
                              >
                                <Button
                                  className='admin-btn admin-btn-sm'
                                  variant='outline-secondary'
                                  onClick={() => copyToClipboard(code.code)}
                                >
                                  <FaCopy />
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger
                                placement='top'
                                overlay={<Tooltip>Delete code</Tooltip>}
                              >
                                <Button
                                  className='admin-btn admin-btn-sm'
                                  variant='danger'
                                  onClick={() => handleDeleteCode(code._id)}
                                >
                                  <FaTrash />
                                </Button>
                              </OverlayTrigger>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </StaggeredList>
                ) : (
                  // Mobile view
                  <StaggeredList baseDelay={50} staggerDelay={50}>
                    <div className='admin-table-mobile'>
                      {codes?.map((code) => renderCodeCard(code))}
                    </div>
                  </StaggeredList>
                )}
              </Card.Body>
            </Card>
          </FadeIn>
        )}

        {activeTab === 'universal-codes' && (
          <>
            <FadeIn direction="up" delay={150}>
              <Card className='admin-card mb-4'>
                <Card.Header className='bg-warning bg-opacity-10'>
                  <h5 className='mb-0'>
                    <FaExclamationTriangle className='me-2 text-warning' />{' '}
                    Universal Access Codes Information
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Alert variant='info' className='mb-0'>
                    <div className='d-flex'>
                      <div className='me-3'>
                        <FaUniversalAccess size='2em' className='text-warning' />
                      </div>
                      <div>
                        <strong>Universal Access Codes</strong> can unlock{' '}
                        <em>any</em> protected collection in the system. Use these
                        with caution, as they provide access regardless of which
                        collection is being accessed. Universal codes are prefixed
                        with "U-" to distinguish them from regular collection codes.
                      </div>
                    </div>
                  </Alert>
                </Card.Body>
              </Card>
            </FadeIn>

            <FadeIn direction="left" delay={200}>
              <div className='d-flex align-items-center justify-content-between mb-4'>
                <h3 className='admin-section-title mb-0'>
                  <FaUniversalAccess className='me-2 text-warning' /> Universal
                  Access Codes
                </h3>

                <div>
                  {universalCodes && universalCodes.length > 0 && (
                    <CSVLink
                      data={universalCsvData}
                      filename={`universal-codes-${new Date().toLocaleDateString()}.csv`}
                      className='btn btn-primary admin-btn'
                    >
                      <FaDownload className='me-1' /> Export Codes
                    </CSVLink>
                  )}
                </div>
              </div>
            </FadeIn>

            {!universalCodesLoading && !universalCodesError && (
              <FadeIn direction="up" delay={250}>
                <Card className='admin-card'>
                  <Card.Header className='bg-warning bg-opacity-10'>
                    <h5 className='mb-0 d-flex align-items-center'>
                      <FaStar className='me-2 text-warning' />
                      Active Universal Access Codes
                      {activeUniversalCodes && activeUniversalCodes.length > 0 && (
                        <Badge
                          bg='warning'
                          text='dark'
                          className='ms-2 admin-badge'
                        >
                          {activeUniversalCodes.length}
                        </Badge>
                      )}
                    </h5>
                  </Card.Header>

                  <Card.Body>
                    {!activeUniversalCodes || activeUniversalCodes.length === 0 ? (
                      <Alert variant='info'>
                        <FaInfoCircle className='me-2' /> No active universal codes
                        found. Generate a universal code using the button at the top
                        of the page.
                      </Alert>
                    ) : !isMobile ? (
                      // Desktop view
                      <StaggeredList baseDelay={50} staggerDelay={30}>
                        <Table hover responsive className='admin-table'>
                          <thead>
                            <tr>
                              <th>UNIVERSAL CODE</th>
                              <th>USAGE</th>
                              <th>STATUS</th>
                              <th>EXPIRES</th>
                              <th>CREATED</th>
                              <th>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeUniversalCodes?.map((code) => (
                              <tr key={code._id}>
                                <td>
                                  <Badge
                                    bg='warning'
                                    className='code-badge'
                                    text='dark'
                                  >
                                    <FaStar className='me-1' />
                                    {code.code}
                                  </Badge>
                                </td>
                                <td>
                                  <div className='d-flex flex-column'>
                                    <Badge
                                      bg={(code.currentUses || 0) >= (code.maxUses || 1) ? 'danger' : 'success'}
                                      pill
                                      className='mb-1'
                                    >
                                      {code.currentUses || 0} / {code.maxUses || 1} uses
                                    </Badge>
                                    <small className='text-muted'>
                                      {((code.maxUses || 1) - (code.currentUses || 0))} remaining
                                    </small>
                                  </div>
                                </td>
                                <td>
                                  {(code.currentUses || 0) >= (code.maxUses || 1) ? (
                                    <Badge
                                      bg='secondary'
                                      pill
                                      className='admin-badge'
                                    >
                                      <FaCheck className='me-1' /> Exhausted
                                    </Badge>
                                  ) : (
                                    <Badge bg='success' pill className='admin-badge'>
                                      Available
                                    </Badge>
                                  )}
                                </td>
                                <td>
                                  {new Date(code.expiresAt).toLocaleDateString()}
                                  <span className='d-block text-muted small'>
                                    {formatDistanceToNow(new Date(code.expiresAt), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                </td>
                                <td>
                                  {new Date(code.createdAt).toLocaleDateString()}
                                </td>
                                <td className='admin-actions'>
                                  <OverlayTrigger
                                    placement='top'
                                    overlay={<Tooltip>Copy to clipboard</Tooltip>}
                                  >
                                    <Button
                                      className='admin-btn admin-btn-sm'
                                      variant='outline-secondary'
                                      onClick={() => copyToClipboard(code.code)}
                                    >
                                      <FaCopy />
                                    </Button>
                                  </OverlayTrigger>
                                  {!code.isUsed && (
                                    <OverlayTrigger
                                      placement='top'
                                      overlay={<Tooltip>Delete code</Tooltip>}
                                    >
                                      <Button
                                        className='admin-btn admin-btn-sm'
                                        variant='danger'
                                        onClick={() => handleDeleteCode(code._id)}
                                      >
                                        <FaTrash />
                                      </Button>
                                    </OverlayTrigger>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </StaggeredList>
                    ) : (
                      // Mobile view
                      <StaggeredList baseDelay={50} staggerDelay={50}>
                        <div className='admin-table-mobile'>
                          {activeUniversalCodes?.map((code) =>
                            renderCodeCard(code, true)
                          )}
                        </div>
                      </StaggeredList>
                    )}
                  </Card.Body>
                </Card>
              </FadeIn>
            )}
          </>
        )}

        {/* Generate Codes Modal - Collection Codes */}
        <Modal
          show={generateModal}
          onHide={() => setGenerateModal(false)}
          className='admin-modal'
          size='lg'
        >
          <Modal.Header closeButton>
            <Modal.Title className='d-flex align-items-center'>
              <FaKey className='me-2' />
              Generate One-Time Access Codes
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Tabs defaultActiveKey='single' className='mb-4 admin-tabs'>
              <Tab
                eventKey='single'
                title={
                  <>
                    <FaKey className='me-2' />
                    Single Code
                  </>
                }
              >
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className='admin-form-group'>
                        <Form.Label>Collection</Form.Label>
                        <Form.Control
                          readOnly
                          value={
                            filteredCollections?.find(
                              (c) => c._id === selectedCollection
                            )?.name || ''
                          }
                          className='admin-form-control'
                        />
                      </Form.Group>

                      {filteredCollections?.find(c => c._id === selectedCollection && !c.requiresCode) && (
                        <Alert variant='info' className='mt-2 mb-0'>
                          <FaInfoCircle className='me-2' />
                          Protection will be automatically enabled for this collection when you generate a code.
                        </Alert>
                      )}
                    </Col>
                    <Col md={3}>
                      <Form.Group className='admin-form-group'>
                        <Form.Label>Max Uses</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaHistory />
                          </InputGroup.Text>
                          <Form.Control
                            type='number'
                            min='1'
                            max='1000'
                            value={maxUses}
                            onChange={(e) =>
                              setMaxUses(parseInt(e.target.value))
                            }
                            className='admin-form-control'
                          />
                        </InputGroup>
                        <Form.Text className='text-muted'>
                          How many times this code can be used
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className='admin-form-group'>
                        <Form.Label>Expiry (Days)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaCalendarAlt />
                          </InputGroup.Text>
                          <Form.Control
                            type='number'
                            min='1'
                            value={expiryDays}
                            onChange={(e) =>
                              setExpiryDays(parseInt(e.target.value))
                            }
                            className='admin-form-control'
                          />
                        </InputGroup>
                        <Form.Text className='text-muted'>
                          Number of days until the code expires
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className='admin-divider'></div>

                  <Alert variant='info'>
                    <FaInfoCircle className='me-2' />
                    Each code is unique and can be used multiple times up to the maximum uses limit.
                    Once the maximum number of uses is reached or the code expires, it cannot be used again.
                  </Alert>
                </Form>

                <div className='d-grid gap-2'>
                  <Button
                    variant='primary'
                    onClick={handleGenerateSingle}
                    disabled={isGenerating}
                    className='admin-btn'
                  >
                    {isGenerating ? 'Generating...' : 'Generate Single Code'}
                  </Button>
                </div>
              </Tab>

              <Tab
                eventKey='batch'
                title={
                  <>
                    <FaLayerGroup className='me-2' />
                    Batch Generate
                  </>
                }
              >
                <Form>
                  <Row>
                    <Col md={4}>
                      <Form.Group className='admin-form-group'>
                        <Form.Label>Collection</Form.Label>
                        <Form.Control
                          readOnly
                          value={
                            filteredCollections?.find(
                              (c) => c._id === selectedCollection
                            )?.name || ''
                          }
                          className='admin-form-control'
                        />
                      </Form.Group>

                      {filteredCollections?.find(c => c._id === selectedCollection && !c.requiresCode) && (
                        <Alert variant='info' className='mt-2 mb-0'>
                          <FaInfoCircle className='me-2' />
                          Protection will be automatically enabled for this collection when you generate codes.
                        </Alert>
                      )}
                    </Col>
                    <Col md={2}>
                      <Form.Group className='admin-form-group'>
                        <Form.Label>Quantity</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaLayerGroup />
                          </InputGroup.Text>
                          <Form.Control
                            type='number'
                            min='1'
                            max='100'
                            value={quantity}
                            onChange={(e) =>
                              setQuantity(parseInt(e.target.value))
                            }
                            className='admin-form-control'
                          />
                        </InputGroup>
                        <Form.Text className='text-muted'>
                          Max: 100 codes
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className='admin-form-group'>
                        <Form.Label>Max Uses</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaHistory />
                          </InputGroup.Text>
                          <Form.Control
                            type='number'
                            min='1'
                            max='1000'
                            value={maxUses}
                            onChange={(e) =>
                              setMaxUses(parseInt(e.target.value))
                            }
                            className='admin-form-control'
                          />
                        </InputGroup>
                        <Form.Text className='text-muted'>
                          Uses per code
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className='admin-form-group'>
                        <Form.Label>Expiry (Days)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaCalendarAlt />
                          </InputGroup.Text>
                          <Form.Control
                            type='number'
                            min='1'
                            value={expiryDays}
                            onChange={(e) =>
                              setExpiryDays(parseInt(e.target.value))
                            }
                            className='admin-form-control'
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className='admin-divider'></div>

                  <Alert variant='info'>
                    <FaInfoCircle className='me-2' />
                    These codes will be automatically generated and can be
                    exported as a CSV file. Each code can be used multiple times
                    up to the maximum uses limit.
                  </Alert>
                </Form>

                <div className='d-grid gap-2'>
                  <Button
                    variant='primary'
                    onClick={handleGenerateBatch}
                    disabled={isGeneratingBatch}
                    className='admin-btn'
                  >
                    {isGeneratingBatch
                      ? 'Generating...'
                      : `Generate ${quantity} Codes`}
                  </Button>
                </div>
              </Tab>
            </Tabs>
          </Modal.Body>
        </Modal>

        {/* Generate Universal Code Modal */}
        <Modal
          show={universalModal}
          onHide={() => setUniversalModal(false)}
          className='admin-modal'
        >
          <Modal.Header closeButton className='bg-warning bg-opacity-10'>
            <Modal.Title className='d-flex align-items-center'>
              <FaUniversalAccess className='me-2' />
              Generate Universal Access Code
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant='warning'>
              <div className='d-flex'>
                <div className='me-3'>
                  <FaExclamationTriangle size='2em' />
                </div>
                <div>
                  <strong>Warning:</strong> Universal codes can unlock{' '}
                  <em>any</em> protected collection. Use with caution and only
                  share with trusted users.
                </div>
              </div>
            </Alert>

            <Tabs defaultActiveKey='single' className='mb-4 admin-tabs'>
              <Tab
                eventKey='single'
                title={
                  <>
                    <FaStar className='me-2 text-warning' />
                    Single Code
                  </>
                }
              >
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className='admin-form-group'>
                        <Form.Label>Max Uses</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaHistory />
                          </InputGroup.Text>
                          <Form.Control
                            type='number'
                            min='1'
                            max='1000'
                            value={universalMaxUses}
                            onChange={(e) =>
                              setUniversalMaxUses(parseInt(e.target.value))
                            }
                            className='admin-form-control'
                          />
                        </InputGroup>
                        <Form.Text className='text-muted'>
                          How many times this universal code can be used
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className='admin-form-group'>
                        <Form.Label>Universal Code Expiry (Days)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaCalendarAlt />
                          </InputGroup.Text>
                          <Form.Control
                            type='number'
                            min='1'
                            value={universalExpiryDays}
                            onChange={(e) =>
                              setUniversalExpiryDays(parseInt(e.target.value))
                            }
                            className='admin-form-control'
                          />
                        </InputGroup>
                        <Form.Text className='text-muted'>
                          Recommended: Set a longer expiration time (e.g., 90 days) for
                          universal codes
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className='d-grid gap-2 mt-4'>
                    <Button
                      variant='warning'
                      onClick={handleGenerateUniversalCode}
                      disabled={isGeneratingUniversal}
                      className='admin-btn'
                    >
                      {isGeneratingUniversal
                        ? 'Generating...'
                        : 'Generate Universal Code'}
                    </Button>
                  </div>
                </Form>
              </Tab>

              <Tab
                eventKey='batch'
                title={
                  <>
                    <FaLayerGroup className='me-2' />
                    Batch Generate
                  </>
                }
              >
                <Form>
                  <Row>
                    <Col md={4}>
                      <Form.Group className='admin-form-group'>
                        <Form.Label>Quantity</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaLayerGroup />
                          </InputGroup.Text>
                          <Form.Control
                            type='number'
                            min='1'
                            max='100'
                            value={universalQuantity}
                            onChange={(e) =>
                              setUniversalQuantity(parseInt(e.target.value))
                            }
                            className='admin-form-control'
                          />
                        </InputGroup>
                        <Form.Text className='text-muted'>
                          Max: 100 codes
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className='admin-form-group'>
                        <Form.Label>Max Uses</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaHistory />
                          </InputGroup.Text>
                          <Form.Control
                            type='number'
                            min='1'
                            max='1000'
                            value={universalMaxUses}
                            onChange={(e) =>
                              setUniversalMaxUses(parseInt(e.target.value))
                            }
                            className='admin-form-control'
                          />
                        </InputGroup>
                        <Form.Text className='text-muted'>
                          Uses per code
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className='admin-form-group'>
                        <Form.Label>Expiry (Days)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaCalendarAlt />
                          </InputGroup.Text>
                          <Form.Control
                            type='number'
                            min='1'
                            value={universalExpiryDays}
                            onChange={(e) =>
                              setUniversalExpiryDays(parseInt(e.target.value))
                            }
                            className='admin-form-control'
                          />
                        </InputGroup>
                        <Form.Text className='text-muted'>
                          Recommended: 90 days for universal codes
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className='admin-divider'></div>

                  <Alert variant='warning'>
                    <FaExclamationTriangle className='me-2' />
                    You are about to generate multiple universal access codes.
                    These codes can unlock <strong>any protected collection</strong> in the system.
                    Be very careful with distribution.
                  </Alert>

                  <div className='d-grid gap-2'>
                    <Button
                      variant='warning'
                      onClick={handleGenerateBatchUniversalCodes}
                      disabled={isGeneratingBatchUniversal}
                      className='admin-btn'
                    >
                      {isGeneratingBatchUniversal
                        ? 'Generating...'
                        : `Generate ${universalQuantity} Universal Codes`}
                    </Button>
                  </div>
                </Form>
              </Tab>
            </Tabs>
          </Modal.Body>
        </Modal>
      </div>
    </AnimatedScreenWrapper>
  );
};

export default OneTimeCodesScreen;
