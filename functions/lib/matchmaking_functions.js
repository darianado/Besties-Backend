"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeUserHTTP = exports.likeUser = exports._createMatch = void 0;
const constants = require("./constants");
const firebase_admin_1 = require("firebase-admin");
const functions = require("firebase-functions");
const uuid_1 = require("uuid");
const models_1 = require("./models");
const utility_1 = require("./utility");
const refs = require("./firestore_refs");
// ###################################################
// # Helper functions for matchmaking functions
// ###################################################
/**
 * Creates and stores a 'match' between two user ID's in Firestore.
 * @param uid1 The user ID of the first person in the match.
 * @param uid2 The user ID of the second person in the match.
 */
const _createMatch = async function (uid1, uid2) {
    const uuid = (0, uuid_1.v4)();
    await refs.matchesRef.doc(uuid).set({
        [constants.MATCH_TIMESTAMP_FIELD]: firebase_admin_1.firestore.Timestamp.now(),
        [constants.MATCH_USER_IDS_FIELD]: [uid1, uid2],
    }, { 'merge': true });
};
exports._createMatch = _createMatch;
/**
 * Gets an array of the people the given user has liked.
 * @param uid The user ID of the user
 * @returns The array of people they have liked
 */
const _getLikes = async function (uid) {
    const querySnapshot = await refs.usersRef.doc(uid).withConverter(models_1.userConverter).get();
    return querySnapshot.data().likes;
};
/**
 * Records a 'like' of a user by another user in Firestore, and
 * returns an object signalling if a match has been made at this stage.
 * @param userID The user ID of the user doing the liking.
 * @param otherUserID The user ID of the user being liked.
 * @returns An object describing if a match was made at this stage.
 */
const _likeUser = async function (userID, otherUserID) {
    const userLikes = await _getLikes(userID);
    const otherUsersLikes = await _getLikes(otherUserID);
    if (userLikes != null) {
        await refs.usersRef.doc(userID).set({
            [constants.USER_LIKES_FIELD]: firebase_admin_1.firestore.FieldValue.arrayUnion(otherUserID)
        }, { 'merge': true });
    }
    else {
        await refs.usersRef.doc(userID).set({
            [constants.USER_LIKES_FIELD]: [otherUserID]
        }, { 'merge': true });
    }
    if (otherUsersLikes != null && otherUsersLikes.includes(userID)) {
        (0, exports._createMatch)(userID, otherUserID);
        return { "matched": true };
    }
    return { "matched": false };
};
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
exports.likeUser = functions.region(constants.DEPLOYMENT_REGION).https.onCall(async (data, context) => {
    var _a;
    const likerUserID = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const otherUserID = data.profileUserID;
    if (likerUserID == null) {
        return (0, utility_1.errorMessage)("The caller must be authenticated.", 401);
    }
    if (otherUserID == null) {
        return (0, utility_1.errorMessage)("The 'otherUserID' parameter must be provided in the payload.", 400);
    }
    try {
        const result = await _likeUser(likerUserID, otherUserID);
        return (0, utility_1.successMessage)(result);
    }
    catch (err) {
        return (0, utility_1.errorMessage)(err.message);
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
exports.likeUserHTTP = functions.region(constants.DEPLOYMENT_REGION).https.onRequest(async (request, response) => {
    const likerUserID = request.body.likerUserID;
    const otherUserID = request.body.otherUserID;
    if (likerUserID == null) {
        response.send((0, utility_1.errorMessage)("The 'likerUserID' parameter must be provided in the payload.", 400));
    }
    if (otherUserID == null) {
        response.send((0, utility_1.errorMessage)("The 'otherUserID' parameter must be provided in the payload.", 400));
    }
    try {
        const result = await _likeUser(likerUserID, otherUserID);
        response.send((0, utility_1.successMessage)(result));
    }
    catch (err) {
        response.send((0, utility_1.errorMessage)(err.message));
    }
});
//# sourceMappingURL=matchmaking_functions.js.map