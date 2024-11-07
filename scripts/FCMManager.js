import Client from './PushReceiverClient.js';
import AndroidFCM from './AndroidFCM.js';

class FCMManager {
    static expoPushToken = null;
    static rustplusAuthToken = null;
    static creds = null;

    static async linkSteamWithRustPlus() {
        return new Promise((resolve, reject) => {
            const linkUrl = 'https://companion-rust.facepunch.com/login';

            window.location.href = linkUrl;

            const urlParams = new URLSearchParams(window.location.search);
            const authToken = urlParams.get('token');

            if (authToken) {
                resolve(authToken); 
            } else {
                reject(new Error('Token missing or failed to authenticate.'));
            }
        });
    }

    static async handleSteamCallback() {

        const urlParams = new URLSearchParams(window.location.search);
        const authToken = urlParams.get('token');
        
        if (authToken) {
            console.log('Successfully linked Steam account with Rust+:', authToken);
            this.rustplusAuthToken = authToken;

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

        this.linkSteamWithRustPlus().then(authToken => {
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
        const client = new Client(androidId, securityToken, []);

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