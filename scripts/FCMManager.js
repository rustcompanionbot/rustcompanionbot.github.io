class FCMManager {
    static expoPushToken = null;
    static rustplusAuthToken = null;
    static creds = null;

    static async linkSteamWithRustPlus() {
        return new Promise((resolve, reject) => {
            // Define the URL for the Rust+ Steam login page
            const linkUrl = 'https://companion-rust.facepunch.com/login';

            // Redirect the user to the Rust+ login page
            // Optionally, you could open this in a new window or tab depending on your needs
            window.location.href = linkUrl;

            // You would need a callback in your app that listens for the redirected request
            // Assuming you set up the callback URL to capture the 'token' query param
            const urlParams = new URLSearchParams(window.location.search);
            const authToken = urlParams.get('token');

            if (authToken) {
                resolve(authToken);  // Return the token back to where it's called
            } else {
                reject(new Error('Token missing or failed to authenticate.'));
            }
        });
    }

    static async handleSteamCallback() {
        // Handle the callback once the user is redirected back
        // Capture the 'token' from the URL and use it
        const urlParams = new URLSearchParams(window.location.search);
        const authToken = urlParams.get('token');
        
        if (authToken) {
            console.log('Successfully linked Steam account with Rust+:', authToken);
            this.rustplusAuthToken = authToken;

            // Now proceed with further actions, such as registration with Rust+ (via API)
            const expoPushToken = await this.getExpoPushToken(this.creds.fcm_credentials.fcm.token);
            await this.registerWithRustPlus(this.rustplusAuthToken, expoPushToken);
        } else {
            console.error('Failed to obtain token during Steam callback.');
        }
    }

    static async fcmRegister() {
        const apiKey = "AIzaSyB5y2y-Tzqb4-I4Qnlsh_9naYv_TD8pCvY";
        const projectId = "rust-companion-app";
        const gcmSenderId = "976529667804";
        const gmsAppId = "1:976529667804:android:d6f1ddeb4403b338fea619";
        const androidPackageName = "com.facepunch.rust.companion";
        const androidPackageCert = "E28D05345FB78A7A1A63D70F4A302DBF426CA5AD";

        const fcmCredentials = await AndroidFCM.register(apiKey, projectId, gcmSenderId, gmsAppId, androidPackageName, androidPackageCert);
        this.expoPushToken = await this.getExpoPushToken(fcmCredentials.fcm.token);

        // Trigger Steam linking flow
        this.linkSteamWithRustPlus().then(authToken => {
            // Now that the Steam account is linked, use the obtained authToken
            this.rustplusAuthToken = authToken;
        }).catch(error => {
            console.error("Error during Steam linking:", error);
        });
    }

    static async fcmListen() {
        if (!this.creds) {
            return;
        }

        const androidId = this.creds.fcm_credentials.gcm.androidId;
        const securityToken = this.creds.fcm_credentials.gcm.securityToken;
        const client = new PushReceiverClient(androidId, securityToken, []);

        client.on('ON_DATA_RECEIVED', (data) => {
            const parsedData = JSON.parse(data.appData[2].value);

            const serverIP = parsedData.ip || 'N/A';
            const serverPort = parsedData.port || 'N/A';
            const playerToken = parsedData.playerToken || 'N/A';
            const playerId = parsedData.playerId || 'N/A';
            const serverName = data.appData[1].value || 'N/A';

            console.log(`Server Name: ${serverName}`);
            console.log(`Server IP: ${serverIP}`);
            console.log(`Server Port: ${serverPort}`);
            console.log(`Player Token: ${playerToken}`);
            console.log(`Player ID (SteamID): ${playerId}`);
        });

        await client.connect();
    }
}