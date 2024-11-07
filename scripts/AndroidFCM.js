//const axios = window.axios;

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
                "x-firebase-client": "android-min-sdk/23 fire-core/20.0.0 device-name/a21snnxx device-brand/samsung device-model/a21s android-installer/com.android.vending fire-android/30 fire-installations/17.0.0 fire-fcm/22.0.0 android-platform/ kotlin/1.9.23 android-target-sdk/34",
                "x-firebase-client-log-type": "3",
                "x-goog-api-key": apiKey,
                "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 11; SM-A217F Build/RP1A.200720.012)",
            },
        });

        // ensure auth token received
        if(!response.data.authToken || !response.data.authToken.token){
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
        const bytes = [];
        for (let i = 0; i < size; i++) {
            bytes.push(Math.floor(Math.random() * 256)); // Generate random byte in range 0-255
        }
        const buf = Buffer.from(bytes);
        buf[0] = 0b01110000 | (buf[0] & 0b00001111);

        // encode to base64 and remove padding
        return buf.toString("base64").replace(/=/g, "");
    }

}

export {AndroidFCM};