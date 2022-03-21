"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestRecommendationsHTTP = exports.requestRecommendations = exports.createRecommendations = void 0;
const utility_1 = require("./utility");
const functions = require("firebase-functions");
const models_1 = require("./models");
const admin = require("firebase-admin");
const utility = require("./utility");
const constants = require("./constants");
const createRecommendations = async function (user) {
    const upperBoundDOB = utility.offsetCurrentDateByYears(user.preferences.maxAge);
    const lowerBoundDOB = utility.offsetCurrentDateByYears(user.preferences.minAge);
    var users = await admin.firestore().collection(constants.USERS_REF)
        .where(constants.USER_DOB_FIELD, '<=', upperBoundDOB)
        .where(constants.USER_DOB_FIELD, '>=', lowerBoundDOB)
        //.where(constants.USER_INTERESTS_FIELD, 'array-contains-any', user.preferences.interests)
        .withConverter(models_1.userConverter)
        .get()
        .then((snapshot) => {
        return snapshot.docs
            .map((doc) => doc.data())
            .filter((entry) => entry.uid != user.uid)
            .sort((userA, userB) => {
            const similarityA = utility.compareCategorizedInterests(userA.categorizedInterests, userB.preferences.categorizedInterests);
            const similarityB = utility.compareCategorizedInterests(userA.categorizedInterests, userB.preferences.categorizedInterests);
            return ((similarityA < similarityB) ? -1 : ((similarityA > similarityB) ? 1 : 0));
        });
    });
    users = users.slice(0, constants.MAX_NUMBER_OF_RECOMMENDATIONS_TO_GENERATE);
    console.log("users: " + users.length);
    const recommendations = new models_1.Recommendations(users.length, users);
    console.log("recommendations: " + recommendations.entries.length);
    return await admin.firestore().collection(constants.USERS_REF).doc(user.uid).collection(constants.USER_DERIVED_REF).doc(constants.USER_RECOMMENDATIONS_REF).withConverter(models_1.recommendationConverter).set(recommendations, { 'merge': true });
};
exports.createRecommendations = createRecommendations;
const removeRecommendations = async function (n, entries, ref) {
    const popped = entries.slice(Math.max(entries.length - n, 0));
    await ref.set({
        [constants.RECOMMENDATIONS_ENTRIES_ARRAY_FIELD]: entries.slice(0, entries.length - popped.length)
    }, { 'merge': true });
    return popped;
};
const _requestRecommendations = async function (uid, recs) {
    const user = (await admin.firestore().collection(constants.USERS_REF).doc(uid).withConverter(models_1.userConverter).get()).data();
    const recommendations = (await admin.firestore().collection(constants.USERS_REF).doc(uid).collection(constants.USER_DERIVED_REF).doc(constants.USER_RECOMMENDATIONS_REF).withConverter(models_1.recommendationConverter).get()).data();
    if (recommendations.entries.length >= 1) {
        // Return entries as they are, (async append to queue with new recs).
        const result = await removeRecommendations(recs, recommendations.entries, admin.firestore().collection(constants.USERS_REF).doc(uid).collection(constants.USER_DERIVED_REF).doc(constants.USER_RECOMMENDATIONS_REF));
        if (recommendations.entries.length - result.length <= recommendations.lastNumberOfRecs * constants.THRESHOLD_FOR_GENERATING_RECOMMENDATIONS) {
            // Add new entries to the queue, if there is less than 10% of the original users in the queue.
            (0, exports.createRecommendations)(user);
        }
        return { 'data': result };
    }
    else {
        // await append to queue, and return result, no matter what it is.
        await (0, exports.createRecommendations)(user);
        const newRecDoc = await admin.firestore().collection(constants.USERS_REF).doc(uid).collection(constants.USER_DERIVED_REF).doc(constants.USER_RECOMMENDATIONS_REF).get();
        const result = await removeRecommendations(recs, newRecDoc.data().entries, admin.firestore().collection(constants.USERS_REF).doc(uid).collection(constants.USER_DERIVED_REF).doc(constants.USER_RECOMMENDATIONS_REF));
        return { 'data': result };
    }
};
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
    const result = _requestRecommendations(uid, recs);
    return (0, utility_1.successMessage)(result);
});
exports.requestRecommendationsHTTP = functions.region(constants.DEPLOYMENT_REGION).https.onRequest(async (request, response) => {
    const uid = request.body.uid;
    const recs = request.body.recs;
    if (uid == null) {
        response.send((0, utility_1.errorMessage)("The 'uid' parameter must be provided in the payload.", 400));
    }
    if (recs == null) {
        response.send((0, utility_1.errorMessage)("The 'recs' parameter must be provided in the payload.", 400));
    }
    const result = _requestRecommendations(uid, recs);
    response.send((0, utility_1.successMessage)(result));
});
//# sourceMappingURL=recommendation_functions.js.map