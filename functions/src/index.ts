const admin = require("firebase-admin");
admin.initializeApp();

const backgroundFunctions = require("./background_functions");
const recommendationFunctions = require("./recommendation_functions");
const matchmakingFunctions = require("./matchmaking_functions");

export const createUser = backgroundFunctions.createUser;
export const deleteUser = backgroundFunctions.deleteUser;
export const updateUser = backgroundFunctions.updateUser;

export const requestRecommendationsHTTP = recommendationFunctions.requestRecommendationsHTTP;
export const requestRecommendations = recommendationFunctions.requestRecommendations;

export const test = matchmakingFunctions.test;