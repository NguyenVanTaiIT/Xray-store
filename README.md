# Xray-store
# 🛒 Laptop Store – E-Commerce Website for AWS Workshop

This project is an **e-commerce website selling laptops**, built as part of a hands-on AWS workshop. The application includes a **React frontend** and a **Node.js backend**, integrated with various AWS services to demonstrate real-world practices for building, deploying, tracing, and monitoring cloud-native applications.

---

## 🎯 Workshop Objectives

In this hands-on workshop, you will learn how to:

- ✅ Build and deploy a full-stack e-commerce application using **Node.js** and **React**
- ✅ Use **AWS X-Ray** for **advanced tracing** of backend operations
- ✅ Monitor the application with **Amazon CloudWatch Logs and Metrics**
- ✅ Store product and order data in **MongoDB Atlas**
- ✅ Upload and retrieve product images using **Amazon S3**
- ✅ Manage secrets and environment variables securely with **AWS Secrets Manager**
- ✅ Deploy the full stack using **AWS Elastic Beanstalk**

---

## 🧱 Tech Stack

### 🔹 Frontend

- React + Vite
- React Router
- Context API for Auth, Cart, etc.
- Responsive UI (CSS Modules or Tailwind)

### 🔹 Backend

- Node.js + Express.js
- MongoDB Atlas with Mongoose
- JWT Authentication (Access + Refresh Token, Cookie-based)
- Amazon S3 for image uploads
- AWS X-Ray (Tracing)
- AWS CloudWatch (Logs & Metrics)
- AWS Secrets Manager
- Deployed via AWS Elastic Beanstalk

---

## 📦 Features

- 👤 User registration, login, and profile editing  
- 💻 Browse laptops by category, brand, or keyword  
- 🧺 Add to cart, update quantity, and checkout  
- 📦 View order history and order details  
- 🛠️ Admin panel to manage product listings  
- 🖼️ Upload and serve product images (S3)  
- ⭐ Product reviews with rating system  
- 🔍 Smart search, filter, and pagination  
- 📊 Full tracing and monitoring using AWS X-Ray & CloudWatch  

---

## 🚀 Deployment Overview

| Feature                 | AWS Service Used         |
|------------------------|--------------------------|
| Web hosting            | Elastic Beanstalk        |
| Image storage          | Amazon S3                |
| Tracing & diagnostics  | AWS X-Ray                |
| Logging & monitoring   | CloudWatch Logs & Metrics|
| Secret management      | Secrets Manager          |
| Database               | MongoDB Atlas (External) |

---

## 🛠️ Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-org/laptop-store-workshop.git
cd laptop-store-workshop
```

### 2. Install dependencies

```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 3. Create `.env` file in `/server`

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
S3_BUCKET_NAME=your_s3_bucket_name
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 4. Run the application

```bash
# Start backend
cd server
npm run dev

# Start frontend
cd ../client
npm run dev
```

The app will run at:

- **Frontend**: http://localhost:5173  
- **Backend**: http://localhost:5000
