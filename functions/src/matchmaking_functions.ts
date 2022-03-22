const constants = require("./constants");
import { firestore } from 'firebase-admin';
import * as functions from 'firebase-functions';
import { CallableContext } from 'firebase-functions/v1/https';
import { userConverter } from './models';
const admin = require("firebase-admin");


export const createMatch = async function( uid1 : any , uid2 : any ) {
  await admin.firestore().collection("matches").doc().set({
    "uid1": uid1,
    "uid2": uid2,
  }, { 'merge': true });
}

const getLikes = async function(uid: string) {
  const querySnapshot = await admin.firestore().collection("users").doc(uid).withConverter(userConverter).get();
  return querySnapshot.data().likes; 
}

export const likeUser = functions.region(constants.DEPLOYMENT_REGION).https.onCall(async (data: any, context: CallableContext) => {
  const uid = context.auth?.uid;
  const profileID = data.likerUserID; // data.likeeUserID
  const collectionRef = admin.firestore().collection("users") ;
 

  const profileLikes: any [] = await getLikes(profileID);


  await collectionRef.doc(uid).set({
    "likes": firestore.FieldValue.arrayUnion([profileID])}, { 'merge': true });

  if (profileLikes.includes(uid)) { 
     createMatch(uid, profileID) ; 
    }
  else return;


});

export const likeUserHTTP = functions.region(constants.DEPLOYMENT_REGION).https.onRequest(async (request: functions.https.Request, response: functions.Response<any>) => {
  const uid = request.body.likerUserID
  const profileID =  request.body.likeeUserID
  const collectionRef = admin.firestore().collection("users") ;
 

  const profileLikes: any [] = await getLikes(profileID);


  await collectionRef.doc(uid).set({
    "likes": firestore.FieldValue.arrayUnion([profileID])}, { 'merge': true });

  if (profileLikes.includes(uid)) { 
     createMatch(uid, profileID) ; 
    }
  else return;


});