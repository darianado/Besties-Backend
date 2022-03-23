"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeUserHTTP = exports.likeUser = exports.createMatch = void 0;
const constants = require("./constants");
const firebase_admin_1 = require("firebase-admin");
const functions = require("firebase-functions");
const models_1 = require("./models");
const utility_1 = require("./utility");
const admin = require("firebase-admin");
const createMatch = async function (uid1, uid2) {
    await admin.firestore().collection("matches").doc().set({
        "uid1": uid1,
        "uid2": uid2,
    }, { 'merge': true });
};
exports.createMatch = createMatch;
const getLikes = async function (uid) {
    const querySnapshot = await admin.firestore().collection("users").doc(uid).withConverter(models_1.userConverter).get();
    return querySnapshot.data().likes;
};
const _likeUser = async function (userID, otherUserID) {
    const collectionRef = admin.firestore().collection("users");
    const userLikes = await getLikes(userID);
    const otherUsersLikes = await getLikes(otherUserID);
    if (userLikes != null) {
        await collectionRef.doc(userID).set({
            "likes": firebase_admin_1.firestore.FieldValue.arrayUnion(otherUserID)
        }, { 'merge': true });
    }
    else {
        await collectionRef.doc(userID).set({
            "likes": [otherUserID]
        }, { 'merge': true });
    }
    if (otherUsersLikes != null && otherUsersLikes.includes(userID)) {
        (0, exports.createMatch)(userID, otherUserID);
        return { "matched": true };
    }
    return { "matched": false };
};
exports.likeUser = functions.region(constants.DEPLOYMENT_REGION).https.onCall(async (data, context) => {
    var _a;
    const userID = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const otherUserID = data.profileUserID;
    if (userID == null) {
        return (0, utility_1.errorMessage)("The caller must be authenticated.", 401);
    }
    if (otherUserID == null) {
        return (0, utility_1.errorMessage)("The 'otherUserID' parameter must be provided in the payload.", 400);
    }
    const result = await _likeUser(userID, otherUserID);
    return (0, utility_1.successMessage)(result);
});
exports.likeUserHTTP = functions.region(constants.DEPLOYMENT_REGION).https.onRequest(async (request, response) => {
    const userID = request.body.likerUserID;
    const otherUserID = request.body.otherUserID;
    if (userID == null) {
        response.send((0, utility_1.errorMessage)("The 'userID' parameter must be provided in the payload.", 400));
    }
    if (otherUserID == null) {
        response.send((0, utility_1.errorMessage)("The 'otherUserID' parameter must be provided in the payload.", 400));
    }
    const result = await _likeUser(userID, otherUserID);
    response.send((0, utility_1.successMessage)(result));
});
//# sourceMappingURL=matchmaking_functions.js.map