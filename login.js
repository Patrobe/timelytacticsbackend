const { ObjectId } = require('mongodb');

module.exports = async (req, res, db) => {
    const { method, url } = req;
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
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

            // Check if the user exists
            const user = await db.collection('users').findOne({ username });
            if (!user || user.password !== password) { // Simple password check (plaintext)
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid username or password' }));
                return;
            }

            // Construct the basic login response
            const loginResponse = {
                username: user.username,
                role: user.role,
                userID: user.userID
            };

            // If the user is a lecturer (role 2), include additional fields
            if (user.role === 2) {
                loginResponse.lecturerName = user.lecturerName;
                loginResponse.skillSet = user.skillSet;
                loginResponse.workLoad = user.workLoad;
            }

            // Send the response back
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(loginResponse));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }
};
