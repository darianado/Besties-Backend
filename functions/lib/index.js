"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeUserHTTP = exports.likeUser = exports.requestRecommendations = exports.requestRecommendationsHTTP = exports.updateUser = exports.deleteFromFirestore = exports.createUser = void 0;
const admin = require("firebase-admin");
admin.initializeApp();
const backgroundFunctions = require("./background_functions");
const recommendationFunctions = require("./recommendation_functions");
const matchmakingFunctions = require("./matchmaking_functions");
/* Background triggered functions for housekeeping. */
exports.createUser = backgroundFunctions.createUser;
exports.deleteFromFirestore = backgroundFunctions.deleteFromFirestore;
exports.updateUser = backgroundFunctions.updateUser;
/* Functions related to recommending new users for a specific user. */
exports.requestRecommendationsHTTP = recommendationFunctions.requestRecommendationsHTTP;
exports.requestRecommendations = recommendationFunctions.requestRecommendations;
/* Functions related to 'liking' another user. */
exports.likeUser = matchmakingFunctions.likeUser;
exports.likeUserHTTP = matchmakingFunctions.likeUserHTTP;
//# sourceMappingURL=index.js.map