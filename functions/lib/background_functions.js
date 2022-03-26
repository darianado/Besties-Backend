"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.deleteFromFirestore = exports.createUser = void 0;
const functions = require("firebase-functions");
const uuid_1 = require("uuid");
const recommendationFunctions = require("./recommendation_functions");
const utility = require("./utility");
const models = require("./models");
const constants = require("./constants");
const admin = require("firebase-admin");
exports.createUser = functions.region(constants.DEPLOYMENT_REGION).firestore.document(`${constants.USERS_REF}/{userId}`).onCreate((snapshot, context) => {
    const user = models.userConverter.fromFirestore(snapshot, context);
    return recommendationFunctions.createRecommendations(user, (0, uuid_1.v4)());
});
exports.deleteFromFirestore = functions.region(constants.DEPLOYMENT_REGION).auth.user().onDelete(async (event) => {
    const uid = event.uid;
    const matchDocsQuery = admin.firestore().collection("matches").whereField("uids", "array-contains", uid).get(); //docs in which the user is a match
    const collectionRef = admin.firestore().collection("users").doc(uid); //document of the user to be deleted
    matchDocsQuery.docs.forEach(element => {
        element.ref.delete();
    });
    utility.deleteAllImagesForUser(uid);
    await collectionRef.collection(constants.USER_DERIVED_REF).doc(constants.USER_RECOMMENDATIONS_REF).delete();
    await collectionRef.delete();
});
exports.updateUser = functions.region(constants.DEPLOYMENT_REGION).firestore.document(`${constants.USERS_REF}/{userId}`).onUpdate((snapshot, context) => {
    const userBefore = models.userConverter.fromFirestore(snapshot.before, context);
    const userAfter = models.userConverter.fromFirestore(snapshot.after, context);
    if (!userBefore.preferences.equals(userAfter.preferences)) {
        return recommendationFunctions.createRecommendations(userAfter, (0, uuid_1.v4)());
    }
    return "No update";
});
//# sourceMappingURL=background_functions.js.map