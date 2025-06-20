# Todo AI - Progressive Web App

A powerful, AI-enhanced todo app with task hierarchies, due dates, and smart categorization. Now available as a downloadable PWA!

## Features

- ✅ **Task Management**: Create, edit, and organize your tasks
- 📅 **Smart Due Dates**: Automatic categorization based on due dates
- 🔗 **Task Dependencies**: Block tasks based on other tasks
- 📱 **Mobile-First**: Responsive design with mobile FAB
- 🔄 **Real-time Sync**: Firebase integration for cross-device sync
- 📲 **PWA Ready**: Downloadable app with offline capabilities
- 🎨 **Material Design**: Beautiful, modern UI

## PWA Features

- **Downloadable**: Install directly to your device
- **Offline Support**: Service worker for offline functionality
- **App-like Experience**: Standalone display mode
- **Push Notifications**: (Future feature)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Firebase configuration
4. Run: `npm start`

## PWA Setup

### Creating Icons

The app uses placeholder icons. To create proper PWA icons:

1. **Option 1: Use an online generator**
   - Visit [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
   - Upload your logo/icon
   - Generate and download icons
   - Replace `public/icon-192.png` and `public/icon-512.png`

2. **Option 2: Manual creation**
   - Create two PNG files:
     - `icon-192.png` (192x192 pixels)
     - `icon-512.png` (512x512 pixels)
   - Use your app logo with proper Material Design guidelines
   - Place in the `public/` directory

3. **Option 3: Use the generator script**
   ```bash
   npm install canvas
   node scripts/generate-icons.js
   ```

### Installing the PWA

1. Open the app in a supported browser (Chrome, Edge, Firefox)
2. Look for the install prompt or "Add to Home Screen" option
3. Click "Install" when prompted
4. The app will be available on your device like a native app

### Browser Support

- ✅ Chrome/Chromium (full support)
- ✅ Edge (full support)
- ✅ Firefox (partial support)
- ✅ Safari (partial support)

## Development

```bash
npm start        # Start development server
npm run build    # Build for production
npm test         # Run tests
```

## Business Logic

See `.cursor/rules/business-logic.md` for detailed business rules and data models.

## Technologies

- React 18 + TypeScript
- Material-UI v5
- Firebase (Auth + Realtime Database)
- Hello Pangea DnD (drag & drop)
- Service Worker + Web App Manifest

## License

MIT License

## 🚀 Features

- **React 18** with TypeScript for type safety
- **Firebase Real-time Database** for live data synchronization
- **Material UI** for beautiful, accessible components
- **Real-time messaging** with instant updates
- **CRUD operations** (Create, Read, Delete)
- **Responsive design** that works on all devices

## 🛠️ Tech Stack

- React 18
- TypeScript
- Firebase (Real-time Database)
- Material UI
- React Scripts

## 📦 Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Setup Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable **Real-time Database**
   - Copy your Firebase configuration
   - Replace the placeholder config in `src/firebase/config.ts`

3. **Update Firebase Configuration:**
   ```typescript
   // src/firebase/config.ts
   const firebaseConfig = {
     apiKey: "your-actual-api-key",
     authDomain: "your-project-id.firebaseapp.com",
     databaseURL: "https://your-project-id-default-rtdb.firebaseio.com/",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };
   ```

4. **Firebase Security Rules (for development):**
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```

## 🏃‍♂️ Running the App

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

The app will open at [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── components/
│   └── HelloWorld.tsx     # Main demo component
├── firebase/
│   └── config.ts          # Firebase configuration
├── theme/
│   └── theme.ts           # Material UI theme
├── App.tsx                # Main app component
└── index.tsx              # Entry point
```

## 🎯 What's Included

- ✅ **Real-time messaging** - Add/delete messages with live updates
- ✅ **Material UI components** - Cards, buttons, text fields, lists
- ✅ **TypeScript interfaces** - Type-safe data structures
- ✅ **Firebase integration** - Real-time database operations
- ✅ **Responsive design** - Works on mobile and desktop
- ✅ **Error handling** - Proper error states and logging

## 🔧 Next Steps

1. **Authentication** - Add Firebase Auth for user management
2. **Routing** - Add React Router for multiple pages
3. **State Management** - Consider Redux/Context for complex state
4. **Testing** - Add comprehensive unit and integration tests
5. **Deployment** - Deploy to Firebase Hosting or Vercel

## 🚨 Important Notes

- Replace the Firebase configuration with your actual project settings
- Update Firebase security rules for production
- The current setup is for development purposes

## User prompt for cursor:
Everytime you add new functionality update business-logic.mdc file that is in /.cursor/rules. Keep it small, condence, only with essential knowledge.

## 📚 Learn More

- [React Documentation](https://reactjs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Material UI Documentation](https://mui.com/)

Happy coding! 🎉 