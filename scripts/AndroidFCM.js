import * as axios from 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';


class AndroidFCM {

    static async register(apiKey, projectId, gmsAppId, androidPackageName, androidPackageCert) {

        // create firebase installation
        const installationAuthToken = await this.installRequest(apiKey, projectId, gmsAppId, androidPackageName, androidPackageCert);

        // register gcm
        const fcmToken = await this.registerRequest(installationAuthToken, apiKey, androidPackageName, androidPackageCert);

        return {
            fcm: {
                token: fcmToken,
            },
        };
    }

    static async installRequest(apiKey, projectId, gmsAppId, androidPackage, androidCert) {

        // send firebase installation request
        const response = await axios.post(`https://firebaseinstallations.googleapis.com/v1/projects/${projectId}/installations`, {
            "fid": this.generateFirebaseFID(),
            "appId": gmsAppId,
            "authVersion": "FIS_v2",
            "sdkVersion": "a:17.0.0",
        }, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-Android-Package": androidPackage,
                "X-Android-Cert": androidCert,
                "x-firebase-client": "web", // Web client version can be simplified
                "x-firebase-client-log-type": "3",
                "x-goog-api-key": apiKey,
                "User-Agent": "Mozilla/5.0",
            },
        });

        // ensure auth token received
        if (!response.data.authToken || !response.data.authToken.token) {
            throw new Error(`Failed to get Firebase installation AuthToken: ${response.data}`);
        }

        return response.data.authToken.token;
    }

    static async registerRequest(installationAuthToken, apiKey, androidPackageName, androidPackageCert, retry = 0) {

        const registerResponse = await axios.post("https://android.clients.google.com/c2dm/register3", {
            "device": "web-device",  // Web device identifier, since we're in a browser
            "app": androidPackageName,
            "cert": androidPackageCert,
            "app_ver": "1",
            "X-scope": "*",
            "X-Goog-Firebase-Installations-Auth": installationAuthToken,
            "X-gms_app_id": "your-gms-app-id",  // Substitute with actual GMS App ID
        }, {
            headers: {
                "Authorization": `Bearer ${installationAuthToken}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        // retry a few times if needed
        const data = registerResponse.data;
        if (data.includes('Error')) {
            console.warn(`Register request has failed with ${data}`);
            if (retry >= 5) {
                throw new Error('GCM register has failed');
            }
            console.warn(`Retry... ${retry + 1}`);
            return this.registerRequest(installationAuthToken, apiKey, androidPackageName, androidPackageCert, retry + 1);
        }

        // extract fcm token from response
        return registerResponse.data.split("=")[1];
    }

    // Web Crypto API to generate Firebase ID in the browser
    static generateFirebaseFID() {
        const array = new Uint8Array(17);
        window.crypto.getRandomValues(array);

        // manipulate the first byte as in the original method
        array[0] = 0b01110000 | (array[0] & 0b00001111);

        return btoa(String.fromCharCode.apply(null, array)).replace(/=/g, "");
    }

}

export default AndroidFCM;