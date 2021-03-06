'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const chatApi = require('./chat-api');




//PUSH NOTIFICATION

 // invio di una singola notifica push ad un utente (direct)
 exports.sendNotification = functions.database.ref('/apps/{app_id}/users/{sender_id}/messages/{recipient_id}/{message_id}').onCreate(event => {
    const message_id = event.params.message_id;
    const sender_id = event.params.sender_id; 
    const recipient_id = event.params.recipient_id;
    const app_id = event.params.app_id;
    const message = event.data.current.val();

    // DEBUG console.log("sender_id: "+ sender_id + ", recipient_id : " + recipient_id + ", app_id: " + app_id + ", message_id: " + message_id);
   
    // DEBUG console.log('message ' + JSON.stringify(message));


    // la funzione termina se si tenta di mandare la notifica ad un gruppo
    // if (message.channel_type!="direct") { //is a group message
    //     return 0;
    // }

//    DEBUG console.log("message.status : " + message.status);     
    if (message.status != chatApi.CHAT_MESSAGE_STATUS.DELIVERED){
        return 0;
    }
    
    const promises = [];

    if (sender_id == recipient_id) {
        console.log('not send push notification for the same user');
        //if sender is receiver, don't send notification
        return 0;
    }

    const text = message.text;
    const messageTimestamp = JSON.stringify(message.timestamp);
    
    // DEBUG console.log(`--->/apps/${app_id}/users/${sender_id}/instanceId`);

    return admin.database().ref(`/apps/${app_id}/users/${sender_id}/instanceId`).once('value').then(function(instanceIdAsObj) {
      
        //console.log('instanceIdAsObj ' + instanceIdAsObj); 

        var instanceId = instanceIdAsObj.val();

        // DEBUG console.log('instanceId ' + instanceId); 
        
        //https://firebase.google.com/docs/cloud-messaging/concept-options#notifications_and_data_messages
        const payload = {
            notification: {
            title: message.sender_fullname,
            body: text,
            icon : "ic_notification_small",
            sound : "default",
            //click_action: "ACTION_DEFAULT_CHAT_INTENT", // uncomment for default intent filter in the sdk module
            click_action: "NEW_MESSAGE", // uncomment for intent filter in your custom project
        },
    
            data: {
                recipient: message.recipient,
                recipient_fullname: message.recipient_fullname,                    
                sender: message.sender,
                sender_fullname: message.sender_fullname,     
                channel_type: message.channel_type,
                text: text,
                //timestamp : JSON.stringify(admin.database.ServerValue.TIMESTAMP)
                timestamp : new Date().getTime().toString()
            }
        };
        
        // DEBUG console.log('payload ', payload);

        return admin.messaging().sendToDevice(instanceId, payload)
             .then(function (response) {
            console.log("Push notification for message "+ JSON.stringify(message) + " with payload "+ JSON.stringify(payload) +" sent with response ",  JSON.stringify(response));
            
            // console.log("Successfully sent message: stringifiedresponse: ", JSON.stringify(response));
            console.log("Message.results[0]:", JSON.stringify(response.results[0]));


            //             // For each message check if there was an error.
            // const tokensToRemove = [];
            // response.results.forEach((result, index) => {
            //     const error = result.error;
            //     if (error) {
            //     console.error('Failure sending notification to', tokens[index], error);
            //     // Cleanup the tokens who are not registered anymore.
            //     if (error.code === 'messaging/invalid-registration-token' ||
            //         error.code === 'messaging/registration-token-not-registered') {
            //         tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
            //     }
            //     }
            // });
            // return Promise.all(tokensToRemove);

        })
        .catch(function (error) {
            console.log("Error sending message:", error);
        });

    });

    //return 0;

});





  
  