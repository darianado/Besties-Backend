"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.deleteFromFirestore = exports.createUser = void 0;
const functions = require("firebase-functions");
const uuid_1 = require("uuid");
const recommendationFunctions = require("./recommendation_functions");
const models = require("./models");
const constants = require("./constants");
const admin = require("firebase-admin");
// ###################################################
// # Helper functions for background triggers
// ###################################################
/**
 * Deletes the Firestore document associated with the given user.
 * @param userID The user ID of the user.
 */
const _removeUserData = async function (userID) {
    await admin.firestore().collection(constants.USERS_REF).doc(userID).delete();
};
/**
 * Deletes the Firestore document representing a given user's recommendations.
 * @param userID The user ID of the user.
 */
const _removeRecommendations = async function (userID) {
    await admin.firestore().collection(constants.USERS_REF).doc(userID).collection(constants.USER_DERIVED_REF).doc(constants.USER_RECOMMENDATIONS_REF).delete();
};
/**
 * Deletes all images that are associated with the given user.
 * @param userID The user ID of the user.
 */
const _removeImages = async function (userID) {
    await admin.storage().bucket().deleteFiles({ prefix: `${constants.USER_PROFILE_PICTURES_FOLDER}/${userID}` });
};
/**
 * Deletes all matches that the given user is part of.
 * @param userID The user ID of the user.
 */
const _removeMatches = async function (userID) {
    const matchDocsQuery = await admin.firestore().collection(constants.MATCHES_REF).where(constants.MATCH_USER_IDS_FIELD, "array-contains", userID).get();
    if (matchDocsQuery.docs != undefined) {
        matchDocsQuery.docs.forEach(async (element) => {
            await element.ref.delete();
        });
    }
};
// ###################################################
// # Background triggers
// ###################################################
/**
 * Firestore Function that should not be called directly.
 * Listens for any new documents in the 'users' collection in Firestore and
 * starts the creation of a new recommendations-queue.
 */
exports.createUser = functions.region(constants.DEPLOYMENT_REGION).firestore.document(`${constants.USERS_REF}/{userId}`).onCreate((snapshot, context) => {
    const user = models.userConverter.fromFirestore(snapshot, context);
    return recommendationFunctions.createRecommendations(user, (0, uuid_1.v4)());
});
/**
 * Firestore Function that should not be called directly.
 * Listens for user deletions from Firebase Authentication and deletes all associated images, matches, recommendations and data about that user.
 */
exports.deleteFromFirestore = functions.region(constants.DEPLOYMENT_REGION).auth.user().onDelete(async (event) => {
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
exports.updateUser = functions.region(constants.DEPLOYMENT_REGION).firestore.document(`${constants.USERS_REF}/{userId}`).onUpdate((snapshot, context) => {
    const userBefore = models.userConverter.fromFirestore(snapshot.before, context);
    const userAfter = models.userConverter.fromFirestore(snapshot.after, context);
    if (!userBefore.preferences.equals(userAfter.preferences)) {
        return recommendationFunctions.createRecommendations(userAfter, (0, uuid_1.v4)());
    }
    return null;
});
//# sourceMappingURL=background_functions.js.map