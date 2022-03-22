"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeUserHTTP = exports.likeUser = exports.createMatch = void 0;
const constants = require("./constants");
const firebase_admin_1 = require("firebase-admin");
const functions = require("firebase-functions");
const models_1 = require("./models");
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
exports.likeUser = functions.region(constants.DEPLOYMENT_REGION).https.onCall(async (data, context) => {
    var _a;
    const uid = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const profileID = data.likerUserID; // data.likeeUserID
    const collectionRef = admin.firestore().collection("users");
    const profileLikes = await getLikes(profileID);
    await collectionRef.doc(uid).set({
        "likes": firebase_admin_1.firestore.FieldValue.arrayUnion([profileID])
    }, { 'merge': true });
    if (profileLikes.includes(uid)) {
        (0, exports.createMatch)(uid, profileID);
    }
    else
        return;
});
exports.likeUserHTTP = functions.region(constants.DEPLOYMENT_REGION).https.onRequest(async (request, response) => {
    const uid = request.body.likerUserID;
    const profileID = request.body.likeeUserID;
    const collectionRef = admin.firestore().collection("users");
    const profileLikes = await getLikes(profileID);
    await collectionRef.doc(uid).set({
        "likes": firebase_admin_1.firestore.FieldValue.arrayUnion([profileID])
    }, { 'merge': true });
    if (profileLikes.includes(uid)) {
        (0, exports.createMatch)(uid, profileID);
    }
    else
        return;
});
//# sourceMappingURL=matchmaking_functions.js.map