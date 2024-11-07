import {Client} from './PushReceiverClient.js';
import {AndroidFCM} from './AndroidFCM.js';

class FCMManager {
    //static expoPushToken = null;
    static rustplusAuthToken = null;
    static creds = null;
    

    static async linkSteamWithRustPlus() {
        const popup = window.open('', '_blank', 'width=600,height=400');

        fetch('https://companion-rust.facepunch.com/app?returnUrl=')
          .then(response => response.text())
          .then(data => {
            popup.document.write('<pre>' + data + '</pre>');
            popup.document.close();
            setTimeout(() => popup.close(), 5000);  // Close popup after 5 seconds
          })
          .catch(error => {
            console.error('Error fetching the page:', error);
            popup.document.write('Failed to load page.');
            popup.document.close();
          });
    }

    static async fcmRegister() {
        console.log("Registering");

        const apiKey = "AIzaSyB5y2y-Tzqb4-I4Qnlsh_9naYv_TD8pCvY";
        const projectId = "rust-companion-app";
        const gcmSenderId = "976529667804";
        const gmsAppId = "1:976529667804:android:d6f1ddeb4403b338fea619";
        const androidPackageName = "com.facepunch.rust.companion";
        const androidPackageCert = "E28D05345FB78A7A1A63D70F4A302DBF426CA5AD";

        //const fcmCredentials = await AndroidFCM.register(apiKey, projectId, gcmSenderId, gmsAppId, androidPackageName, androidPackageCert);
        //this.expoPushToken = await this.getExpoPushToken(fcmCredentials.fcm.token);

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

export {FCMManager};