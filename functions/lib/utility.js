"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.offsetCurrentDateByYears = exports.errorMessage = exports.successMessage = exports.deleteAllImagesForUser = exports.compareCategorizedInterests = exports.compareSet = exports.compareHash = exports.unhash = exports.hash = void 0;
const jaccard = require('jaccard');
const admin = require("firebase-admin");
const constants = require("./constants");
const hash = function (arr) {
    return arr.join("#").toUpperCase();
};
exports.hash = hash;
const unhash = function (hash) {
    return hash.split("#");
};
exports.unhash = unhash;
const compareHash = function (h1, h2) {
    const h1_unhashed = exports.unhash(h1);
    const h2_unhashed = exports.unhash(h2);
    return jaccard.index(h1_unhashed, h2_unhashed);
};
exports.compareHash = compareHash;
const compareSet = function (s1, s2) {
    return jaccard.index(s1, s2);
};
exports.compareSet = compareSet;
const compareCategorizedInterests = function (c1, c2) {
    const s1 = c1.getFlattenedInterests();
    const s2 = c2.getFlattenedInterests();
    const index = jaccard.index(s1, s2);
    if (index > 0.6) {
        console.log("Found a pretty good match.");
    }
    return index;
};
exports.compareCategorizedInterests = compareCategorizedInterests;
const deleteAllImagesForUser = async function (userId) {
    const bucket = admin.storage().bucket();
    return bucket.deleteFiles({
        prefix: `${constants.USER_AVATAR_FOLDER_REF}/${userId}`
    });
};
exports.deleteAllImagesForUser = deleteAllImagesForUser;
const successMessage = function (data, status = 200) {
    return {
        "status": status,
        "data": data
    };
};
exports.successMessage = successMessage;
const errorMessage = function (message, status = 400) {
    return {
        "status": status,
        "message": message
    };
};
exports.errorMessage = errorMessage;
const offsetCurrentDateByYears = function (years) {
    const currentDate = new Date();
    return new Date(currentDate.setFullYear(currentDate.getFullYear() - years));
};
exports.offsetCurrentDateByYears = offsetCurrentDateByYears;
//# sourceMappingURL=utility.js.map