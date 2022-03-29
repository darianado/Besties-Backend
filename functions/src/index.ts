const admin = require("firebase-admin");
admin.initializeApp();
const backgroundFunctions = require("./background_functions");
const recommendationFunctions = require("./recommendation_functions");
const matchmakingFunctions = require("./matchmaking_functions");

/* Background triggered functions for housekeeping. */
export const createUser = backgroundFunctions.createUser;
export const deleteFromFirestore = backgroundFunctions.deleteFromFirestore;
export const updateUser = backgroundFunctions.updateUser;

/* Functions related to recommending new users for a specific user. */
export const requestRecommendationsHTTP = recommendationFunctions.requestRecommendationsHTTP;
export const requestRecommendations = recommendationFunctions.requestRecommendations;

/* Functions related to 'liking' another user. */
export const likeUser = matchmakingFunctions.likeUser;
export const likeUserHTTP = matchmakingFunctions.likeUserHTTP;