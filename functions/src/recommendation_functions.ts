import { errorMessage, successMessage } from "./utility";
import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { CallableContext } from "firebase-functions/v1/https";
import { userConverter, recommendationConverter, User, Recommendations, IndexedUserID } from "./models";
import { v4 as uuidv4 } from 'uuid';
const utility = require("./utility");
const constants = require("./constants");
const refs = require("./firestore_refs");

// ###################################################
// # Helper functions for recommendation functions
// ###################################################

/**
 * Creates recommendations for a specific 'User'. This function creates matches based on 
 * maximum age, minimum age, gender, as well as similarity in interests between the user and other users in Firestore.
 * @param user A 'User' object for whom recommendations should be made
 * @param queueID A unique string that can be used to distinguish a completely new queue of recommendations.
 * @returns A Promise updating the recommendations document in Firestore.
 */
export const createRecommendations = async function(user: User, queueID: string) {
  const upperBoundDOB = utility.offsetCurrentDateByYears(user.preferences.minAge);
  const lowerBoundDOB = utility.offsetCurrentDateByYears(user.preferences.maxAge);

  var users = await refs.usersRef
                    .where(constants.USER_DOB_FIELD, '<=', upperBoundDOB)
                    .where(constants.USER_DOB_FIELD, '>=', lowerBoundDOB)
                    .where(constants.USER_GENDER_FIELD, 'in', user.preferences.genders)
                    .withConverter(userConverter)
                    .get()
                    .then((snapshot: firestore.QuerySnapshot) => {
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
  const recommendations = new Recommendations(queueID, users.length, users);
  return await refs.recommendationsRef(user.uid).withConverter(recommendationConverter).set(recommendations, { 'merge': true });
}

/**
 * Removes the desired number of recommendations from a 'Recommendations' object and saves the updated version to firestore.
 * @param n Desired of recommendations to remove (actual number may be less)
 * @param recommendationsObject 'Recommendations' object containing the recommendations to remove from.
 * @param ref A Firestore Document reference to the recommendation object which should be altered.
 * @returns Array of user IDs and their corresponding Jaccard index.
 */
const removeRecommendations = async function(n: number, recommendationsObject: Recommendations, ref: any) : Promise<IndexedUserID[]> {
  const popped = recommendationsObject.recommendations.splice(Math.max(recommendationsObject.recommendations.length - n, 0));
  await ref.withConverter(recommendationConverter).set(recommendationsObject, { 'merge': true });
  
  return popped;
}

/**
 * Requests a number of user IDs corresponding to recommendations for a specific user.
 * @param uid User ID of the person for whom the request is for
 * @param recs Desired number of recommendations to return (returned number may be less)
 * @param stop If false, the function may call itself again once to re-attempt fetching recommendations if none are returned.
 * @returns Array of user IDs corresponding to the recommended user. Highest index is best match.
 */
const _requestRecommendations = async function(uid: string, recs: number, stop: boolean = false) : Promise<string[]> {
  const user: User = (await refs.usersRef.doc(uid).withConverter(userConverter).get()).data();
  const recDocRef = refs.recommendationsRef(uid);

  const recommendations: Recommendations = (await recDocRef.withConverter(recommendationConverter).get()).data();

  if (recommendations != undefined && recommendations.recommendations.length >= 1) {

    const result = await removeRecommendations(recs, recommendations, recDocRef);
    if(recommendations.recommendations.length - result.length <= recommendations.lastNumberOfRecs * constants.THRESHOLD_FOR_GENERATING_RECOMMENDATIONS) {
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

// ###################################################
// # Directly callable functions
// ###################################################

/**
 * Firebase Function that returns a set of recommendations as a payload in the form
 * {
 *    "status": 200,
 *    "data": [
 *      "abc123",
 *      "bcd123"
 *    ]
 * }
 * 
 * The function must be called using the Google Cloud SDK from an authenticated context, as it uses
 * the 'uid' of the user in the active session to determine its response. 
 * The 'recs' (desired number of recommendations to fetch) parameter is also required, and must be parsed in the request payload/body.
 */
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

/**
 * Firebase Function that returns a set of recommendations as a json payload in the form
 * {
 *    "status": 200,
 *    "data": [
 *      "abc123",
 *      "bcd123"
 *    ]
 * }
 * 
 * The function requires that the body/payload of the request contains 
 * 'uid' (user ID of the person to get recommendations for) and 'recs' (desired number of recommendations to fetch) parameters.
 * 
 * The HTTP version of this function is required for platforms which do not support the Google Cloud SDK (like Python for the Backend Manager tool).
 */
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