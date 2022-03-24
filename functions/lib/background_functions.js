"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.deleteFromFirestore = exports.createUser = void 0;
const functions = require("firebase-functions");
const recommendationFunctions = require("./recommendation_functions");
const utility = require("./utility");
const models = require("./models");
const constants = require("./constants");
const admin = require("firebase-admin");
exports.createUser = functions.region(constants.DEPLOYMENT_REGION).firestore.document(`${constants.USERS_REF}/{userId}`).onCreate((snapshot, context) => {
    const user = models.userConverter.fromFirestore(snapshot, context);
    return recommendationFunctions.createRecommendations(user);
});
// export const deleteUser = functions.region(constants.DEPLOYMENT_REGION).firestore.document(`${constants.USERS_REF}/{userId}`).onDelete((snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
//   utility.deleteAllImagesForUser(snapshot.id);
//   return snapshot.ref.collection(constants.USER_DERIVED_REF).doc(constants.USER_RECOMMENDATIONS_REF).delete();
// });
exports.deleteFromFirestore = functions.region(constants.DEPLOYMENT_REGION).auth.user().onDelete(async (event) => {
    const uid = event.uid;
    const collectionRef = admin.firestore().collection("users").doc(uid); //document of the user to be deleted
    utility.deleteAllImagesForUser(uid);
    await collectionRef.collection(constants.USER_DERIVED_REF).doc(constants.USER_RECOMMENDATIONS_REF).delete();
    await collectionRef.delete();
    //TO DO : Delete the matches involving that user 
});
exports.updateUser = functions.region(constants.DEPLOYMENT_REGION).firestore.document(`${constants.USERS_REF}/{userId}`).onUpdate((snapshot, context) => {
    const userBefore = models.userConverter.fromFirestore(snapshot.before, context);
    const userAfter = models.userConverter.fromFirestore(snapshot.after, context);
    if (userBefore.preferences == userAfter.preferences) {
        return;
    }
    return recommendationFunctions.createRecommendations(userAfter);
});
//# sourceMappingURL=background_functions.js.map