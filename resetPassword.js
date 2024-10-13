require('dotenv').config();
const { parse } = require('url');
const bcrypt = require('bcrypt');
const querystring = require('querystring');
const { ObjectId } = require('mongodb');

module.exports = async (req, res, db) => {
    const { method, url } = req;
    const allowedOrigin = process.env.ALLOWED_ORIGIN;

    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');


    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }


    if (url.startsWith('/resetpassword/') && method === 'PUT') {
        const parsedUrl = parse(url);
        const pathSegments = parsedUrl.pathname.split('/');


        if (pathSegments.length !== 3) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid URL format. Expected /resetpassword/:userID' }));
            return;
        }

        const userID = parseInt(pathSegments[2], 10);


        if (isNaN(userID)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid userID. Must be a number.' }));
            return;
        }

        let body = '';


        req.on('data', chunk => {
            body += chunk.toString();


            if (body.length > 1e6) { // 1MB limit
                req.connection.destroy();
            }
        });

        
        req.on('end', async () => {
            try {
        
                const parsedBody = JSON.parse(body);
                const { newPassword } = parsedBody;

        
                if (!newPassword) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'New password is required.' }));
                    return;
                }

                // Hash the password
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

                const updateResult = await db.collection('users').updateOne(
                    { userID: userID },
                    { $set: { password: hashedPassword } } 
                );

                
                if (updateResult.matchedCount === 0) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'User not found.' }));
                    return;
                }

                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Password updated successfully.' }));
            } catch (error) {
                console.error('Error resetting password:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error.' }));
            }
        });

        
        req.on('error', (err) => {
            console.error('Request error:', err);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid request body.' }));
        });
    } else {
        
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }
};
