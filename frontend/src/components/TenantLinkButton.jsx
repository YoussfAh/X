import React, { useState, useEffect } from 'react';
import { Button, Modal, Alert } from 'react-bootstrap';
import { FaLink, FaCopy, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { useTenant } from '../contexts/TenantContext';

const TenantLinkButton = () => {
  const { currentTenant } = useTenant();
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    hostname: '',
    subdomain: '',
    isAdmin: false
  });
  const [tenantLinks, setTenantLinks] = useState({
    vercelLink: '',
    localLink: '',
    devLink: '',
    superAdminVercelLink: '',
    superAdminLocalLink: '',
    superAdminDevLink: ''
  });

  useEffect(() => {
    const generateDebugInfo = () => {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      
      // Enhanced subdomain extraction
      const extractSubdomain = () => {
        if (hostname.includes('vercel.app')) {
          return parts.length > 2 ? parts[0] : 'grindx';
        }
        
        if (hostname.includes('localhost')) {
          return parts.length > 1 ? parts[0] : 'grindx';
        }
        
        return parts.length > 2 ? parts[0] : 'grindx';
      };

      const subdomain = extractSubdomain();
      
      setDebugInfo({
        hostname,
        subdomain,
        isAdmin: window.localStorage.getItem('userInfo') ? 
          JSON.parse(window.localStorage.getItem('userInfo')).isAdmin : false
      });
    };

    const generateTenantLinks = () => {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      
      const extractSubdomain = () => {
        if (hostname.includes('vercel.app')) {
          return parts.length > 2 ? parts[0] : 'grindx';
        }
        
        if (hostname.includes('localhost')) {
          return parts.length > 1 ? parts[0] : 'grindx';
        }
        
        return parts.length > 2 ? parts[0] : 'grindx';
      };

      const subdomain = extractSubdomain();
      const sanitizedSub = subdomain.replace(/[^a-zA-Z0-9]/g, '');

      // Generate links with sanitized subdomain
      const baseLinks = {
        // Home page links
        vercelLink: `https://${sanitizedSub}.grindx.vercel.app/home`,
        localLink: `http://localhost:3000/home`,
        devLink: `http://${sanitizedSub}.localhost:3000/home`,
        
        // Super admin page links
        superAdminVercelLink: `https://${sanitizedSub}.grindx.vercel.app/super-admin`,
        superAdminLocalLink: `http://localhost:3000/super-admin`,
        superAdminDevLink: `http://${sanitizedSub}.localhost:3000/super-admin`
      };

      // Adjust links based on current environment
      const isLocalhost = hostname.includes('localhost');
      const isVercel = hostname.includes('vercel.app');

      if (isLocalhost) {
        baseLinks.vercelLink = `https://${sanitizedSub}.grindx.vercel.app/home`;
        baseLinks.localLink = window.location.href;
        
        baseLinks.superAdminVercelLink = `https://${sanitizedSub}.grindx.vercel.app/super-admin`;
        baseLinks.superAdminLocalLink = window.location.href.replace(window.location.pathname, '/super-admin');
      } else if (isVercel) {
        baseLinks.localLink = `http://localhost:3000/home`;
        baseLinks.devLink = `http://${sanitizedSub}.localhost:3000/home`;
        
        baseLinks.superAdminLocalLink = `http://localhost:3000/super-admin`;
        baseLinks.superAdminDevLink = `http://${sanitizedSub}.localhost:3000/super-admin`;
      }

      setTenantLinks(baseLinks);
    };

    generateDebugInfo();
    generateTenantLinks();
  }, []);

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const renderLinkButton = (link, label) => (
    <div 
      className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" 
      style={{ 
        backgroundColor: 'rgba(0,0,0,0.05)', 
        border: '1px solid rgba(0,0,0,0.1)' 
      }}
    >
      <span className="text-truncate me-2">{link}</span>
      <Button 
        variant="outline-primary" 
        size="sm" 
        onClick={() => handleCopyLink(link)}
      >
        {copied ? <FaCheck /> : <FaCopy />}
      </Button>
    </div>
  );

  return (
    <>
      <Button 
        variant="outline-primary" 
        onClick={() => setShow(true)}
        className="d-flex align-items-center"
      >
        <FaLink className="me-2" /> Tenant Links
      </Button>

      <Modal show={show} onHide={() => setShow(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentTenant ? `${currentTenant.name} Links` : 'Tenant Links'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Debug Information Alert */}
          <Alert variant="info" className="mb-3">
            <FaExclamationTriangle className="me-2" />
            Debug Info: 
            Hostname: {debugInfo.hostname} | 
            Subdomain: {debugInfo.subdomain} | 
            Is Admin: {debugInfo.isAdmin ? 'Yes' : 'No'}
          </Alert>

          {debugInfo.isAdmin ? (
            <>
              <h5>Home Page Links</h5>
              <div className="row">
                <div className="col-md-4">
                  <h6>Vercel Deployment</h6>
                  {renderLinkButton(tenantLinks.vercelLink, 'Vercel')}
                </div>
                <div className="col-md-4">
                  <h6>Local Development</h6>
                  {renderLinkButton(tenantLinks.localLink, 'Local')}
                </div>
                <div className="col-md-4">
                  <h6>Dev Subdomain</h6>
                  {renderLinkButton(tenantLinks.devLink, 'Dev')}
                </div>
              </div>

              <hr />

              <h5>Super Admin Page Links</h5>
              <div className="row">
                <div className="col-md-4">
                  <h6>Vercel Deployment</h6>
                  {renderLinkButton(tenantLinks.superAdminVercelLink, 'Vercel')}
                </div>
                <div className="col-md-4">
                  <h6>Local Development</h6>
                  {renderLinkButton(tenantLinks.superAdminLocalLink, 'Local')}
                </div>
                <div className="col-md-4">
                  <h6>Dev Subdomain</h6>
                  {renderLinkButton(tenantLinks.superAdminDevLink, 'Dev')}
                </div>
              </div>
            </>
          ) : (
            <Alert variant="warning">
              <FaExclamationTriangle className="me-2" />
              You must be an admin to view tenant-specific links.
            </Alert>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default TenantLinkButton; 