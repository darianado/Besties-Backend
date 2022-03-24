const admin = require("firebase-admin");
admin.initializeApp();

const backgroundFunctions = require("./background_functions");
const recommendationFunctions = require("./recommendation_functions");
const matchmakingFunctions = require("./matchmaking_functions");

export const createUser = backgroundFunctions.createUser;
export const deleteFromFirestore = backgroundFunctions.deleteFromFirestore;
export const updateUser = backgroundFunctions.updateUser;

export const requestRecommendationsHTTP = recommendationFunctions.requestRecommendationsHTTP;
export const requestRecommendations = recommendationFunctions.requestRecommendations;

export const likeUser = matchmakingFunctions.likeUser;
export const likeUserHTTP = matchmakingFunctions.likeUserHTTP;