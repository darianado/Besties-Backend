"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendationsRef = exports.matchesRef = exports.usersRef = void 0;
const admin = require("firebase-admin");
const constants = require("./constants");
/* Commonly used Firestore paths */
exports.usersRef = admin.firestore().collection(constants.USERS_REF);
exports.matchesRef = admin.firestore().collection(constants.MATCHES_REF);
const recommendationsRef = function (userID) {
    return exports.usersRef.doc(userID).collection(constants.USER_DERIVED_REF).doc(constants.USER_RECOMMENDATIONS_REF);
};
exports.recommendationsRef = recommendationsRef;
//# sourceMappingURL=firestore_refs.js.map