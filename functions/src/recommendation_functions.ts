import { errorMessage, successMessage } from "./utility";
import * as functions from 'firebase-functions';
import { CallableContext } from "firebase-functions/v1/https";
import { userConverter, recommendationConverter, User, Recommendations, IndexedUserID } from "./models";
import { v4 as uuidv4 } from 'uuid';
const admin = require("firebase-admin");
const utility = require("./utility");
const constants = require("./constants");

export const createRecommendations = async function(user: User, queueID: string) {
  await admin.firestore().collection(constants.USERS_REF).doc(user.uid).set({"preferences": { "queueID": queueID }}, { 'merge': true });


  const upperBoundDOB = utility.offsetCurrentDateByYears(user.preferences.minAge);
  const lowerBoundDOB = utility.offsetCurrentDateByYears(user.preferences.maxAge);

  //console.log(`Looking for people born between ${lowerBoundDOB} and ${upperBoundDOB}`);

  var users = await admin.firestore().collection(constants.USERS_REF)
                                            .where(constants.USER_DOB_FIELD, '<=', upperBoundDOB)
                                            .where(constants.USER_DOB_FIELD, '>=', lowerBoundDOB)
                                            .where('gender', 'in', user.preferences.genders)
                                            .withConverter(userConverter)
                                            .get()
                                            .then((snapshot: any) => {
                                              return snapshot.docs
                                                  .map((doc: any) => doc.data())
                                                  .filter((entry: User) => entry.uid != user.uid)
                                                  .filter((entry: User) => (user.likes != null) ? !user.likes.includes(entry.uid) : true)
                                                  .map((entry: User) => {
                                                    const index = utility.compareCategorizedInterests(entry.categorizedInterests, user.preferences.categorizedInterests);
                                                    return new IndexedUserID(entry.uid, index);
                                                  })
                                                  .sort((entryA: IndexedUserID, entryB: IndexedUserID) => {
                                                    return ((entryA.index < entryB.index) ? -1 : ((entryA.index > entryB.index) ? 1 : 0));
                                                  });
                                            });



  users = users.slice(0, constants.MAX_NUMBER_OF_RECOMMENDATIONS_TO_GENERATE);

  console.log("users: " + users.length);

  const recommendations = new Recommendations(queueID, users.length, users);

  console.log("recommendations: " + recommendations.recommendations.length);

  return await admin.firestore().collection(constants.USERS_REF).doc(user.uid).collection(constants.USER_DERIVED_REF).doc(constants.USER_RECOMMENDATIONS_REF).withConverter(recommendationConverter).set(recommendations, { 'merge': true });
}

const removeRecommendations = async function(n: number, recommendationsObject: Recommendations, ref: any) {
  const popped = recommendationsObject.recommendations.splice(Math.max(recommendationsObject.recommendations.length - n, 0));
  await ref.withConverter(recommendationConverter).set(recommendationsObject, { 'merge': true });
  
  return popped;
}

const _requestRecommendations = async function(uid: string, recs: number, stop: boolean = false) : Promise<string[]> {
  const user = (await admin.firestore().collection(constants.USERS_REF).doc(uid).withConverter(userConverter).get()).data();
  const recDocRef = admin.firestore().collection(constants.USERS_REF).doc(uid).collection(constants.USER_DERIVED_REF).doc(constants.USER_RECOMMENDATIONS_REF);

  const recommendations: Recommendations = (await recDocRef.withConverter(recommendationConverter).get()).data();

  if (recommendations != undefined && recommendations.recommendations.length >= 1) {

    const result = await removeRecommendations(recs, recommendations, recDocRef);
    if(recommendations.recommendations.length - result.length <= recommendations.numberOfRecommendations * constants.THRESHOLD_FOR_GENERATING_RECOMMENDATIONS) {
      // Add new entries to the queue, if there is less than 10% of the original users in the queue.
      createRecommendations(user, recommendations.queueID);
    }
    return result.map((e: IndexedUserID) => e.uid);

  } else if(recommendations != undefined) {
    await createRecommendations(user, recommendations.queueID);
  } else {
    await createRecommendations(user, uuidv4());
  }

  if(stop) {
    return [];
  } else {
    return _requestRecommendations(uid, recs, true);
  }
};


export const requestRecommendations = functions.region(constants.DEPLOYMENT_REGION).https.onCall(async (data: any, context: CallableContext) => {
  const uid = context.auth?.uid;
  const recs = data.recs;
  if(uid == null) {
    return errorMessage("The caller must be authenticated.", 401);
  }

  if(recs == null) {
    return errorMessage("The 'recs' parameter must be provided in the payload.", 400);
  }

  

  try {
    const result = await _requestRecommendations(uid, recs);
  return successMessage(result);
  } catch(err) {
    return errorMessage((err as Error).message);
  }
})

export const requestRecommendationsHTTP = functions.region(constants.DEPLOYMENT_REGION).https.onRequest(async (request: functions.https.Request, response: functions.Response<any>) => {
  const uid = request.body.uid;
  const recs = request.body.recs;
  
  if(uid == null) {
    response.send(errorMessage("The 'uid' parameter must be provided in the payload.", 400));
  }

  if(recs == null) {
    response.send(errorMessage("The 'recs' parameter must be provided in the payload.", 400));
  }


  try {
    const result = await _requestRecommendations(uid, recs);
    const responsePayload = successMessage(result);
    response.send(responsePayload);
  } catch(err) {
    const responsePayload = errorMessage((err as Error).message);
    response.send(responsePayload);
  }
});