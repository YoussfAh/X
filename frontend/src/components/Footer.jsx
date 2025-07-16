import { Container, Row, Col } from 'react-bootstrap';
import { useStaticAppSettings } from '../hooks/useStaticAppSettings';
import { getFooterConfig } from '../config/appBranding';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const { shouldShowContent } = useStaticAppSettings();
    const footerConfig = getFooterConfig();

    // Don't render footer content until data is ready to prevent flashing
    if (!shouldShowContent) {
        return (
            <footer>
                <Container>
                    <Row>
                        <Col className='text-center py-3'>
                            <p>&nbsp;</p> {/* Invisible placeholder to maintain layout */}
                        </Col>
                    </Row>
                </Container>
            </footer>
        );
    }

    return (
        <footer>
            <Container>
                <Row>
                    <Col className='text-center py-3'>
                        <p>
                            {footerConfig.showBrandName && footerConfig.brandText}
                            {footerConfig.showBrandName && ' '}
                            &copy; 
                            {footerConfig.showYear && ` ${currentYear}`}
                            {footerConfig.copyrightText && ` ${footerConfig.copyrightText}`}
                        </p>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
};
export default Footer;
