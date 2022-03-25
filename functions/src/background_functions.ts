import { auth } from 'firebase-admin';
import * as functions from 'firebase-functions';
import { v4 as uuidv4 } from 'uuid';
import { User } from './models';
const recommendationFunctions = require("./recommendation_functions");
const utility = require("./utility");
const models = require("./models");
const constants = require("./constants");
const admin = require("firebase-admin");


export const createUser = functions.region(constants.DEPLOYMENT_REGION).firestore.document(`${constants.USERS_REF}/{userId}`).onCreate((snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
  const user = models.userConverter.fromFirestore(snapshot, context);
  return recommendationFunctions.createRecommendations(user, uuidv4());
});

export const deleteFromFirestore = functions.region(constants.DEPLOYMENT_REGION).auth.user().onDelete(async (event : auth.UserRecord) => {
  const uid = event.uid;
  const collectionRef = admin.firestore().collection("users").doc(uid); //document of the user to be deleted
  
  utility.deleteAllImagesForUser(uid);
  await collectionRef.collection(constants.USER_DERIVED_REF).doc(constants.USER_RECOMMENDATIONS_REF).delete();
  await collectionRef.delete();
  //TO DO : Delete the matches involving that user 
});

export const updateUser = functions.region(constants.DEPLOYMENT_REGION).firestore.document(`${constants.USERS_REF}/{userId}`).onUpdate((snapshot: functions.Change<functions.firestore.QueryDocumentSnapshot>, context: functions.EventContext) => {
  const userBefore: User = models.userConverter.fromFirestore(snapshot.before, context);
  const userAfter: User = models.userConverter.fromFirestore(snapshot.after, context);

  if(!userBefore.preferences.equals(userAfter.preferences)) {
    return recommendationFunctions.createRecommendations(userAfter, uuidv4());
  }

  return "No update";
});