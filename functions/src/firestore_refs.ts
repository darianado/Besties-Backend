const admin = require("firebase-admin");
import { firestore } from 'firebase-admin';
const constants = require("./constants");

/* Commonly used Firestore paths */
export const usersRef: firestore.CollectionReference = admin.firestore().collection(constants.USERS_REF);
export const matchesRef: firestore.CollectionReference = admin.firestore().collection(constants.MATCHES_REF);
export const recommendationsRef = function(userID: string) : firestore.DocumentReference {
  return usersRef.doc(userID).collection(constants.USER_DERIVED_REF).doc(constants.USER_RECOMMENDATIONS_REF);
}
export const messagesRef = function(matchID: string) : firestore.CollectionReference {
  return matchesRef.doc(matchID).collection(constants.MATCH_MESSAGES_REF)
}