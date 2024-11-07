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
        try {
            // Construct the URL
            const url = `https://firebaseinstallations.googleapis.com/v1/projects/${projectId}/installations`;
    
            // Create the body
            const body = {
                "fid": this.generateFirebaseFID(),
                "appId": gmsAppId,
                "authVersion": "FIS_v2",
                "sdkVersion": "a:17.0.0"
            };
    
            // Set the headers
            const headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-Android-Package": androidPackage,  // Package name from your app
                "X-Android-Cert": androidCert,  // SHA1 certificate fingerprint
                "x-firebase-client": "android-min-sdk/23 fire-core/20.0.0 device-name/a2…oid-platform/ kotlin/1.9.23 android-target-sdk/34",  // Firebase-specific header, could be more dynamic if needed
                "x-goog-api-key": apiKey  // Your Firebase API key
            };
    
            // Send the request to Firebase Installations API
            const response = await axios.post(url, body, { headers });
    
            // Check if the response contains the authToken and return it
            if (response.data.authToken && response.data.authToken.token) {
                return response.data.authToken.token;
            } else {
                throw new Error(`Failed to get Firebase installation AuthToken: ${JSON.stringify(response.data)}`);
            }
    
        } catch (error) {
            if (error.response) {
                // Log API-specific errors
                console.error(`Request failed with status code ${error.response.status}`);
                console.error(`Response data: ${JSON.stringify(error.response.data)}`);
            } else {
                // Log network or general errors
                console.error("Error during Firebase Installation request:", error.message);
            }
            throw error;  // Re-throw the error for further handling
        }
    }

    static async registerRequest(installationAuthToken, apiKey, androidPackageName, androidPackageCert, retry = 0) {

        // register gcm
        const registerResponse = await axios.post("https://android.clients.google.com/c2dm/register3", {
            "device": androidId,
            "app": androidPackageName,
            "cert": androidPackageCert,
            "app_ver": "1",
            "X-subtype" : gcmSenderId,
            "X-app_ver" : "1",
            "X-osv" : "29",
            "X-cliv" : "fiid-21.1.1",
            "X-gmsv" : "220217001",
            // "X-appid" : "",
            "X-scope" : "*",
            "X-Goog-Firebase-Installations-Auth" : installationAuthToken,
            "X-gms_app_id" : gmsAppId,
            "X-Firebase-Client" : "android-min-sdk/23 fire-core/20.0.0 device-name/a21snnxx device-brand/samsung device-model/a21s android-installer/com.android.vending fire-android/30 fire-installations/17.0.0 fire-fcm/22.0.0 android-platform/ kotlin/1.9.23 android-target-sdk/34",
            // "X-firebase-app-name-hash" : "",
            "X-Firebase-Client-Log-Type": "1",
            "X-app_ver_name": "1",
            "target_ver": "31",
            "sender": gcmSenderId,
        }, {
            headers : {
                "Authorization": `AidLogin ${androidId}:${securityToken}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        // retry a few times if needed
        const data = registerResponse.data;
        if(data.includes('Error')){
            console.warn(`Register request has failed with ${data}`);
            if(retry >= 5){
                throw new Error('GCM register has failed');
            }
            console.warn(`Retry... ${retry + 1}`);
            await waitFor(1000);
            return this.registerRequest(androidId, securityToken, installationAuthToken, apiKey, gcmSenderId, gmsAppId, androidPackageName, androidPackageCert, retry + 1);
        }

        // extract fcm token from response
        return registerResponse.data.split("=")[1];
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