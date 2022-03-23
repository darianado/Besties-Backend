"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeUserHTTP = exports.likeUser = exports.requestRecommendations = exports.requestRecommendationsHTTP = exports.updateUser = exports.deleteUser = exports.createUser = void 0;
const admin = require("firebase-admin");
admin.initializeApp();
const backgroundFunctions = require("./background_functions");
const recommendationFunctions = require("./recommendation_functions");
const matchmakingFunctions = require("./matchmaking_functions");
exports.createUser = backgroundFunctions.createUser;
exports.deleteUser = backgroundFunctions.deleteUser;
exports.updateUser = backgroundFunctions.updateUser;
exports.requestRecommendationsHTTP = recommendationFunctions.requestRecommendationsHTTP;
exports.requestRecommendations = recommendationFunctions.requestRecommendations;
exports.likeUser = matchmakingFunctions.likeUser;
exports.likeUserHTTP = matchmakingFunctions.likeUserHTTP;
//# sourceMappingURL=index.js.map