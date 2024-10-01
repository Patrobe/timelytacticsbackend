require('dotenv').config();
const { ObjectId } = require('mongodb');


module.exports = async (req, res, db) => {
    const { method, url } = req;
    const allowedOrigin = process.env.ALLOWED_ORIGIN;
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');


    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }


    if (url.startsWith('/users') && method === 'GET') {
        const urlObj = new URL(`http://localhost:3000${url}`);
        const roleParam = urlObj.searchParams.get('role');
        let roleFilter = {};


        if (roleParam && !isNaN(roleParam)) {
            const roleValue = parseInt(roleParam, 10);
            if ([0, 1, 2].includes(roleValue)) {
                roleFilter = { role: { $gt: roleValue } };
            }
        }

        const users = await db.collection('users')
            .find(roleFilter, { projection: { password: 0 } })
            .toArray();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(users));
        console.log('GET users with role filtering was called');
    }

    else if (url === '/users' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            const user = JSON.parse(body);

            const validRoles = [0, 1, 2];
            if (!validRoles.includes(user.role)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid role value' }));
                return;
            }

            const existingUser = await db.collection('users').findOne({ username: user.username });
            if (existingUser) {
                res.writeHead(409, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Username already exists' }));
                return;
            }

            const highestUser = await db.collection('users')
                .find()
                .sort({ userID: -1 })
                .limit(1)
                .toArray();

            const nextUserId = highestUser.length > 0 ? highestUser[0].userID + 1 : 1;
            user.userID = nextUserId;

            await db.collection('users').insertOne(user);

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User created' }));
        });
    }

    else if (url.startsWith('/users/') && method === 'PUT') {
        const id = url.split('/')[2];  
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const updatedUser = JSON.parse(body);
            delete updatedUser._id;  

            await db.collection('users').updateOne({ userID: parseInt(id, 10) }, { $set: updatedUser });  
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User updated' }));
        });
    }


  
    else if (url.startsWith('/users/') && method === 'DELETE') {
        const id = url.split('/')[2];
        await db.collection('users').deleteOne({ userID: new ObjectId(id) });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User deleted' }));
    }

    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }
};

