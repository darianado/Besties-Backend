"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.like = exports.createMatch = void 0;
const constants = require("./constants");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const createMatch = async function () {
    await admin.firestore().collection("test").doc().set({
        "field": 2,
    }, { 'merge': true });
};
exports.createMatch = createMatch;
exports.like = functions.region(constants.DEPLOYMENT_REGION).https.onCall(async (data, context) => {
    var _a;
    const uid = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid;
    const otherUID = data.otherUID;
    console.log(uid);
    // Check if who you like is liking you back
});
//# sourceMappingURL=matchmaking_functions.js.map