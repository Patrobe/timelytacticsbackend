const { ObjectId } = require('mongodb');

module.exports = async (req, res, db) => {
    const { method, url } = req;
    res.setHeader('Access-Control-Allow-Origin', ['http://localhost:5173', 'http://170.64.196.188:5173'].includes(req.headers.origin) ? req.headers.origin : '');
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
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid username or password' }));
                return;
            }

            
            const loginResponse = {
                username: user.username,
                role: user.role,
                userID: user.userID
            };

            
            if (user.role === 2) {
                loginResponse.lecturerName = user.lecturerName;
                loginResponse.skillSet = user.skillSet;
                loginResponse.workLoad = user.workLoad;
            }

            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(loginResponse));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }
};
