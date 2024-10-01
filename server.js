require('dotenv').config();
const http = require('http');
const { MongoClient } = require('mongodb');
const userRoutes = require('./user');
const loginRoutes = require('./login');
const subjectRoutes = require('./subject');
const scheduleRoutes = require('./subjectInstance');
const skillRoutes = require('./skill');
const departmentRoutes = require('./department');
const login = require('./login');
const url = process.env.MONGODB_URI;
const dbName = 'timelytactics';

async function connectToDatabase() {
    try {
        const client = await MongoClient.connect(url);
        db = client.db(dbName);
        console.log(`Connected to database: ${dbName}`);

        const collections = ['users', 'subjects', 'subjectInstances', 'skill', 'department'];
        for (const collection of collections) {
            const col = await db.listCollections({ name: collection }).toArray();
            if (col.length === 0) {
                await db.createCollection(collection);
                console.log(`Created collection: ${collection}`);
            }
        }
        return client; 
    } catch (err) {
        console.error('Error connecting to database:', err);
        throw err;
    }
}

(async () => {
    try {
        const client = await connectToDatabase();

        const requestHandler = async (req, res) => {
            try {
                if (req.url.startsWith('/users')) {
                    return userRoutes(req, res, db);
                } else if (req.url.startsWith('/subjects')) {
                    return subjectRoutes(req, res, db);
                } else if (req.url.startsWith('/subjectinstance')) {
                    return scheduleRoutes(req, res, db);                
                } else if (req.url.startsWith('/skill')) {
                    return skillRoutes(req, res, db);
                } else if (req.url.startsWith('/login')) {
                    return loginRoutes(req, res, db);
                } else if (req.url.startsWith('/department')) {
                    return departmentRoutes(req, res, db);
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Route not found');
                }
            } catch (err) {
                console.error('Error handling request:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal server error');
            }
        };

        const server = http.createServer(requestHandler);
        server.listen(3000, () => {
            console.log('Server is running on http://localhost:3000');
        });

         process.on('SIGINT', () => {
           client.close();
           console.log('Server shutting down and connection closed');
           process.exit(0);
         });
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
})();