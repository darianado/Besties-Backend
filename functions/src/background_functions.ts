import { auth, firestore } from 'firebase-admin';
import * as functions from 'firebase-functions';
import { v4 as uuidv4 } from 'uuid';
import { User } from './models';
const recommendationFunctions = require("./recommendation_functions");
const models = require("./models");
const constants = require("./constants");
const admin = require("firebase-admin");
const refs = require("./firestore_refs");


// ###################################################
// # Helper functions for background triggers
// ###################################################

/**
 * Deletes the Firestore document associated with the given user.
 * @param userID The user ID of the user.
 */
const _removeUserData = async function(userID: string) {
  await refs.usersRef.doc(userID).delete();
}

/**
 * Deletes the Firestore document representing a given user's recommendations.
 * @param userID The user ID of the user.
 */
const _removeRecommendations = async function(userID: string) {
  await refs.recommendationsRef(userID).delete();
}

/**
 * Deletes all images that are associated with the given user.
 * @param userID The user ID of the user.
 */
const _removeImages = async function(userID: string) {
  await admin.storage().bucket().deleteFiles({ prefix: `${constants.USER_PROFILE_PICTURES_FOLDER}/${userID}` });
}

/**
 * Deletes all matches that the given user is part of.
 * @param userID The user ID of the user.
 */
const _removeMatches = async function(userID: string) {
  const matchDocsQuery: firestore.QuerySnapshot = await refs.matchesRef.where(constants.MATCH_USER_IDS_FIELD, "array-contains", userID).get();
  if(matchDocsQuery.docs != undefined) {
    matchDocsQuery.docs.forEach(async element => {
      await _removeMessages(element.id);
      await element.ref.delete();
    });
  }
}

/**
 * Deletes all messages contained within a given match.
 * @param matchID The ID of the match whose messages are to be deleted.
 */
const _removeMessages = async function(matchID: string) {
  const messagesDocsQuery: firestore.QuerySnapshot = await refs.messagesRef(matchID).get();
  if(messagesDocsQuery != undefined) {
    messagesDocsQuery.docs.forEach(async element => {
      await element.ref.delete();
    });
  }
}


// ###################################################
// # Background triggers
// ###################################################

/**
 * Firestore Function that should not be called directly.
 * Listens for any new documents in the 'users' collection in Firestore and 
 * starts the creation of a new recommendations-queue.
 */
export const createUser = functions.region(constants.DEPLOYMENT_REGION).firestore.document(`${constants.USERS_REF}/{userId}`).onCreate((snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
  const user = models.userConverter.fromFirestore(snapshot, context);
  return recommendationFunctions.createRecommendations(user, uuidv4());
});

/**
 * Firestore Function that should not be called directly.
 * Listens for user deletions from Firebase Authentication and deletes all associated images, matches, recommendations and data about that user.
 */
export const deleteFromFirestore = functions.region(constants.DEPLOYMENT_REGION).auth.user().onDelete(async (event : auth.UserRecord) => {
  const uid = event.uid;
  await _removeImages(uid);
  await _removeMatches(uid);
  await _removeRecommendations(uid);
  return _removeUserData(uid);
});

/**
 * Firestore Function that should not be called directly.
 * Listens for updates to any document in the 'users' collection in Firestore and 
 * starts the creation of a new recommendations-queue if that user's preferences have changed.
 */
export const updateUser = functions.region(constants.DEPLOYMENT_REGION).firestore.document(`${constants.USERS_REF}/{userId}`).onUpdate((snapshot: functions.Change<functions.firestore.QueryDocumentSnapshot>, context: functions.EventContext) => {
  const userBefore: User = models.userConverter.fromFirestore(snapshot.before, context);
  const userAfter: User = models.userConverter.fromFirestore(snapshot.after, context);

  if(!userBefore.preferences.equals(userAfter.preferences)) {
    return recommendationFunctions.createRecommendations(userAfter, uuidv4());
  }

  return null;
});