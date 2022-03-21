import * as functions from 'firebase-functions';
const recommendationFunctions = require("./recommendation_functions");
const utility = require("./utility");
const models = require("./models");
const constants = require("./constants");


export const createUser = functions.region(constants.DEPLOYMENT_REGION).firestore.document(`${constants.USERS_REF}/{userId}`).onCreate((snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
  const user = models.userConverter.fromFirestore(snapshot, context);
  return recommendationFunctions.createRecommendations(user);
});


export const deleteUser = functions.region(constants.DEPLOYMENT_REGION).firestore.document(`${constants.USERS_REF}/{userId}`).onDelete((snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
  utility.deleteAllImagesForUser(snapshot.id);
  return snapshot.ref.collection(constants.USER_DERIVED_REF).doc(constants.USER_RECOMMENDATIONS_REF).delete();
});

export const updateUser = functions.region(constants.DEPLOYMENT_REGION).firestore.document(`${constants.USERS_REF}/{userId}`).onUpdate((snapshot: functions.Change<functions.firestore.QueryDocumentSnapshot>, context: functions.EventContext) => {
  const userBefore = models.userConverter.fromFirestore(snapshot.before, context);
  const userAfter = models.userConverter.fromFirestore(snapshot.after, context);

  if(userBefore.preferences == userAfter.preferences) {
    return;
  }

  return recommendationFunctions.createRecommendations(userAfter);
});