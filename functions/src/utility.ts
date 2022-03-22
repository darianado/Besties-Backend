const jaccard = require('jaccard');
const admin = require("firebase-admin");
const constants = require("./constants");
import { CategorizedInterests } from "./models";

export const hash = function(arr: string[]) {
  return arr.join("#").toUpperCase();
}

export const unhash = function(hash: string) {
  return hash.split("#")
}

export const compareHash = function(h1: string, h2: string) {
  const h1_unhashed = exports.unhash(h1);
  const h2_unhashed = exports.unhash(h2);
  return jaccard.index(h1_unhashed, h2_unhashed);
}

export const compareSet = function(s1: string[], s2: string[]) {
  return jaccard.index(s1, s2);
}

export const compareCategorizedInterests = function(c1: CategorizedInterests, c2: CategorizedInterests) {
  const s1 = c1.getFlattenedInterests()
  const s2 = c2.getFlattenedInterests()
  const index = jaccard.index(s1, s2);

  if(index > 0.6) {
    console.log("Found a pretty good match.")
  }

  return index
}

export const deleteAllImagesForUser = async function(userId: string) {
  const bucket = admin.storage().bucket();
  return bucket.deleteFiles({
    prefix: `${constants.USER_AVATAR_FOLDER_REF}/${userId}`
  });
}

export const successMessage = function(data: any, status: number = 200) {
  return {
    "status": status,
    "data": data
  };
}

export const errorMessage = function(message: string, status: number = 400) {
  return {
    "status": status,
    "message": message
  };
}

export const offsetCurrentDateByYears = function(years: number) {
  const currentDate = new Date();
  return new Date(currentDate.setFullYear(currentDate.getFullYear() - years));
}