const { ObjectId } = require('mongodb');

module.exports = async (req, res, db) => {
    const { method, url } = req;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    if (method === 'OPTIONS') {
        res.writeHead(204); 
        res.end();
        return;
    }
    if (url === '/users' && method === 'GET') {
        const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(users));
        console.log('GET users was called');
    } else if (url === '/users' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            const user = JSON.parse(body);

            // Check if the role is valid
            const validRoles = [0,1,2];
            if (!validRoles.includes(user.role)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid role value' }));
                return;
            }

            // Check if the username is unique
            const existingUser = await db.collection('users').findOne({ username: user.username });
            if (existingUser) {
                res.writeHead(409, { 'Content-Type': 'application/json' }); // 409 Conflict
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

            res.writeHead(201, { 'Content-Type': 'application/json' },
                { 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ message: 'User created' }));
        });       
    } else if (url.startsWith('/users/') && method === 'PUT') {
        const id = url.split('/')[2];
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const updatedUser = JSON.parse(body);
            await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: updatedUser });
            res.writeHead(200, { 'Content-Type': 'application/json' },
                { 'Access-Control-Allow-Origin': 'http://localhost:5173' });
            res.end(JSON.stringify({ message: 'User updated' }));
        });
    } else if (url.startsWith('/users/') && method === 'DELETE') {
        const id = url.split('/')[2];
        await db.collection('users').deleteOne({ _id: new ObjectId(id) });
        res.writeHead(200, { 'Content-Type': 'application/json' },
            { 'Access-Control-Allow-Origin': 'http://localhost:5173' });
        res.end(JSON.stringify({ message: 'User deleted' }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }
};
