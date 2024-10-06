require('dotenv').config();
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

    if (url === '/login' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            const { username, password } = JSON.parse(body);

            const user = await db.collection('users').findOne({ username });
            if (!user || user.password !== password) { 
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid username or password' }));
                return;
            }

            
            const loginResponse = {
                username: user.username,
                role: user.role,
                userID: user.userID,
                departmentID: user.departmentID

            };

            
            if (user.role === 2) {
                loginResponse.lecturerName = user.lecturerName;
                loginResponse.skillSet = user.skillSet;
                loginResponse.workLoad = user.workLoad;
            }

            if (user.active === false) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid username or password' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(loginResponse));
            };
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }
};
