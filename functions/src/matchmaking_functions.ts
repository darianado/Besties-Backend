const constants = require("./constants");
import { firestore } from 'firebase-admin';
import * as functions from 'firebase-functions';
import { CallableContext } from 'firebase-functions/v1/https';
import { userConverter } from './models';
import { errorMessage, successMessage } from './utility';
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


const _likeUser = async function(userID: string, otherUserID: string) {
  const collectionRef = admin.firestore().collection("users");

  const userLikes: string[] = await getLikes(userID);
  const otherUsersLikes: string[] = await getLikes(otherUserID);

  if(userLikes != null) {
    await collectionRef.doc(userID).set({
      "likes": firestore.FieldValue.arrayUnion(otherUserID)}, { 'merge': true });
  } else {
    await collectionRef.doc(userID).set({
      "likes": [otherUserID]}, { 'merge': true });
  }

  if (otherUsersLikes != null && otherUsersLikes.includes(userID)) {
    createMatch(userID, otherUserID);
    return {"matched": true};
  }

  return {"matched": false};
}


export const likeUser = functions.region(constants.DEPLOYMENT_REGION).https.onCall(async (data: any, context: CallableContext) => {
  const userID = context.auth?.uid;
  const otherUserID = data.likerUserID;
 
  if(userID == null) {
    return errorMessage("The caller must be authenticated.", 401);
  }

  if(otherUserID == null) {
    return errorMessage("The 'otherUserID' parameter must be provided in the payload.", 400);
  }

  const result = await _likeUser(userID, otherUserID);

  return successMessage(result);
});

export const likeUserHTTP = functions.region(constants.DEPLOYMENT_REGION).https.onRequest(async (request: functions.https.Request, response: functions.Response<any>) => {
  const userID = request.body.likerUserID
  const otherUserID =  request.body.otherUserID

  if(userID == null) {
    response.send(errorMessage("The 'userID' parameter must be provided in the payload.", 400));
  }

  if(otherUserID == null) {
    response.send(errorMessage("The 'otherUserID' parameter must be provided in the payload.", 400));
  }

  const result = await _likeUser(userID, otherUserID);

  response.send(successMessage(result));
});