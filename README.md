# GrowthX Task

This is the backend assignment for the position of Backend Intern at GrowthX. The project is structured to handle user and admin functionalities, including authentication and task management.

## Project Structure

The entire backend code is located in the `server` folder. Below is a brief overview of the key components inside the folder:

### 1. **Server**
   - **server.js**: This is the entry point for the Node.js server. It sets up the Express server, connects to MongoDB, and manages the routing for user and admin-related endpoints. To start the server, navigate to the `server` directory and run:
     ```bash
     node server.js
     ```
     The server will be up and running on port 3000.

### 2. **Database (db folder)**
   - **db.js**: This file contains the schema definitions for the MongoDB collections used in the project. The schema structures are defined using Mongoose, making it easy to interact with the database.

### 3. **Middleware (middleware folder)**
   - **auth.js**: This file contains both the JWT secret and the `authMiddleware` functions. The JWT secret is used to sign and verify tokens for user and admin authentication, while the middleware ensures that routes requiring authentication are protected by verifying the JWT tokens in the request headers.

### 4. **Routes (routes folder)**
   - **user.js**: This file defines all the routes related to user functionalities such as registration, login, task uploads, and profile management. Protected routes are secured with JWT authentication using the `authMiddleware`.
   - **admin.js**: This file handles all admin-related routes such as admin registration, login, task approvals, and assignment management. Admin routes are also protected using JWT tokens and require proper authentication via the `authMiddleware`.

## How to Run

1. Clone the repository and navigate to the `server` folder:
   ```bash
   git clone https://github.com/Mantissagithub/growthx_task.git
   cd server
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   node server.js
   ```

4. The backend server will be running on `http://localhost:3000`. You can use Postman to test the various user and admin routes.

### Testing Routes in Postman

- **User Routes**: 
   - User registration, login, task upload, and profile management can be tested via the user routes located in `user.js`. 
   - For routes that require authentication, such as `/upload` and `/me`, you need to log in first and use the JWT token provided in the login response. In Postman, set the `Authorization` header to `Bearer <your-jwt-token>` to access protected routes.
  
- **Admin Routes**: 
   - Admin registration, login, task approvals, and assignment management routes can be tested via the admin routes located in `admin.js`. Similarly, ensure that the JWT token is provided in the `Authorization` header for admin-only routes.

This structure ensures modularity, making it easier to maintain and extend the backend as needed.
