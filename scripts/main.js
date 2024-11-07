// main.js
import FCMManager from './FCMManager.js';

FCMManager.fcmRegister().then(() => {
    console.log('registration complete.');
    FCMManager.fcmListen().then(()=>{
        console.log('Listening for data...');
    }).catch((error)=>{
        console.error('Could not connect');
    });
}).catch((error) => {
    console.error('Error during FCM registration:', error);
});