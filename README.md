# 🌩️ CloudChat – Real-Time Chat Application

CloudChat is a Firebase-based real-time chat application built as part of the DETZ Global Internship program (Task 5). It supports real-time messaging, user authentication, and responsive design with optional features like image sharing.

## 👨‍💻 Team Members
- Sudesi Samarakoon  
- Pasindu Sadeep 

## 📦 Technologies Used

- **Frontend**: React + TailwindCSS
- **Backend**: Firebase (Auth, Realtime Database, Storage)
- **Image Hosting**: imgbb API
- **Tools**: Vite, Git, GitHub

## 🔐 Core Features

✅ Firebase Authentication (Sign Up / Login)  
✅ Real-time Messaging using Firebase Realtime Database  
✅ Secure Firebase Database Rules  
✅ Responsive UI/UX  
✅ Modular & Scalable Codebase  

## ⭐ Bonus Features

- 📷 Image Sharing (via imgbb)
- ⏱️ Message Timestamps
- ✅ Message Read Status *(coming soon)*
- 📥 Group Chat

## 🔧 Firebase Configuration

All Firebase credentials are stored securely in `.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_IMGBB_API_KEY=your_imgbb_api_key

## 🚀 How to Run Locally
Clone this repository:

git clone https://github.com/PSrandula/cloudchat-app.git
cd cloudchat

Install dependencies:
npm install

Add your .env file with Firebase and imgbb credentials.
Run the app:

npm run dev
