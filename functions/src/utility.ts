const jaccard = require('jaccard');
import { CategorizedInterests } from "./models";

/**
 * Calculates the Jaccard index (intersection over union) of the interests contained in the two objects to be compared.
 * @param c1 A 'CategorizedInterests' object to compare
 * @param c2 A 'CategorizedInterests' object to compare
 * @returns The Jaccard-index of similarity between the interests in the two sets.
 */
export const compareCategorizedInterests = function(c1: CategorizedInterests, c2: CategorizedInterests) : number {
  const s1 = c1.getFlattenedInterests()
  const s2 = c2.getFlattenedInterests()
  const index = jaccard.index(s1, s2);
  return index
}

/**
 * Creates a success message.
 * Can be used to return to any caller when the requested function executed as intended.
 * @param data Object to return as payload/result of the function
 * @param status HTTP-like status code that indicates the context of the result
 * @returns Success message object
 */
export const successMessage = function(data: object, status: number = 200) : object {
  return {
    "status": status,
    "data": data
  };
}

/**
 * Creates an error message.
 * Can be used to return to any caller when the requested function could not execute as intended.
 * @param message Message to be sent in 'message' field
 * @param status HTTP-like status code that supports the message
 * @returns Error message object
 */
export const errorMessage = function(message: string, status: number = 400) : object {
  return {
    "status": status,
    "message": message
  };
}

/**
 * Offsets the current date by an amount of years in the past.
 * @param years Number of years to offset by (in negative direction)
 * @returns Offset date
 */
export const offsetCurrentDateByYears = function(years: number) : Date {
  const currentDate = new Date();
  return new Date(currentDate.setFullYear(currentDate.getFullYear() - years));
}