// services/authService.d.ts
import { User } from 'firebase/auth';

export declare function signInWithGoogle(): Promise<any>;
export declare function signOut(): Promise<void>;
export declare function useAuthentication(): { user?: User };