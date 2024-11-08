// Initialize Firebase SDK dynamically within the register method
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js';
import { getMessaging } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-messaging.js';
import { getInstallations } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-installations.js';


class AndroidFCM {
    static async register(apiKey, projectId, gmsAppId, androidPackageName, androidPackageCert) {
        // Dynamically create the firebase config using the parameters
        const firebaseConfig = {
            apiKey: apiKey,
            authDomain: `${projectId}.firebaseapp.com`,
            projectId: projectId,
            storageBucket: `${projectId}.appspot.com`,
            messagingSenderId: gmsAppId,
            appId: gmsAppId,  // Assuming `gmsAppId` is also the appId
            measurementId: `${projectId}-ID`,  // This might not be needed, set it based on your Firebase Console
        };

        // Initialize Firebase with the dynamically created config
        const app = initializeApp(firebaseConfig);

        // Initialize Firebase Installations
        const installations = getInstallations(app);

        // Initialize Firebase Messaging
        const messaging = getMessaging(app);

        try {
            // create firebase installation (get the installation token)
            const installationAuthToken = await this.installRequest(installations);

            // register for Firebase Cloud Messaging (FCM) token
            const fcmToken = await this.registerRequest(messaging, installationAuthToken);

            return {
                fcm: {
                    token: fcmToken,
                },
            };
        } catch (error) {
            console.error("Error during FCM registration:", error);
            throw error;
        }
    }

    static async installRequest(installations) {
        try {
            // Get Firebase Installation ID and token using Firebase SDK
            const fid = await installations.getId();
            console.log("Firebase Installation ID:", fid);

            // Get installation token
            const token = await installations.getToken();
            console.log("Firebase Installation Auth Token:", token);

            return token;
        } catch (error) {
            console.error("Error getting Firebase installation token:", error);
            throw error;
        }
    }

    static async registerRequest(messaging, installationAuthToken) {
        try {
            // Here we use Firebase Cloud Messaging to get the FCM token
            const fcmToken = await messaging.getToken({
                vapidKey: 'YOUR_VAPID_KEY', // You need to generate this key in Firebase Console
            });

            if (!fcmToken) {
                throw new Error("Failed to get FCM token");
            }

            return fcmToken;
        } catch (error) {
            console.error("Error during FCM registration:", error);
            throw error;
        }
    }

    static randomBytes(size) {
        const bytes = new Uint8Array(size);
        window.crypto.getRandomValues(bytes);  // Secure random byte generation
        return bytes;
    }

    // Generate Firebase Installation ID (FID)
    static generateFirebaseFID() {
        const buf = this.randomBytes(17);
        buf[0] = 0b01110000 | (buf[0] & 0b00001111); 
        const base64String = btoa(String.fromCharCode.apply(null, buf));
        return base64String.replace(/=/g, "");
    }
}

export {AndroidFCM};