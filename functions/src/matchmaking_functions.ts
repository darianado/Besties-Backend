const constants = require("./constants");
import { firestore } from 'firebase-admin';
import * as functions from 'firebase-functions';
import { CallableContext } from 'firebase-functions/v1/https';
import { v4 as uuidv4 } from 'uuid';
import { userConverter } from './models';
import { errorMessage, successMessage } from './utility';
const refs = require("./firestore_refs");

// ###################################################
// # Helper functions for matchmaking functions
// ###################################################

/**
 * Creates and stores a 'match' between two user ID's in Firestore.
 * @param uid1 The user ID of the first person in the match.
 * @param uid2 The user ID of the second person in the match.
 */
export const _createMatch = async function(uid1: string, uid2: string) {
  const uuid = uuidv4();

  await refs.matchesRef.doc(uuid).set({
    [constants.MATCH_TIMESTAMP_FIELD]: firestore.Timestamp.now(),
    [constants.MATCH_USER_IDS_FIELD]: [uid1, uid2],
  }, { 'merge': true });
}

/**
 * Gets an array of the people the given user has liked.
 * @param uid The user ID of the user
 * @returns The array of people they have liked
 */
const _getLikes = async function(uid: string) {
  const querySnapshot = await refs.usersRef.doc(uid).withConverter(userConverter).get();
  return querySnapshot.data().likes; 
}

/**
 * Records a 'like' of a user by another user in Firestore, and 
 * returns an object signalling if a match has been made at this stage.
 * @param userID The user ID of the user doing the liking.
 * @param otherUserID The user ID of the user being liked.
 * @returns An object describing if a match was made at this stage.
 */
const _likeUser = async function(userID: string, otherUserID: string) {
  const userLikes: string[] = await _getLikes(userID);
  const otherUsersLikes: string[] = await _getLikes(otherUserID);

  if(userLikes != null) {
    await refs.usersRef.doc(userID).set({
      [constants.USER_LIKES_FIELD]: firestore.FieldValue.arrayUnion(otherUserID)}, { 'merge': true });
  } else {
    await refs.usersRef.doc(userID).set({
      [constants.USER_LIKES_FIELD]: [otherUserID]}, { 'merge': true });
  }

  if (otherUsersLikes != null && otherUsersLikes.includes(userID)) {
    _createMatch(userID, otherUserID);
    return {"matched": true};
  }

  return {"matched": false};
}

// ###################################################
// # Directly callable functions
// ###################################################

/**
 * Firebase Function that records a 'like' given by one user to another. It returns a payload in the form 
 * {
 *    "status": 200,
 *    "data": {
 *      "matched": true
 *    }
 * }
 * 
 * The function must be called using the Google Cloud SDK from an authenticated context, as it uses
 * the 'uid' of the user in the active session to determine its response. 
 * The 'otherUserID' (user ID of the person being liked) parameter is also required, and must be parsed in the request payload/body.
 */
export const likeUser = functions.region(constants.DEPLOYMENT_REGION).https.onCall(async (data: any, context: CallableContext) => {
  const likerUserID = context.auth?.uid;
  const otherUserID = data.profileUserID;
 
  if(likerUserID == null) {
    return errorMessage("The caller must be authenticated.", 401);
  }

  if(otherUserID == null) {
    return errorMessage("The 'otherUserID' parameter must be provided in the payload.", 400);
  }

  try {
    const result = await _likeUser(likerUserID, otherUserID);
    return successMessage(result);
  } catch(err) {
    return errorMessage((err as Error).message);
  }
});

/**
 * Firebase Function that records a 'like' given by one user to another. It returns a json payload in the form 
 * {
 *    "status": 200,
 *    "data": {
 *      "matched": true
 *    }
 * }
 * 
 * The function requires that the body/payload of the request contains 
 * 'userID' (user ID of the user making the like) and 'otherUserID' (user ID of the user being liked) parameters.
 * 
 * The HTTP version of this function is required for platforms which do not support the Google Cloud SDK (like Python for the Backend Manager tool).
 */
export const likeUserHTTP = functions.region(constants.DEPLOYMENT_REGION).https.onRequest(async (request: functions.https.Request, response: functions.Response<any>) => {
  const likerUserID = request.body.likerUserID
  const otherUserID =  request.body.otherUserID

  if(likerUserID == null) {
    response.send(errorMessage("The 'likerUserID' parameter must be provided in the payload.", 400));
  }

  if(otherUserID == null) {
    response.send(errorMessage("The 'otherUserID' parameter must be provided in the payload.", 400));
  }

  
  try {
    const result = await _likeUser(likerUserID, otherUserID);
    response.send(successMessage(result));
  } catch(err) {
    response.send(errorMessage((err as Error).message));
  }
});