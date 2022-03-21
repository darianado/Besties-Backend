const constants = require("./constants");
import * as functions from 'firebase-functions';
import { CallableContext } from 'firebase-functions/v1/https';
const admin = require("firebase-admin");

export const createMatch = async function() {
  await admin.firestore().collection("test").doc().set({
    "field": 2,
  }, { 'merge': true });
}

export const like = functions.region(constants.DEPLOYMENT_REGION).https.onCall(async (data: any, context: CallableContext) => {
  const uid = context.auth?.uid;
  const otherUID = data.otherUID;
  console.log(uid);
  // Check if who you like is liking you back
});