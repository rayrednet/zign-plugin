import express from 'express';
import { handleError, sanitize } from '../helpers/routing.js';
import { contextHeader, getAppContext } from '../helpers/cipher.js';
import { getInstallURL } from '../helpers/zoom-api.js';
import session from '../session.js';

const router = express.Router();

/*
 * Home Page - Zoom App Launch handler
 * this route is used when a user navigates to the deep link
 */
function isContextExpired(context) {
    const currentTime = Date.now();
    return context.exp && context.exp < currentTime;
}

router.get('/', async (req, res, next) => {
    try {
        sanitize(req);

        const header = req.header(contextHeader);
        const context = header && getAppContext(header);

        // Zign Plugin Information - moved outside the if condition
        const zignInfo = {
            description: `Zign is a powerful sign language plugin for Zoom that helps make your meetings more inclusive and accessible. With real-time sign language interpretation and customizable features, Zign bridges communication gaps effortlessly.`,
            keyFeatures: [
                "Real-time sign language interpretation",
                "Customizable interpreter window",
                "Support for multiple sign languages",
                "Easy integration with Zoom"
            ]
        };

        if (!context) {
            return res.render('index', {
                isZoom: false,
                title: `Welcome to Zign`,
                zignInfo  // Now passing zignInfo here too
            });
        }

        // Check if the context is valid and not expired
        if (isContextExpired(context)) {
            return res.status(401).json({ error: 'Invalid or expired context' });
        }

        return res.render('index', {
            isZoom: true,
            title: `Welcome to Zign`,
            zignInfo
        });
    } catch (e) {
        next(handleError(e));
    }
});

/*
 * Install Route - Install the Zoom App from the Zoom Marketplace
 * this route is used when a user installs the app from the Zoom Client
 */
router.get('/install', session, async (req, res) => {
    const { url, state, verifier } = getInstallURL();
    req.session.state = state;
    req.session.verifier = verifier;
    res.redirect(url.href);
});

export default router;
