// services/index.ts
console.log('📦 [services/index.ts] Loading services...');
console.log('📦 [services/index.ts] Platform:', process.env.EXPO_PLATFORM || 'unknown');
console.log('📦 [services/index.ts] User Agent:', typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A');

export * from './authService';
export * from './database';
export * from './firebase';
export * from './firestoreService';