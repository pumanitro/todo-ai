import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';

// Load .env.local file
dotenv.config({ path: '.env.local' });

// Firebase config for cleanup task
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCpOWVlC6PVBEdLAsk90w8P24nv8A8cLCU',
  databaseURL: 'https://todo-ai-99c1f-default-rtdb.europe-west1.firebasedatabase.app',
};

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
    chromeWebSecurity: false,
    experimentalModifyObstructiveThirdPartyCode: true,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    setupNodeEvents(on, config) {
      // Load environment variables
      config.env = {
        ...config.env,
        TEST_EMAIL: process.env.CYPRESS_TEST_EMAIL,
        TEST_PASSWORD: process.env.CYPRESS_TEST_PASSWORD,
      };

      // Helper function to authenticate with Firebase
      async function firebaseAuth() {
        const email = process.env.CYPRESS_TEST_EMAIL;
        const password = process.env.CYPRESS_TEST_PASSWORD;

        if (!email || !password) {
          return null;
        }

        const authResponse = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_CONFIG.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, returnSecureToken: true }),
          }
        );

        if (!authResponse.ok) {
          return null;
        }

        return authResponse.json();
      }

      // Register cleanup tasks
      on('task', {
        // Delete ALL todos for the user
        async deleteAllTodosFromFirebase() {
          try {
            const auth = await firebaseAuth();
            if (!auth) return null;

            const { idToken, localId: uid } = auth;

            const deleteResponse = await fetch(
              `${FIREBASE_CONFIG.databaseURL}/users/${uid}/todos.json?auth=${idToken}`,
              { method: 'DELETE' }
            );

            if (deleteResponse.ok) {
              console.log(`✅ Deleted all todos for user ${uid}`);
              return { success: true };
            }
            return null;
          } catch (error) {
            console.log('Firebase cleanup error:', error);
            return null;
          }
        },

        // Delete specific todos by their text content (for isolated cleanup)
        async deleteTasksByName(taskNames: string[]) {
          try {
            const auth = await firebaseAuth();
            if (!auth) return null;

            const { idToken, localId: uid } = auth;

            // Get all todos
            const getResponse = await fetch(
              `${FIREBASE_CONFIG.databaseURL}/users/${uid}/todos.json?auth=${idToken}`
            );

            if (!getResponse.ok) return null;

            const todos = await getResponse.json();
            if (!todos) return { deleted: 0 };

            // Find and delete matching todos
            let deleted = 0;
            for (const [id, todo] of Object.entries(todos)) {
              const todoData = todo as { text?: string };
              if (todoData.text && taskNames.some(name => todoData.text?.includes(name))) {
                await fetch(
                  `${FIREBASE_CONFIG.databaseURL}/users/${uid}/todos/${id}.json?auth=${idToken}`,
                  { method: 'DELETE' }
                );
                deleted++;
              }
            }

            console.log(`✅ Deleted ${deleted} matching todos`);
            return { success: true, deleted };
          } catch (error) {
            console.log('Firebase delete by name error:', error);
            return null;
          }
        },
      });

      return config;
    },
  },
});
