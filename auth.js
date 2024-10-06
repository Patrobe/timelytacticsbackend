//const bcrypt = require('bcryptjs');
//const jwt = require('jsonwebtoken');
//const { getDb } = require('./db');

//const registerUser = async (username, password) => {
//    const db = getDb();
//    const hashedPassword = await bcrypt.hash(password, 10);
//    await db.collection('users').insertOne({ username, password: hashedPassword });
//};

//const loginUser = async (username, password) => {

//    if (user && await bcrypt.compare(password, user.password)) {
//        const token = jwt.sign({ username }, 'your_jwt_secret');
//        return { token }; 
//    }
//    throw new Error('Invalid credentials');
//};
//module.exports = { registerUser, loginUser };
