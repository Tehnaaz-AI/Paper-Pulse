# AI Paper Trading Simulator

An interactive platform allowing users to practice stock trading using virtual money.
It provides historical stock analysis, AI-based predictions, basic financial explanations, and a portfolio tracking system.

## Project Structure

This project uses the MERN stack (MongoDB, Express, React, Node.js) and is split into two main directories:

- **`/backend`**: The Node.js/Express REST API. Connects to MongoDB, processes historical CSV data, generates AI signals, and tracks virtual portfolios.
- **`/frontend`**: The React application. Uses Framer Motion for animations and Recharts for historical price charts.

## Setup Instructions

### Backend
1. Navigate to the `backend` directory.
2. Run `npm install`
3. Start the server with `npm run dev`

### Frontend
1. Navigate to the `frontend` directory.
2. Run `npm install`
3. Start the Vite server with `npm run dev`
