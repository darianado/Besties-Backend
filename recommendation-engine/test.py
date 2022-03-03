from datetime import timedelta
import time
import firebase_admin
from firebase_admin import credentials, firestore


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


raw = handler.db.document("derived/hashes").collections()

start_time = time.time()

[i.id for i in raw]

end_time = time.time()

print(f"elapsed time: {timedelta(seconds=end_time - start_time).total_seconds()}")