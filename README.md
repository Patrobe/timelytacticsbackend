# backend

This is the backend, the .env file contains the frontend URLs to allow them through to stop CORS errors.  This is set to localhost but please change to the 
frontend's public IP address if released to production, do note change the port as this is hardcoded on the frontend.  The database connection string for 
MongoDB is kept there as well if the connection string changes please change it there only as it will be referenced everywhere that is needed.