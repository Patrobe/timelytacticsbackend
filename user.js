require('dotenv').config();
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt'); // Added bcrypt import
const department = require('./department');

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
        try {
            const urlObj = new URL(`http://localhost:3000${url}`);
            const roleParam = urlObj.searchParams.get('role');
            const departmentIDParam = urlObj.searchParams.get('departmentID');
            let roleFilter = {};
            let departmentIDFilter = {};

            if (roleParam && !isNaN(roleParam)) {
                const roleValue = parseInt(roleParam, 10);
                if ([0, 1, 2].includes(roleValue)) {
                    roleFilter = { role: { $gt: roleValue } };
                }
            }

            if (departmentIDParam && !isNaN(departmentIDParam)) {
                const departmentIDValue = parseInt(departmentIDParam, 10);
                departmentIDFilter = { departmentID: departmentIDValue };
            }

            // Ensure only active users are fetched
            const combinedFilter = { ...roleFilter, ...departmentIDFilter, active: true };

            const users = await db.collection('users')
                .find(combinedFilter, { projection: { password: 0 } })
                .toArray();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(users));
            console.log('GET users with role and departmentID filtering was called');
        } catch (error) {
            console.error('Error fetching users:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    } else if (url === '/users' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const user = JSON.parse(body);

                const { username, password, role, ...rest } = user;

                // Validate required fields
                if (!username || !password || role === undefined) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Username, password, and role are required.' }));
                    return;
                }

                const validRoles = [0, 1, 2];
                if (!validRoles.includes(role)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Invalid role value' }));
                    return;
                }

                // Password validation
                const validatePassword = (password) => {
                    const minLength = 8;
                    const hasMinLength = password.length >= minLength;
                    const hasUpperCase = /[A-Z]/.test(password);
                    const hasNumber = /[0-9]/.test(password);
                    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
                    return hasMinLength && hasUpperCase && hasNumber && hasSpecialChar;
                };

                if (!validatePassword(password)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        message: 'Password must be at least 8 characters long, contain a capital letter, a number, and a special character.'
                    }));
                    return;
                }

                // Check if username already exists
                const existingUser = await db.collection('users').findOne({ username });
                if (existingUser) {
                    res.writeHead(409, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Username already exists' }));
                    return;
                }

                // Generate next userID
                const highestUser = await db.collection('users')
                    .find()
                    .sort({ userID: -1 })
                    .limit(1)
                    .toArray();

                const nextUserId = highestUser.length > 0 ? highestUser[0].userID + 1 : 1;

                // Hash the password
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);

                // Set default fields if not provided
                const newUser = {
                    username,
                    password: hashedPassword, // Store hashed password
                    role,
                    userID: nextUserId,
                    active: user.active !== undefined ? user.active : true,
                    lecturerName: user.lecturerName || '',
                    workLoad: user.workLoad || 0,
                    skillSet: user.skillSet || [],
                    ...rest, // Include other fields if any
                };

                // Insert the new user into the database
                await db.collection('users').insertOne(newUser);

                // Fetch the created user without the password
                const createdUser = await db.collection('users').findOne(
                    { userID: nextUserId },
                    { projection: { password: 0 } }
                );

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(createdUser));
                console.log('POST /users - User created:', createdUser);
            } catch (error) {
                console.error('Error creating user:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
        });
    } else if (url.startsWith('/users/') && method === 'PUT') {
        const id = url.split('/')[2];
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const updatedUser = JSON.parse(body);
                delete updatedUser._id;

                // If password is being updated, hash it
                if (updatedUser.password) {
                    const saltRounds = 10;
                    updatedUser.password = await bcrypt.hash(updatedUser.password, saltRounds);
                }

                // Update the user in the database
                await db.collection('users').updateOne(
                    { userID: parseInt(id, 10) },
                    { $set: updatedUser }
                );

                // Fetch the updated user without the password
                const userAfterUpdate = await db.collection('users').findOne(
                    { userID: parseInt(id, 10) },
                    { projection: { password: 0 } }
                );

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(userAfterUpdate));
                console.log(`PUT /users/${id} - User updated:`, userAfterUpdate);
            } catch (error) {
                console.error('Error updating user:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
        });
    } else if (url.startsWith('/users/') && method === 'DELETE') {
        const id = url.split('/')[2];
        await db.collection('users').deleteOne({ userID: parseInt(id, 10) });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User deleted' }));
        console.log(`DELETE /users/${id} - User deleted`);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }
};
