import { initializeApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAnalytics } from "firebase/analytics";

// Your Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyCpOWVlC6PVBEdLAsk90w8P24nv8A8cLCU",
    authDomain: "todo-ai-99c1f.firebaseapp.com",
    databaseURL: "https://todo-ai-99c1f-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "todo-ai-99c1f",
    storageBucket: "todo-ai-99c1f.firebasestorage.app",
    messagingSenderId: "860660947584",
    appId: "1:860660947584:web:d056b8f8cbbf2008b4e465",
    measurementId: "G-S6P8F7TF0M"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database: Database = getDatabase(app);
export const analytics = getAnalytics(app);

export default app; 