"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestRecommendationsHTTP = exports.requestRecommendations = exports.createRecommendations = void 0;
const utility_1 = require("./utility");
const functions = require("firebase-functions");
const models_1 = require("./models");
const uuid_1 = require("uuid");
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
const createRecommendations = async function (user, queueID) {
    const upperBoundDOB = utility.offsetCurrentDateByYears(user.preferences.minAge);
    const lowerBoundDOB = utility.offsetCurrentDateByYears(user.preferences.maxAge);
    var users = await refs.usersRef
        .where(constants.USER_DOB_FIELD, '<=', upperBoundDOB)
        .where(constants.USER_DOB_FIELD, '>=', lowerBoundDOB)
        .where(constants.USER_GENDER_FIELD, 'in', user.preferences.genders)
        .withConverter(models_1.userConverter)
        .get()
        .then((snapshot) => {
        return snapshot.docs
            .map((doc) => doc.data())
            .filter((entry) => entry.uid != user.uid)
            .filter((entry) => (user.likes != null) ? !user.likes.includes(entry.uid) : true)
            .map((entry) => {
            const index = utility.compareCategorizedInterests(entry.categorizedInterests, user.preferences.categorizedInterests);
            return new models_1.IndexedUserID(entry.uid, index);
        })
            .sort((entryA, entryB) => {
            return ((entryA.index < entryB.index) ? -1 : ((entryA.index > entryB.index) ? 1 : 0));
        });
    });
    users = users.slice(0, constants.MAX_NUMBER_OF_RECOMMENDATIONS_TO_GENERATE);
    const recommendations = new models_1.Recommendations(queueID, users.length, users);
    return await refs.recommendationsRef(user.uid).withConverter(models_1.recommendationConverter).set(recommendations, { 'merge': true });
};
exports.createRecommendations = createRecommendations;
/**
 * Removes the desired number of recommendations from a 'Recommendations' object and saves the updated version to firestore.
 * @param n Desired of recommendations to remove (actual number may be less)
 * @param recommendationsObject 'Recommendations' object containing the recommendations to remove from.
 * @param ref A Firestore Document reference to the recommendation object which should be altered.
 * @returns Array of user IDs and their corresponding Jaccard index.
 */
const removeRecommendations = async function (n, recommendationsObject, ref) {
    const popped = recommendationsObject.recommendations.splice(Math.max(recommendationsObject.recommendations.length - n, 0));
    await ref.withConverter(models_1.recommendationConverter).set(recommendationsObject, { 'merge': true });
    return popped;
};
/**
 * Requests a number of user IDs corresponding to recommendations for a specific user.
 * @param uid User ID of the person for whom the request is for
 * @param recs Desired number of recommendations to return (returned number may be less)
 * @param stop If false, the function may call itself again once to re-attempt fetching recommendations if none are returned.
 * @returns Array of user IDs corresponding to the recommended user. Highest index is best match.
 */
const _requestRecommendations = async function (uid, recs, stop = false) {
    const user = (await refs.usersRef.doc(uid).withConverter(models_1.userConverter).get()).data();
    const recDocRef = refs.recommendationsRef(uid);
    const recommendations = (await recDocRef.withConverter(models_1.recommendationConverter).get()).data();
    if (recommendations != undefined && recommendations.recommendations.length >= 1) {
        const result = await removeRecommendations(recs, recommendations, recDocRef);
        if (recommendations.recommendations.length - result.length <= recommendations.lastNumberOfRecs * constants.THRESHOLD_FOR_GENERATING_RECOMMENDATIONS) {
            (0, exports.createRecommendations)(user, recommendations.queueID);
        }
        return result.map((e) => e.uid);
    }
    else if (recommendations != undefined) {
        await (0, exports.createRecommendations)(user, recommendations.queueID);
    }
    else {
        await (0, exports.createRecommendations)(user, (0, uuid_1.v4)());
    }
    if (stop) {
        return [];
    }
    else {
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
exports.requestRecommendations = functions.region(constants.DEPLOYMENT_REGION).https.onCall(async (data, context) => {
    var _a;
    const uid = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const recs = data.recs;
    if (uid == null) {
        return (0, utility_1.errorMessage)("The caller must be authenticated.", 401);
    }
    if (recs == null) {
        return (0, utility_1.errorMessage)("The 'recs' parameter must be provided in the payload.", 400);
    }
    try {
        const result = await _requestRecommendations(uid, recs);
        return (0, utility_1.successMessage)(result);
    }
    catch (err) {
        return (0, utility_1.errorMessage)(err.message);
    }
});
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
exports.requestRecommendationsHTTP = functions.region(constants.DEPLOYMENT_REGION).https.onRequest(async (request, response) => {
    const uid = request.body.uid;
    const recs = request.body.recs;
    if (uid == null) {
        response.send((0, utility_1.errorMessage)("The 'uid' parameter must be provided in the payload.", 400));
    }
    if (recs == null) {
        response.send((0, utility_1.errorMessage)("The 'recs' parameter must be provided in the payload.", 400));
    }
    try {
        const result = await _requestRecommendations(uid, recs);
        const responsePayload = (0, utility_1.successMessage)(result);
        response.send(responsePayload);
    }
    catch (err) {
        const responsePayload = (0, utility_1.errorMessage)(err.message);
        response.send(responsePayload);
    }
});
//# sourceMappingURL=recommendation_functions.js.map