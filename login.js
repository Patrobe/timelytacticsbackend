// .-----------------------------------------------------------------------------------------------------------------------------------------------------------------.
// | _________   ___   _____ ______    _______    ___            ___    ___              _________   ________   ________  _________   ___   ________   ________      |
// ||\___   ___\|\  \ |\   _ \  _   \ |\  ___ \  |\  \          |\  \  /  /|            |\___   ___\|\   __  \ |\   ____\|\___   ___\|\  \ |\   ____\ |\   ____\     |
// |\|___ \  \_|\ \  \\ \  \\\__\ \  \\ \   __/| \ \  \         \ \  \/  / /            \|___ \  \_|\ \  \|\  \\ \  \___|\|___ \  \_|\ \  \\ \  \___| \ \  \___|_    |
// |     \ \  \  \ \  \\ \  \\|__| \  \\ \  \_|/__\ \  \         \ \    / /                  \ \  \  \ \   __  \\ \  \        \ \  \  \ \  \\ \  \     \ \_____  \   |
// |      \ \  \  \ \  \\ \  \    \ \  \\ \  \_|\ \\ \  \____     \/  /  /                    \ \  \  \ \  \ \  \\ \  \____    \ \  \  \ \  \\ \  \____ \|____|\  \  |
// |       \ \__\  \ \__\\ \__\    \ \__\\ \_______\\ \_______\ __/  / /                       \ \__\  \ \__\ \__\\ \_______\   \ \__\  \ \__\\ \_______\ ____\_\  \ |
// |        \|__|   \|__| \|__|     \|__| \|_______| \|_______||\___/ /                         \|__|   \|__|\|__| \|_______|    \|__|   \|__| \|_______||\_________\|
// |                                                           \|___|/                                                                                   \|_________||
// |                                                                                                                                                                 |
// |  A student project web app by Cameron Egglestone, Jason Walstab, Patrick Hickey and Shane Larsen for Latrobe University                                         |
// '-----------------------------------------------------------------------------------------------------------------------------------------------------------------'
//  07/09/2024 Created loging.js endpoint to handle logging into the system.  - Pat
//  10/10/2024 added the encryption - Pat

require('dotenv').config();
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt'); 

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
            try {
                const { username, password } = JSON.parse(body);

                const user = await db.collection('users').findOne({ username });
                if (!user) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Invalid username or password' }));
                    return;
                }

                const match = await bcrypt.compare(password, user.password);
                if (!match) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Invalid username or password' }));
                    return;
                }

                // Check if the user is active
                if (user.active === false) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Invalid username or password' }));
                    return;
                }

                // Prepare the response object
                const loginResponse = {
                    user: {
                        username: user.username,
                        role: user.role,
                        userID: user.userID,
                        departmentID: user.departmentID,
                        active: user.active
                    }
                };

                // Add additional fields if the user is a Lecturer
                if (user.role === 2) {
                    loginResponse.user.lecturerName = user.lecturerName;
                    loginResponse.user.skillSet = user.skillSet;
                    loginResponse.user.workLoad = user.workLoad;
                }

                // Respond with user details on successful login
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(loginResponse));
            } catch (err) {
                console.error('Error during login:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'An unexpected error occurred' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }

};
