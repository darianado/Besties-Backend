from datetime import timedelta
import os
from re import M
import time
from tracemalloc import Snapshot
import firebase_admin
from firebase_admin import credentials, firestore
from hashing import hash, compare
from functools import cmp_to_key

from flask import Flask, request

app = Flask(__name__)

class FirebaseHandler():
  CREDENTIALS_FILENAME = 'serviceAccountKey.json'
  def get_credentials(self, cert):
    try:
        return credentials.Certificate(cert)
    except:
        raise 

  def __init__(self):
      cred = self.get_credentials(self.CREDENTIALS_FILENAME)
      firebase_admin.initialize_app(cred)

      self.db = firestore.client()

  def db(self):
    return self.db


handler = FirebaseHandler()

@app.errorhandler(404)
def resource_not_found(e):
  return "404 - the requested page does not exist."



def getHashes():
  def docID(document):
    return document.id
  raw = handler.db.document("derived/hashes").collections()

  """
  startTimeOne = time.time()
  [doc.id for doc in raw]
  endTimeOne = time.time()
  print(f"Done: {endTimeOne - startTimeOne}")

  rawTwo = [i for i in range(1000)]
  startTimeTwo = time.time()
  [i + 1 for i in rawTwo]
  endTimeTwo = time.time()
  print(f"Done: {endTimeTwo - startTimeTwo}")
  """

  return [doc.id for doc in raw]


def getAllHashesSortedBySimilarity(hash):
  all_hashes = getHashes()

  def compare(a, b):
    simA = compare(hash, a)
    simB = compare(hash, b)

    if(simA < simB):
      return 1
    elif (simA > simB):
      return -1
    else:
      return 0

  all_hashes.sort()

  return all_hashes

def removeEntryFormList(entry, lst):
  return lst.remove(entry)


def getUsersFromHash(hash):
  snapshot = handler.db.document("derived/hashes").collection(hash).documents().get()
  def docID(document):
    return document.id
  return map(docID, snapshot)

def filterUsers(user_ids, filters):
  min_age = filters['min_age']
  max_age = filters['max_age']

  filtered_users = []

  snapshot = handler.db.collection('users').where('__name__', 'in', user_ids).get()

  for snap in snapshot:
    age = snap.to_dict()['age']

    if age >= min_age and age <= max_age:
      filtered_users.append(snap.id)

  return filtered_users



def getBetMatches(user_id, sorted_hashes, recs, max_age, min_age):
  final_matches = []

  while(len(final_matches) < recs and not len(final_matches) <= 0):
    potential_matches = getUsersFromHash(sorted_hashes.pop(0))
    filtered_matches = filterUsers(potential_matches, {'min_age': min_age, 'max_age': max_age})
    final_matches += filtered_matches

  #final_matches = removeEntryFormList(user_id, final_matches)

  return final_matches

@app.route("/recommend", methods=["GET"])
def recommend():
    user_id = request.args['user_id']
    recs = request.args['recs']
    min_age = request.args['min_age']
    max_age = request.args['max_age']

    start_time = time.time()

    user = handler.db.collection("users").document(user_id).get()
    user_hash = hash(user.to_dict()['interests'])

    #end_time = time.time()

    sorted_hashes = getAllHashesSortedBySimilarity(user_hash)
    end_time = time.time()
    matches = getBetMatches(user_id, sorted_hashes, int(recs), max_age, min_age)
    
    #end_time = time.time()

    return { "elapsed_secs": timedelta(seconds=end_time - start_time).seconds, "matches": "" }


@app.route("/test", methods=["GET"])
def test():
  start_time = time.time()
  cols = handler.db.collection("users").stream()

  [i.id for i in cols]
  end_time = time.time()

  start_time_2 = time.time()
  cols_2 = handler.db.document("derived/hashes").collections()

  [i.id for i in cols_2]
  end_time_2 = time.time()

  return { "Docs": timedelta(seconds=end_time - start_time).total_seconds(),
          "Cols": timedelta(seconds=end_time_2 - start_time_2).total_seconds() }

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))